import type { CaseType, FeeModel } from '@/lib/types';

// Platform fee computation. RPC 5.4 / NYSBA Op. 1271 (2024) flagged
// percentage-of-legal-fee structures as risky; Op. 1113 blessed flat fees.
// Flat fee is therefore the default. Percentage mode is feature-flagged for
// legacy/testing only. Set FEE_MODE=percentage to switch.
//
// All amounts are integer cents. Sales tax (NYC 8.875%) is computed on the
// platform fee ONLY (not the legal/pay rate) and stored for audit. It is NOT
// collected yet — Benchline needs a Certificate of Authority first.

export const NYC_SALES_TAX_RATE = 0.08875;

// Flat fee schedule (cents).
export const FLAT_FEE_VIRTUAL_CENTS = 2500; // $25
export const FLAT_FEE_IN_PERSON_STANDARD_CENTS = 3500; // $35
export const FLAT_FEE_IN_PERSON_SPECIALTY_CENTS = 5000; // $50

// Percentage mode (legacy).
export const PERCENTAGE_FEE_RATE = 0.15;
export const PERCENTAGE_FEE_MIN_CENTS = 2000; // $20

// Specialty case types attract the higher in-person flat fee. The current
// case_type enum has criminal and family; matrimonial and bankruptcy are
// included for forward-compatibility if the enum is extended.
const SPECIALTY_CASE_TYPES = new Set<string>([
  'family',
  'criminal',
  'matrimonial',
  'bankruptcy',
]);

export interface PlatformFeeResult {
  feeCents: number;
  salesTaxCents: number;
  totalChargedCents: number;
  model: FeeModel;
}

function resolveFeeMode(): FeeModel {
  return process.env.FEE_MODE === 'percentage' ? 'percentage' : 'flat';
}

function flatFeeCents(caseType: CaseType | string, isVirtual: boolean): number {
  if (isVirtual) return FLAT_FEE_VIRTUAL_CENTS;
  return SPECIALTY_CASE_TYPES.has(caseType)
    ? FLAT_FEE_IN_PERSON_SPECIALTY_CENTS
    : FLAT_FEE_IN_PERSON_STANDARD_CENTS;
}

function percentageFeeCents(payRateCents: number): number {
  return Math.max(Math.round(payRateCents * PERCENTAGE_FEE_RATE), PERCENTAGE_FEE_MIN_CENTS);
}

export function computeSalesTaxCents(platformFeeCents: number): number {
  return Math.round(platformFeeCents * NYC_SALES_TAX_RATE);
}

// Compute the platform fee, sales tax, and total charged to the litigator.
// totalChargedCents = pay_rate + platform_fee + sales_tax. The per diem always
// receives the full pay_rate; the platform fee + tax is Benchline's take
// (collected via the Stripe destination charge application_fee_amount).
export function computePlatformFee(
  payRateCents: number,
  caseType: CaseType | string,
  isVirtual: boolean,
  feeModelOverride?: FeeModel
): PlatformFeeResult {
  const model = feeModelOverride ?? resolveFeeMode();

  const feeCents =
    model === 'flat'
      ? flatFeeCents(caseType, isVirtual)
      : percentageFeeCents(payRateCents);

  const salesTaxCents = computeSalesTaxCents(feeCents);
  const totalChargedCents = payRateCents + feeCents + salesTaxCents;

  return { feeCents, salesTaxCents, totalChargedCents, model };
}
