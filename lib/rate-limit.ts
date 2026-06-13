import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Tiered rate limiting backed by Upstash Redis. Degrades to allow-all when the
// Upstash env vars are unset (local dev, preview builds) so nothing breaks
// without configuration — the same graceful-degradation pattern as email/SMS.
//
// Tiers (per the Phase 4 brief):
//   auth     — 5 requests / minute,  keyed by IP   (login, signup, code send)
//   mutation — 30 requests / minute, keyed by user (claims, posts, messages…)
//   read     — 120 requests / minute, keyed by user (list/detail GETs)
//   ai       — 10 requests / hour,    keyed by user (report structuring)

export type RateLimitTier = 'auth' | 'mutation' | 'read' | 'ai';

interface TierConfig {
  limit: number;
  window: `${number} ${'s' | 'm' | 'h'}`;
  // What the caller should key on. Documented here so route code is consistent.
  keyBy: 'ip' | 'user';
}

export const TIERS: Record<RateLimitTier, TierConfig> = {
  auth: { limit: 5, window: '1 m', keyBy: 'ip' },
  mutation: { limit: 30, window: '1 m', keyBy: 'user' },
  read: { limit: 120, window: '1 m', keyBy: 'user' },
  ai: { limit: 10, window: '1 h', keyBy: 'user' },
};

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  // Unix ms timestamp when the window resets.
  reset: number;
  // Seconds the caller should wait before retrying (0 when allowed). Suitable
  // for a Retry-After header.
  retryAfterSeconds: number;
}

let _redis: Redis | null = null;
const _limiters = new Map<RateLimitTier, Ratelimit>();

function getRedis(): Redis | null {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  _redis = new Redis({ url, token });
  return _redis;
}

function getLimiter(tier: RateLimitTier): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  const existing = _limiters.get(tier);
  if (existing) return existing;
  const cfg = TIERS[tier];
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(cfg.limit, cfg.window),
    prefix: `rl:${tier}`,
    analytics: false,
  });
  _limiters.set(tier, limiter);
  return limiter;
}

// Builds the Redis key suffix for an identifier under a tier. Exported for tests
// and to keep route code from inventing its own key formats.
export function rateLimitKey(tier: RateLimitTier, identifier: string): string {
  return `${tier}:${identifier}`;
}

// Returns how long (seconds, rounded up, never negative) until `reset`.
export function computeRetryAfterSeconds(reset: number, now: number): number {
  return Math.max(0, Math.ceil((reset - now) / 1000));
}

// Checks the limit for (tier, identifier). When Upstash is not configured this
// always succeeds with full remaining quota so local/dev behavior is unchanged.
export async function checkRateLimit(
  tier: RateLimitTier,
  identifier: string
): Promise<RateLimitResult> {
  const limiter = getLimiter(tier);
  const cfg = TIERS[tier];
  if (!limiter) {
    return { success: true, limit: cfg.limit, remaining: cfg.limit, reset: 0, retryAfterSeconds: 0 };
  }
  const res = await limiter.limit(rateLimitKey(tier, identifier));
  return {
    success: res.success,
    limit: res.limit,
    remaining: res.remaining,
    reset: res.reset,
    retryAfterSeconds: res.success ? 0 : computeRetryAfterSeconds(res.reset, Date.now()),
  };
}

// Builds a 429 Response with a Retry-After header from a failed result. Returns
// null when the request is allowed, so call sites can do:
//   const rl = await checkRateLimit('mutation', userId);
//   const blocked = rateLimitResponse(rl); if (blocked) return blocked;
export function rateLimitResponse(result: RateLimitResult): Response | null {
  if (result.success) return null;
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please slow down.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfterSeconds),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.reset),
      },
    }
  );
}
