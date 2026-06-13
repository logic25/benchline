import type { NextRequest } from 'next/server';
import { checkRateLimit, rateLimitResponse, type RateLimitTier } from '@/lib/rate-limit';

// Per-route rate-limit guard. Pass the tier and an identifier (a user id for
// user-keyed tiers, or the client IP for the auth tier). Returns a 429 Response
// to short-circuit the handler, or null when the request may proceed.
//
//   const blocked = await rateLimitGuard('mutation', user.id);
//   if (blocked) return blocked;
export async function rateLimitGuard(
  tier: RateLimitTier,
  identifier: string
): Promise<Response | null> {
  const result = await checkRateLimit(tier, identifier);
  return rateLimitResponse(result);
}

// Best-effort client IP from the standard proxy headers (Vercel sets
// x-forwarded-for). Falls back to a constant so the auth limiter still groups
// unknown clients rather than throwing.
export function clientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}
