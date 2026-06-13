import * as Sentry from '@sentry/nextjs';
import { scrubEvent, scrubBreadcrumb } from '@/lib/observability/sentry-pii';

// Server-side Sentry. No-op when no DSN is configured so local/dev and
// unconfigured deployments never attempt to send events.
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV,
    // Capture traces on a sampled basis; covers Stripe/Bedrock/Supabase calls
    // made inside instrumented route handlers.
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    sendDefaultPii: false,
    beforeSend: scrubEvent,
    beforeBreadcrumb: scrubBreadcrumb,
  });
}
