import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['@neondatabase/serverless'],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/predict",
        permanent: false,
      },
    ];
  }
};

export default nextConfig;
