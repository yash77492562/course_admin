import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Turbopack is now default in Next.js 16
  turbopack: {},
  
  experimental: {
    optimizePackageImports: ['@/components'],
  },
  
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Reduce memory usage and CPU overhead
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 60 * 1000, // 1 minute (default is 60s)
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2, // Keep only 2 pages in memory (default is 5)
  },
  
  // Allow R2 videos and images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: 'influbee.edf54fe3baf509501a8c1ba24eb000dd.r2.cloudflarestorage.com',
      },
    ],
  },
  
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3002/api/:path*',
      },
    ];
  },
};

export default nextConfig;