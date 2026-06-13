import type { ErrorEvent, Breadcrumb } from '@sentry/nextjs';

// Keys whose values must never leave the process. Matched case-insensitively
// against object keys anywhere in the event payload.
const SENSITIVE_KEY_PATTERN =
  /(email|phone|bar_number|bar_state|full_name_legal|policy_number|document_url|evidence_url|authorization|cookie|token|secret|password|client_secret)/i;

const REDACTED = '[redacted]';

// Patterns for sensitive values that may appear inline in free-text (messages,
// breadcrumb strings) where we can't rely on a key name.
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /\+?\d[\d\s().-]{8,}\d/g;

function scrubString(value: string): string {
  return value.replace(EMAIL_RE, REDACTED).replace(PHONE_RE, REDACTED);
}

// Recursively redact sensitive keys and scrub sensitive values from strings.
// Bounded depth so a pathological object can't hang the scrubber.
function scrub(value: unknown, depth = 0): unknown {
  if (depth > 6) return value;
  if (typeof value === 'string') return scrubString(value);
  if (Array.isArray(value)) return value.map((v) => scrub(v, depth + 1));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEY_PATTERN.test(k) ? REDACTED : scrub(v, depth + 1);
    }
    return out;
  }
  return value;
}

// beforeSend hook: strip PII from the event before it leaves the process.
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  // Never send user email/identifying fields; keep only an opaque id.
  if (event.user) {
    event.user = { id: event.user.id };
  }
  if (event.request) {
    delete event.request.cookies;
    if (event.request.headers) {
      delete event.request.headers.cookie;
      delete event.request.headers.authorization;
    }
    if (event.request.query_string) {
      event.request.query_string = REDACTED;
    }
    if (typeof event.request.data === 'object' && event.request.data) {
      event.request.data = scrub(event.request.data) as typeof event.request.data;
    }
  }
  if (event.extra) event.extra = scrub(event.extra) as typeof event.extra;
  if (event.contexts) event.contexts = scrub(event.contexts) as typeof event.contexts;
  return event;
}

// beforeBreadcrumb hook: redact PII from breadcrumb messages/data.
export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
  if (breadcrumb.message) breadcrumb.message = scrubString(breadcrumb.message);
  if (breadcrumb.data) breadcrumb.data = scrub(breadcrumb.data) as typeof breadcrumb.data;
  return breadcrumb;
}
