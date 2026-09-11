import type { NextConfig } from "next";

const isPlayStoreBuild = process.env.BUILD_TARGET === 'playstore';

const nextConfig: NextConfig = {
  output: isPlayStoreBuild ? "export" : "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
