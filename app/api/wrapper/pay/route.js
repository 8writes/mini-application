import axios from "axios";

// Rate limiting setup
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute

export async function POST(request) {
  // 1. Verify CSRF Token
  const csrfToken = request.headers.get("X-CSRF-Token");
  const cookieToken = request.cookies.get("token")?.value;

  if (!csrfToken || csrfToken !== cookieToken) {
    return new Response("Invalid request", { status: 403 });
  }

  // API Key Authentication
  const apiKey = request.headers.get("authorization")?.split("Bearer ")[1];
  if (!apiKey || apiKey !== process.env.NEXT_PUBLIC_BILLZ_AUTH_KEY) {
    return new Response(JSON.stringify({ message: "Fuck Off", ok: false }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Rate limiting by IP
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

  // Strict Origin Checking
  const origin = request.headers.get("origin");
  const allowedDomains = [
    "https://billzpaddi.com.ng",
    "https://www.billzpaddi.com.ng",
    "http://localhost:3000",
  ];

  if (origin && !allowedDomains.includes(origin)) {
    return new Response(
      JSON.stringify({ message: "Unauthorized domain", ok: false }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // Method Validation (redundant here because Next.js maps POST to this handler, but good for safety)
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ message: "Method not allowed", ok: false }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  // Content-Type Validation
  const contentType = request.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return new Response(
      JSON.stringify({ message: "Invalid content type", ok: false }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json();

    // Request Body Validation
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

    // Phone Number Validation (Nigerian numbers)
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

    // Amount Validation
    if (isNaN(body.amount) || body.amount <= 0) {
      return new Response(
        JSON.stringify({
          message: "Invalid amount",
          ok: false,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Make the VTpass API call
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
        timeout: 10000, // 10 seconds timeout
      }
    );

    // Response Headers for Security
    const responseHeaders = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "https://billzpaddi.com.ng",
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Strict-Transport-Security":
        "max-age=63072000; includeSubDomains; preload",
      "Content-Security-Policy": "default-src 'self' https://billzpaddi.com.ng",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    };

    return new Response(JSON.stringify(response.data), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Provider API Error:", error.message);

    // Error Handling
    let errorMessage = "Purchase failed. Please try again.";
    let statusCode = 500;

    if (error.response) {
      statusCode = error.response.status || 500;
      errorMessage = error.response.data?.message || errorMessage;
    } else if (error.request) {
      errorMessage = "Network error. Please check your connection.";
    }

    return new Response(JSON.stringify({ message: errorMessage, ok: false }), {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "https://billzpaddi.com.ng",
      },
    });
  }
}
