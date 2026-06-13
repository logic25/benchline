// Thin structured-logging wrapper. Emits one JSON object per line to stdout/err
// so logs are parseable in Vercel / log drains. Each entry carries a level, a
// short event name, an ISO timestamp, and an optional context bag. A traceId can
// be attached per request via withTrace() so related lines can be correlated.
//
// PII discipline: callers must not pass raw email/phone/bar numbers in the
// context bag. Use ids instead. (Sentry's beforeSend strips these as a backstop,
// but logs are not run through Sentry.)

type Level = 'debug' | 'info' | 'warn' | 'error';

export type LogContext = Record<string, unknown>;

function emit(level: Level, event: string, context?: LogContext, traceId?: string): void {
  const entry = {
    level,
    event,
    ts: new Date().toISOString(),
    ...(traceId ? { traceId } : {}),
    ...(context ?? {}),
  };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export interface Logger {
  debug(event: string, context?: LogContext): void;
  info(event: string, context?: LogContext): void;
  warn(event: string, context?: LogContext): void;
  error(event: string, context?: LogContext): void;
}

export const log: Logger = {
  debug: (event, context) => emit('debug', event, context),
  info: (event, context) => emit('info', event, context),
  warn: (event, context) => emit('warn', event, context),
  error: (event, context) => emit('error', event, context),
};

// Returns a logger that stamps every line with the given traceId. Generate the
// id once at the top of a request handler and pass it down.
export function withTrace(traceId: string): Logger {
  return {
    debug: (event, context) => emit('debug', event, context, traceId),
    info: (event, context) => emit('info', event, context, traceId),
    warn: (event, context) => emit('warn', event, context, traceId),
    error: (event, context) => emit('error', event, context, traceId),
  };
}

export function newTraceId(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}
