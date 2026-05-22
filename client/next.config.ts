/**
 * next.config.ts — Add API proxy to avoid CORS issues in development.
 * In production (Vercel), you should either:
 *   a) Configure CORS on the Express backend, OR
 *   b) Use environment variables with NEXT_PUBLIC_API_URL
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy /api/* requests to your Express backend (avoids CORS in dev)
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://deaddrop-qon2.onrender.com/api/:path*",
      },
    ];
  },
};

export default nextConfig;
