import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent bundling of native modules — they are loaded at runtime by Node.js, not webpack/turbopack
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
};

export default nextConfig;
