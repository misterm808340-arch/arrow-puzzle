import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // For Play Store / Capacitor: use "export" for static HTML
  // For web hosting: use "standalone" for server rendering
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    unoptimized: true, // Required for static export
  },
};

export default nextConfig;
