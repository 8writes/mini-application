/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["vtpass.com"],
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          // Security headers (keep these)
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
