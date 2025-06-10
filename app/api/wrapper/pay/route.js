import axios from "axios";

// Rate limiting setup
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute

// Request configuration
const INITIAL_REQUEST_TIMEOUT = 10000; // 10 seconds for initial request
const REQUERY_TIMEOUT = 5000; // 5 seconds for requery
const MAX_REQUERY_ATTEMPTS = 3;
const REQUERY_DELAY = 3000; // 3 seconds between requeries

// Security headers template
const getSecurityHeaders = () => ({
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

export async function POST(request) {
  // 1. Verify CSRF Token
  const csrfToken = request.headers.get("X-CSRF-Token");
  const cookieToken = request.cookies.get("token")?.value;

  if (!csrfToken || csrfToken !== cookieToken) {
    return new Response("Invalid request", { status: 403 });
  }

  // 2. API Key Authentication
  const apiKey = request.headers.get("authorization")?.split("Bearer ")[1];
  if (!apiKey || apiKey !== process.env.NEXT_PUBLIC_BILLZ_AUTH_KEY) {
    return new Response(
      JSON.stringify({ message: "Unauthorized", ok: false }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 3. Rate limiting by IP
  const clientIp =
    request.headers.get("x-forwarded-for") || request.ip || "unknown";
  const currentTime = Date.now();

  if (rateLimit.has(clientIp)) {
    const { count, firstRequestTime } = rateLimit.get(clientIp);

    if (currentTime - firstRequestTime < RATE_LIMIT_WINDOW) {
      if (count >= RATE_LIMIT_MAX) {
        return new Response(
          JSON.stringify({
            message: "Too many requests. Please try again later.",
            ok: false,
          }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }
      rateLimit.set(clientIp, { count: count + 1, firstRequestTime });
    } else {
      rateLimit.set(clientIp, { count: 1, firstRequestTime: currentTime });
    }
  } else {
    rateLimit.set(clientIp, { count: 1, firstRequestTime: currentTime });
  }

  // 4. Strict Origin Checking
  const origin = request.headers.get("origin");
  const allowedDomains = [
    "https://billzpaddi.com.ng",
    "https://www.billzpaddi.com.ng",
  ];

  if (origin && !allowedDomains.includes(origin)) {
    return new Response(
      JSON.stringify({ message: "Unauthorized domain", ok: false }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // 5. Method Validation
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ message: "Method not allowed", ok: false }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  // 6. Content-Type Validation
  const contentType = request.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return new Response(
      JSON.stringify({ message: "Invalid content type", ok: false }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
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
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 8. Phone Number Validation (Nigerian numbers)
    const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
    if (!phoneRegex.test(body.phone)) {
      return new Response(
        JSON.stringify({
          message: "Invalid Nigerian phone number format",
          ok: false,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 9. Amount Validation
    if (isNaN(body.amount) || body.amount <= 0) {
      return new Response(
        JSON.stringify({
          message: "Invalid amount",
          ok: false,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 10. Make the VTpass API call with requery logic
    let response;
    let attempts = 0;
    let lastError;

    while (attempts <= MAX_REQUERY_ATTEMPTS) {
      try {
        response = await axios.post(
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
            timeout: attempts === 0 ? INITIAL_REQUEST_TIMEOUT : REQUERY_TIMEOUT,
          }
        );

        // Check transaction status for requery
        const transactionStatus = response.data?.content?.transactions?.status;
        if (transactionStatus === "pending") {
          if (attempts < MAX_REQUERY_ATTEMPTS) {
            await new Promise((resolve) => setTimeout(resolve, REQUERY_DELAY));
            attempts++;
            continue;
          } else {
            return new Response(JSON.stringify(response.data), {
              status: 200,
              headers: getSecurityHeaders(),
            });
          }
        }

        // Successful response
        return new Response(JSON.stringify(response.data), {
          status: 200,
          headers: getSecurityHeaders(),
        });
      } catch (error) {
        lastError = error;
        attempts++;

        // Don't requery on client errors
        if (
          error.response?.status &&
          [400, 401, 403].includes(error.response.status)
        ) {
          break;
        }

        if (attempts <= MAX_REQUERY_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, REQUERY_DELAY));
        }
      }
    }

    // All requery attempts failed
    console.error("Transaction failed after retries:", lastError.message);
    return new Response(
      JSON.stringify({
        message:
          lastError.response?.data?.message ||
          "Transaction failed after multiple attempts",
        ok: false,
      }),
      {
        status: lastError.response?.status || 500,
        headers: getSecurityHeaders(),
      }
    );
  } catch (error) {
    console.error("Server error:", error.message);

    let errorMessage = "An unexpected error occurred";
    let statusCode = 500;

    if (error instanceof SyntaxError) {
      errorMessage = "Invalid JSON payload";
      statusCode = 400;
    }

    return new Response(JSON.stringify({ message: errorMessage, ok: false }), {
      status: statusCode,
      headers: getSecurityHeaders(),
    });
  }
}
