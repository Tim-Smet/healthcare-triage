import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Mastra pulls in Node-only dependencies, so keep it out of the bundle.
  serverExternalPackages: ["@mastra/*"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
