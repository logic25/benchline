import type { NextConfig } from "next";

const isStaticPreview = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // This marketing app is a self-contained project; pin the workspace root so
  // Turbopack doesn't pick up sibling lockfiles.
  turbopack: {
    root: __dirname,
  },
  // STATIC_EXPORT=1 produces a fully static `out/` build for preview hosting.
  // The real Vercel deployment uses the default (server) output so the waitlist
  // server action runs.
  ...(isStaticPreview
    ? {
        output: "export" as const,
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
