import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable webpack build cache on Windows to prevent permission issues
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.cache = false
    }
    return config
  },
  compiler: {
    removeConsole: false,
  },
};

export default nextConfig;
