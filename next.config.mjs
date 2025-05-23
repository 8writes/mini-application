/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["res.cloudinary.com", "sandbox.vtpass.com"],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "billzpaddi.com.ng", // no www
          },
        ],
        destination: "https://www.billzpaddi.com.ng/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
