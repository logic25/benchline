import { describe, it, expect, afterEach } from 'vitest';
import {
  computePlatformFee,
  computeSalesTaxCents,
  FLAT_FEE_VIRTUAL_CENTS,
  FLAT_FEE_IN_PERSON_STANDARD_CENTS,
  FLAT_FEE_IN_PERSON_SPECIALTY_CENTS,
  PERCENTAGE_FEE_MIN_CENTS,
} from '@/lib/pricing';

afterEach(() => {
  delete process.env.FEE_MODE;
});

describe('computeSalesTaxCents', () => {
  it('applies 8.875% to the platform fee', () => {
    expect(computeSalesTaxCents(3500)).toBe(311); // round(310.625)
    expect(computeSalesTaxCents(0)).toBe(0);
  });
});

describe('computePlatformFee — flat mode (default)', () => {
  it('charges the virtual flat fee for virtual appearances', () => {
    const r = computePlatformFee(20000, 'civil', true);
    expect(r.model).toBe('flat');
    expect(r.feeCents).toBe(FLAT_FEE_VIRTUAL_CENTS);
    expect(r.salesTaxCents).toBe(computeSalesTaxCents(FLAT_FEE_VIRTUAL_CENTS));
    expect(r.totalChargedCents).toBe(20000 + r.feeCents + r.salesTaxCents);
  });

  it('charges the standard in-person fee for non-specialty case types', () => {
    const r = computePlatformFee(20000, 'civil', false);
    expect(r.feeCents).toBe(FLAT_FEE_IN_PERSON_STANDARD_CENTS);
  });

  it('charges the specialty in-person fee for family/criminal', () => {
    expect(computePlatformFee(20000, 'family', false).feeCents).toBe(FLAT_FEE_IN_PERSON_SPECIALTY_CENTS);
    expect(computePlatformFee(20000, 'criminal', false).feeCents).toBe(FLAT_FEE_IN_PERSON_SPECIALTY_CENTS);
  });

  it('does not vary the flat fee with the pay rate', () => {
    const low = computePlatformFee(5000, 'civil', false);
    const high = computePlatformFee(500000, 'civil', false);
    expect(low.feeCents).toBe(high.feeCents);
  });
});

describe('computePlatformFee — percentage mode (feature flag)', () => {
  it('charges 15% above the floor', () => {
    process.env.FEE_MODE = 'percentage';
    const r = computePlatformFee(100000, 'civil', false);
    expect(r.model).toBe('percentage');
    expect(r.feeCents).toBe(15000);
  });

  it('enforces the minimum fee', () => {
    process.env.FEE_MODE = 'percentage';
    const r = computePlatformFee(1000, 'civil', false);
    expect(r.feeCents).toBe(PERCENTAGE_FEE_MIN_CENTS);
  });

  it('honors an explicit model override regardless of env', () => {
    process.env.FEE_MODE = 'percentage';
    const r = computePlatformFee(100000, 'civil', false, 'flat');
    expect(r.model).toBe('flat');
    expect(r.feeCents).toBe(FLAT_FEE_IN_PERSON_STANDARD_CENTS);
  });
});
