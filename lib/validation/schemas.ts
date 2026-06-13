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

export const messageAttachmentSchema = z.object({
  path: z.string().trim().min(1).max(1000),
  name: z.string().trim().min(1).max(300),
  size: z.number().int().nonnegative(),
  content_type: z.string().trim().min(1).max(200),
});

export const sendMessageSchema = z
  .object({
    appearanceId: z.string().uuid(),
    body: z.string().trim().max(10000).default(''),
    attachments: z.array(messageAttachmentSchema).max(10).default([]),
  })
  .refine((v) => v.body.length > 0 || v.attachments.length > 0, {
    message: 'A message must have text or at least one attachment',
  });
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

// E.164-ish phone number (a leading + and 7-15 digits).
export const phoneSendCodeSchema = z.object({
  phone: z.string().trim().regex(/^\+[1-9]\d{6,14}$/, 'Enter a phone number in international format, e.g. +12125550100'),
});
export type PhoneSendCodeInput = z.infer<typeof phoneSendCodeSchema>;

export const phoneVerifyCodeSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});
export type PhoneVerifyCodeInput = z.infer<typeof phoneVerifyCodeSchema>;

export const raiseDisputeSchema = z.object({
  appearanceId: z.string().uuid(),
  reason: z.string().trim().min(10).max(5000),
  evidenceUrls: z.array(z.string().trim().min(1).max(1000)).max(10).default([]),
});
export type RaiseDisputeInput = z.infer<typeof raiseDisputeSchema>;

export const resolveDisputeSchema = z
  .object({
    disputeId: z.string().uuid(),
    decision: z.enum(['for_raiser', 'for_other', 'split']),
    resolutionNotes: z.string().trim().max(5000).optional(),
    // Required for split: the cents to refund the litigator; the remainder is
    // released to the per diem.
    refundAmountCents: z.number().int().nonnegative().optional(),
  })
  .refine((v) => v.decision !== 'split' || typeof v.refundAmountCents === 'number', {
    message: 'A split resolution requires a refund amount',
    path: ['refundAmountCents'],
  });
export type ResolveDisputeInput = z.infer<typeof resolveDisputeSchema>;

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
