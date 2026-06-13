import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  TIERS,
  rateLimitKey,
  computeRetryAfterSeconds,
  rateLimitResponse,
  checkRateLimit,
  type RateLimitResult,
} from '@/lib/rate-limit';

describe('TIERS', () => {
  it('matches the documented limits', () => {
    expect(TIERS.auth).toMatchObject({ limit: 5, window: '1 m', keyBy: 'ip' });
    expect(TIERS.mutation).toMatchObject({ limit: 30, window: '1 m', keyBy: 'user' });
    expect(TIERS.read).toMatchObject({ limit: 120, window: '1 m', keyBy: 'user' });
    expect(TIERS.ai).toMatchObject({ limit: 10, window: '1 h', keyBy: 'user' });
  });
});

describe('rateLimitKey', () => {
  it('namespaces the identifier under the tier', () => {
    expect(rateLimitKey('mutation', 'user-123')).toBe('mutation:user-123');
    expect(rateLimitKey('auth', '203.0.113.7')).toBe('auth:203.0.113.7');
  });
});

describe('computeRetryAfterSeconds', () => {
  it('rounds up the remaining window', () => {
    expect(computeRetryAfterSeconds(10_500, 10_000)).toBe(1);
    expect(computeRetryAfterSeconds(12_000, 10_000)).toBe(2);
  });

  it('never returns a negative value', () => {
    expect(computeRetryAfterSeconds(5_000, 10_000)).toBe(0);
  });
});

describe('rateLimitResponse', () => {
  it('returns null when the request is allowed', () => {
    const ok: RateLimitResult = { success: true, limit: 30, remaining: 29, reset: 0, retryAfterSeconds: 0 };
    expect(rateLimitResponse(ok)).toBeNull();
  });

  it('returns a 429 with Retry-After when blocked', () => {
    const blocked: RateLimitResult = { success: false, limit: 30, remaining: 0, reset: 99, retryAfterSeconds: 42 };
    const res = rateLimitResponse(blocked);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(429);
    expect(res!.headers.get('Retry-After')).toBe('42');
    expect(res!.headers.get('X-RateLimit-Limit')).toBe('30');
    expect(res!.headers.get('X-RateLimit-Remaining')).toBe('0');
  });
});

describe('checkRateLimit (no Upstash configured)', () => {
  let savedUrl: string | undefined;
  let savedToken: string | undefined;

  beforeEach(() => {
    savedUrl = process.env.UPSTASH_REDIS_REST_URL;
    savedToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    if (savedUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = savedUrl;
    if (savedToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = savedToken;
  });

  it('allows all requests and reports full quota', async () => {
    const r = await checkRateLimit('mutation', 'user-1');
    expect(r.success).toBe(true);
    expect(r.remaining).toBe(TIERS.mutation.limit);
    expect(r.retryAfterSeconds).toBe(0);
  });
});
