import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

// withSentryConfig adds build-time source-map upload (gated on
// SENTRY_AUTH_TOKEN/ORG/PROJECT) and wires the Sentry webpack/turbopack plugin.
// When those env vars are absent the plugin skips upload, so this is safe to
// leave on in every environment.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  disableLogger: true,
  telemetry: false,
});
