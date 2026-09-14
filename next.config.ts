import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable Turbopack (Next.js 16 default)
  turbopack: {},

  // Prevent bundling native Node modules used by @quitscope/discord-welcomecard
  serverExternalPackages: ['@napi-rs/canvas', '@quitscope/discord-welcomecard'],

  webpack: (config) => {
    config.watchOptions = {
      ignored: /node_modules/,
      poll: false,
    };
    return config;
  },
};

export default nextConfig;
