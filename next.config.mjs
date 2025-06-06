/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["vtpass.com"], // Add the domain here
  },
  async headers() {
    return [
      {
        // 🔒 API-specific security headers
        source: "/api/:path*",
        headers: [
          // Core security
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },

          // Strict CORS policy
          {
            key: "Access-Control-Allow-Origin",
            value: "https://dstvmicgrand.com",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "POST",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, X-CSRF-Token, X-Request-Signature",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        // 🎯 Extra hardening for payment endpoint
        source: "/api/wrapper/pay",
        headers: [
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        // 🛡️ Obfuscate real endpoint
        source: "/api/v1/req/:path*", // public route
        destination: "/api/wrapper/:path*", // real internal route
        has: [
          {
            type: "header",
            key: "origin",
            value: "https://dstvmicgrand.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
