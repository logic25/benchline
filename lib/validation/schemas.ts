import { z } from 'zod';

// Input schemas for every mutating API route. Routes call schema.parse() (or
// safeParse) on the request body and return 400 on failure.

export const appearanceIdSchema = z.object({
  appearanceId: z.string().uuid(),
});
export type AppearanceIdInput = z.infer<typeof appearanceIdSchema>;

export const createPaymentIntentSchema = z.object({
  appearanceId: z.string().uuid(),
});

export const claimSchema = appearanceIdSchema;
export const checkInSchema = appearanceIdSchema;
export const releasePaymentSchema = appearanceIdSchema;

export const instantPayoutSchema = z.object({
  // Optional explicit amount (cents) to withdraw; defaults to full available
  // balance when omitted.
  amountCents: z.number().int().positive().optional(),
});
export type InstantPayoutInput = z.infer<typeof instantPayoutSchema>;

// Helper: parse a request body and return a discriminated result so routes can
// return a 400 with field errors without try/catch noise.
export function parseBody<T>(
  schema: z.ZodType<T>,
  body: unknown
): { success: true; data: T } | { success: false; errors: z.ZodIssue[] } {
  const result = schema.safeParse(body);
  if (result.success) return { success: true, data: result.data };
  return { success: false, errors: result.error.issues };
}
