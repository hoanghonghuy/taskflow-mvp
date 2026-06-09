import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a self-contained build for slim Docker images.
  output: "standalone",
  // Allow Playwright to run an isolated dev server (see playwright.config.ts).
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
