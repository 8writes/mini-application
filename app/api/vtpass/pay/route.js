import axios from "axios";

// Rate limiting setup
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute

export async function POST(request) {

  const apiKey = request.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.BILLZ_PUBLIC_KEY) {
    return new Response(
      JSON.stringify({ message: "Unauthorized", ok: false }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const clientIp = request.headers.get("x-forwarded-for") || request.ip;
  const currentTime = Date.now();

  // 1. Rate Limiting
  if (rateLimit.has(clientIp)) {
    const { count, firstRequestTime } = rateLimit.get(clientIp);

    if (currentTime - firstRequestTime < RATE_LIMIT_WINDOW) {
      if (count >= RATE_LIMIT_MAX) {
        return new Response(
          JSON.stringify({
            message: "Too many requests. Please try again later.",
            ok: false,
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      rateLimit.set(clientIp, { count: count + 1, firstRequestTime });
    } else {
      rateLimit.set(clientIp, { count: 1, firstRequestTime: currentTime });
    }
  } else {
    rateLimit.set(clientIp, { count: 1, firstRequestTime: currentTime });
  }

  // 2. Strict Origin Checking
  const origin = request.headers.get("origin");
  const allowedDomains = [
    "https://billzpaddi.com.ng",
    "https://www.billzpaddi.com.ng",
  ];

  if (origin && !allowedDomains.includes(origin)) {
    return new Response(
      JSON.stringify({
        message: "Unauthorized domain",
        ok: false,
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 3. Method Validation
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({
        message: "Method not allowed",
        ok: false,
      }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 4. Content-Type Validation
  const contentType = request.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return new Response(
      JSON.stringify({
        message: "Invalid content type",
        ok: false,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const body = await request.json();

    // 5-6. Phone Number Validation
    const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
    if (!phoneRegex.test(body.phone)) {
      return new Response(
        JSON.stringify({
          message: "Invalid Nigerian phone number format",
          ok: false,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 7. Amount Validation
    if (isNaN(body.amount) || body.amount <= 0) {
      return new Response(
        JSON.stringify({
          message: "Invalid amount",
          ok: false,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 8. Make the VTpass API call
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
          "api-key": process.env.NEXT_BILLZ_API_KEY,
          "secret-key": process.env.NEXT_BILLZ_SECRET_KEY,
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 seconds timeout
      }
    );

    // 9. Response Headers for Security
    const responseHeaders = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "https://billzpaddi.com.ng",
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Content-Type",
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
    console.error("VTpass Axios Error:", error.response?.data || error.message);

    // 10. Error Handling without exposing sensitive information
    let errorMessage = "Purchase failed. Please try again.";
    let statusCode = 500;

    if (error.response) {
      // Don't expose backend errors directly
      statusCode = error.response.status || 500;
    } else if (error.request) {
      errorMessage = "Network error. Please check your connection.";
    }

    return new Response(
      JSON.stringify({
        message: errorMessage,
        ok: false,
      }),
      {
        status: statusCode,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "https://billzpaddi.com.ng",
        },
      }
    );
  }
}
