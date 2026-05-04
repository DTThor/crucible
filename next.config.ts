import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // typedRoutes will go back in once Turbopack supports it.
  // Tracking issue: https://github.com/vercel/next.js/issues/62753
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
