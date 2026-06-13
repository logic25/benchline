import * as Sentry from '@sentry/nextjs';
import { scrubEvent, scrubBreadcrumb } from '@/lib/observability/sentry-pii';

// Browser Sentry. Loaded from instrumentation-client.ts (the Next 16 client
// instrumentation entrypoint). No-op without a public DSN.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    sendDefaultPii: false,
    beforeSend: scrubEvent,
    beforeBreadcrumb: scrubBreadcrumb,
  });
}
