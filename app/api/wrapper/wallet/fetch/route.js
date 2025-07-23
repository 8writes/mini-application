import { LRUCache } from "lru-cache";
import { cookies } from "next/headers";
import { billzpaddiAuth } from "../../admin/route";

// Optimized rate limiting with LRU cache
const rateLimitCache = new LRUCache({
  max: 1000, // Max IPs to track
  ttl: 60 * 1000, // 1 minute TTL
});

const RATE_LIMIT_MAX = 10; // 10 requests per minute

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

// Predefined allowed domains
const ALLOWED_DOMAINS = new Set([
  "https://billzpaddi.com.ng",
  "https://www.billzpaddi.com.ng",
 // "http://localhost:3000",
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

export async function POST(req) {
  // 1. CSRF Token Verification
  const csrfToken = req.headers.get("X-CSRF-Token");
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("token")?.value;
  if (!csrfToken || csrfToken !== cookieToken) {
    return ERROR_RESPONSES.invalidRequest;
  }

  // 2. API Key Authentication
  const apiKey = req.headers.get("authorization")?.split("Bearer ")[1];
  if (!apiKey || apiKey !== process.env.NEXT_PUBLIC_BILLZ_AUTH_KEY) {
    return ERROR_RESPONSES.unauthorized;
  }

  // 3. Rate Limiting
  {
    /**
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const currentCount = rateLimitCache.get(clientIp) || 0;
  if (currentCount >= RATE_LIMIT_MAX) {
    return ERROR_RESPONSES.tooManyRequests;
  }
  rateLimitCache.set(clientIp, currentCount + 1);*/
  }

  // 4. Origin Check
  const origin = req.headers.get("origin");
  if (origin && !ALLOWED_DOMAINS.has(origin)) {
    return ERROR_RESPONSES.unauthorizedDomain;
  }

  // 5. Method Validation
  if (req.method !== "POST") {
    return ERROR_RESPONSES.methodNotAllowed;
  }

  // 6. Content-Type Validation
  const contentType = req.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return ERROR_RESPONSES.invalidContentType;
  }

  try {
    const { user_id, user_ids } = await req.json();

    let query = billzpaddiAuth
      .from("wallets")
      .select("user_id, balance, updated_at, limit, users(email), pin");

    if (user_id) query = query.eq("user_id", user_id).single();

    if (user_ids) query = query.in("user_id", user_ids);

    const { data, error } = await query;

    if (error) {
      return ERROR_RESPONSES.serverError(error.message);
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: SECURITY_HEADERS,
    });
  } catch (err) {
    return ERROR_RESPONSES.serverError();
  }
}
