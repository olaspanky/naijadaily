import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: '**', // Allow all hostnames
        port: "", // No specific port
        pathname: "**", // Allow all paths under this hostname
      },
    ],
  },};

export default nextConfig;
