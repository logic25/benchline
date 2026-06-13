import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';

// Consistent JSON error shapes for API routes. Every route should return errors
// through these helpers so clients can rely on a stable { error, code, issues }
// envelope.

export interface ApiErrorBody {
  error: string;
  code: string;
  issues?: unknown;
}

export function apiError(status: number, code: string, message: string, issues?: unknown): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: message, code, ...(issues ? { issues } : {}) }, { status });
}

export const badRequest = (zodError: ZodError) =>
  apiError(400, 'invalid_request', 'Invalid request', zodError.issues);

export const unauthorized = () => apiError(401, 'unauthorized', 'Unauthorized');

// 404 is used for admin-route authorization failures so we do not confirm the
// route exists to non-admins. Use forbidden() only where the resource's
// existence is already known to the caller.
export const notFoundError = () => apiError(404, 'not_found', 'Not found');

export const forbidden = () => apiError(403, 'forbidden', 'Forbidden');

export const conflict = (message: string) => apiError(409, 'conflict', message);

export const serverError = (message = 'Something went wrong') => apiError(500, 'server_error', message);
