import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  /* config options here */
  logging: {
    fetches: {
      fullUrl: isDev,
      hmrRefreshes: isDev,
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
    optimizePackageImports: ['lucide-react', 'radix-ui'],
  },
  transpilePackages: ['lucide-react'],
  devIndicators: {
    position: 'top-right', // Moves the development indicator to the top-right
    // Set to false to hide the indicator entirely:
    // devIndicators: false,
  },
};

module.exports = {
  output: 'standalone',
  basePath: '/room-booking',
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
