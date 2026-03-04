import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  logging: {
    fetches: {
      fullUrl: true,
      hmrRefreshes: true,
    },
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: false,
  },
  eslint: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreDuringBuilds: false,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "radix-ui"],
  },
  transpilePackages: ["lucide-react"],
  devIndicators: {
    position: "top-right", // Moves the development indicator to the top-right
    // Set to false to hide the indicator entirely:
    // devIndicators: false,
  },
};

module.exports = {
  output: "standalone",
};

export default nextConfig;
