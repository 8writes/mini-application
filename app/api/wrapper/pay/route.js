import axios from "axios";
import { LRUCache } from "lru-cache";

// Optimized rate limiting with LRU cache
const rateLimitCache = new LRUCache({
  max: 1000, // Max IPs to track
  ttl: 60 * 1000, // 1 minute TTL
});

const RATE_LIMIT_MAX = 10; // 10 requests per minute

// Request configuration
const REQUEST_TIMEOUTS = {
  initial: 10000, // 10 seconds for initial request
  retry: 5000, // 5 seconds for retry
};
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 3000; // 3 seconds between retries

// Predefined security headers (static for optimization)
const SECURITY_HEADERS = Object.freeze({
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "https://billzpaddi.com.ng",
  "Access-Control-Allow-Methods": "POST",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy": "default-src 'self' https://billzpaddi.com.ng",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
});

// Precompiled regex for phone validation
const PHONE_REGEX = /^(\+234|0)[789][01]\d{8}$/;

// Predefined allowed domains
const ALLOWED_DOMAINS = new Set([
  "https://billzpaddi.com.ng",
  "https://www.billzpaddi.com.ng",
]);

// Error response templates
const ERROR_RESPONSES = {
  invalidRequest: new Response("Invalid request", { status: 403 }),
  unauthorized: new Response(
    JSON.stringify({ message: "Unauthorized", ok: false }),
    { status: 401, headers: SECURITY_HEADERS }
  ),
  tooManyRequests: new Response(
    JSON.stringify({
      message: "Too many requests. Please try again later.",
      ok: false,
    }),
    { status: 429, headers: SECURITY_HEADERS }
  ),
  unauthorizedDomain: new Response(
    JSON.stringify({ message: "Unauthorized domain", ok: false }),
    { status: 403, headers: SECURITY_HEADERS }
  ),
  methodNotAllowed: new Response(
    JSON.stringify({ message: "Method not allowed", ok: false }),
    { status: 405, headers: SECURITY_HEADERS }
  ),
  invalidContentType: new Response(
    JSON.stringify({ message: "Invalid content type", ok: false }),
    { status: 400, headers: SECURITY_HEADERS }
  ),
  invalidPhone: new Response(
    JSON.stringify({
      message: "Invalid Nigerian phone number format",
      ok: false,
    }),
    { status: 400, headers: SECURITY_HEADERS }
  ),
  invalidAmount: new Response(
    JSON.stringify({
      message: "Invalid amount",
      ok: false,
    }),
    { status: 400, headers: SECURITY_HEADERS }
  ),
  serverError: (message = "An unexpected error occurred") =>
    new Response(JSON.stringify({ message, ok: false }), {
      status: 500,
      headers: SECURITY_HEADERS,
    }),
};

export async function POST(request) {
  // 1. CSRF Token Verification
  const csrfToken = request.headers.get("X-CSRF-Token");
  const cookieToken = request.cookies.get("token")?.value;
  if (!csrfToken || csrfToken !== cookieToken) {
    return ERROR_RESPONSES.invalidRequest;
  }

  // 2. API Key Authentication
  const apiKey = request.headers.get("authorization")?.split("Bearer ")[1];
  if (!apiKey || apiKey !== process.env.NEXT_PUBLIC_BILLZ_AUTH_KEY) {
    return ERROR_RESPONSES.unauthorized;
  }

  // 3. Optimized Rate Limiting
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() || // Get first IP if multiple
    request.ip ||
    "unknown";

  const currentCount = rateLimitCache.get(clientIp) || 0;
  if (currentCount >= RATE_LIMIT_MAX) {
    return ERROR_RESPONSES.tooManyRequests;
  }
  rateLimitCache.set(clientIp, currentCount + 1);

  // 4. Strict Origin Checking
  const origin = request.headers.get("origin");
  if (origin && !ALLOWED_DOMAINS.has(origin)) {
    return ERROR_RESPONSES.unauthorizedDomain;
  }

  // 5. Method Validation
  if (request.method !== "POST") {
    return ERROR_RESPONSES.methodNotAllowed;
  }

  // 6. Content-Type Validation
  const contentType = request.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return ERROR_RESPONSES.invalidContentType;
  }

  try {
    const body = await request.json();

    // 7. Request Body Validation
    const requiredFields = ["request_id", "amount"];
    const missingFields = requiredFields.filter((field) => !body[field]);
    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({
          message: `Missing required fields: ${missingFields.join(", ")}`,
          ok: false,
        }),
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    // 8. Phone Number Validation
    if (!PHONE_REGEX.test(body.phone)) {
      return ERROR_RESPONSES.invalidPhone;
    }

    // 9. Amount Validation
    if (isNaN(body.amount) || body.amount <= 0) {
      return ERROR_RESPONSES.invalidAmount;
    }

    // 10. Optimized VTpass API call with retry logic
    const makeVtpassRequest = async (attempt = 0) => {
      try {
        const response = await axios.post(
          "https://vtpass.com/api/pay",
          {
            serviceID: body.serviceID,
            variation_code: body.variation_code,
            billersCode: body.billersCode,
            request_id: body.request_id,
            phone: body.phone,
            amount: body.amount,
          },
          {
            headers: {
              "api-key": process.env.NEXT_PUBLIC_BILLZ_API_KEY,
              "secret-key": process.env.BILLZ_SECRET_KEY,
              "Content-Type": "application/json",
            },
            timeout:
              attempt === 0 ? REQUEST_TIMEOUTS.initial : REQUEST_TIMEOUTS.retry,
          }
        );

        const transactionStatus = response.data?.content?.transactions?.status;

        if (transactionStatus === "pending" && attempt < MAX_RETRY_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
          return makeVtpassRequest(attempt + 1);
        }

        return response;
      } catch (error) {
        if (
          attempt < MAX_RETRY_ATTEMPTS &&
          ![400, 401, 403].includes(error.response?.status)
        ) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
          return makeVtpassRequest(attempt + 1);
        }
        throw error;
      }
    };

    const response = await makeVtpassRequest();
    return new Response(JSON.stringify(response.data), {
      status: 200,
      headers: SECURITY_HEADERS,
    });
  } catch (error) {
    console.error("API Error:", error.message);

    if (error instanceof SyntaxError) {
      return new Response(
        JSON.stringify({ message: "Invalid JSON payload", ok: false }),
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    return ERROR_RESPONSES.serverError(
      error.response?.data?.message ||
        "Transaction failed after multiple attempts"
    );
  }
}
