import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a self-contained build for slim Docker images.
  output: "standalone",
  // Allow Playwright to run an isolated dev server (see playwright.config.ts).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Hide the in-browser Next.js development indicator/toolbar.
  devIndicators: false,
  // Access the dev server through DuckDNS while keeping Next.js explicit.
  allowedDevOrigins: ["taskflow-mvp.duckdns.org"],
};

export default nextConfig;
