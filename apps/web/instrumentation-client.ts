import * as Sentry from '@sentry/nextjs';

// Next 16 client instrumentation entrypoint. Delegates to sentry.client.config
// (which no-ops without a public DSN).
import './sentry.client.config';

// Instruments client-side router navigations. Guarded because the export is
// only present in the client bundle of the Sentry SDK.
export const onRouterTransitionStart =
  typeof Sentry.captureRouterTransitionStart === 'function'
    ? Sentry.captureRouterTransitionStart
    : undefined;
