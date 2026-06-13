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

export const barVerificationSubmitSchema = z.object({
  barNumber: z.string().trim().min(1).max(40),
  barState: z.string().trim().min(2).max(2).default('NY'),
  fullNameLegal: z.string().trim().min(1).max(200),
  evidenceUrl: z.string().trim().min(1).max(1000).optional(),
});
export type BarVerificationSubmitInput = z.infer<typeof barVerificationSubmitSchema>;

export const insuranceSubmitSchema = z.object({
  documentUrl: z.string().trim().min(1).max(1000).optional(),
  carrier: z.string().trim().min(1).max(200),
  policyNumber: z.string().trim().min(1).max(120),
  coverageAmountCents: z.number().int().positive(),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expiresDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type InsuranceSubmitInput = z.infer<typeof insuranceSubmitSchema>;

export const verificationReviewSchema = z.object({
  kind: z.enum(['bar', 'insurance']),
  requestId: z.string().uuid(),
  decision: z.enum(['approve', 'reject']),
  reviewNotes: z.string().trim().max(2000).optional(),
});
export type VerificationReviewInput = z.infer<typeof verificationReviewSchema>;

export const structureReportSchema = z.object({
  appearanceId: z.string().uuid(),
  rawNotes: z.string().max(20000).optional().default(''),
  context: z
    .object({
      judgeName: z.string().max(400).optional().default(''),
      outcome: z.string().max(400).optional().default(''),
      actionItems: z.string().max(4000).optional().default(''),
      judgeNotes: z.string().max(8000).optional().default(''),
    })
    .default({ judgeName: '', outcome: '', actionItems: '', judgeNotes: '' }),
});
export type StructureReportInput = z.infer<typeof structureReportSchema>;

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
