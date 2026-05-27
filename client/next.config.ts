/**
 * next.config.ts — API proxy configuration.
 * In development: proxies /api/* to the Express backend.
 * In Vercel production: uses the deployment URL from env vars,
 * or falls back to the Render URL.
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "https://deaddrop-qon2.onrender.com"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;