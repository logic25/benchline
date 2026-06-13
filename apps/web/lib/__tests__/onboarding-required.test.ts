import { describe, it, expect } from 'vitest';
import { evaluateOnboarding, type OnboardingProfile } from '@/lib/onboarding/required';

function profile(overrides: Partial<OnboardingProfile> = {}): OnboardingProfile {
  return {
    role: 'litigator',
    suspended: false,
    onboarding_completed: false,
    phone_verified: true,
    bar_verification_status: 'verified',
    insurance_status: 'verified',
    payment_method_setup: true,
    stripe_connect_onboarded: true,
    ...overrides,
  };
}

describe('evaluateOnboarding', () => {
  it('blocks a suspended user regardless of other state', () => {
    const r = evaluateOnboarding(profile({ suspended: true, onboarding_completed: true }), 'post');
    expect(r).toEqual({ ok: false, missing: ['suspended'] });
  });

  it('passes immediately when onboarding_completed is true', () => {
    expect(evaluateOnboarding(profile({ onboarding_completed: true, payment_method_setup: false }), 'post')).toEqual({ ok: true });
  });

  it('litigator posting needs phone, bar, and payment method', () => {
    const r = evaluateOnboarding(
      profile({ role: 'litigator', phone_verified: false, bar_verification_status: 'pending', payment_method_setup: false }),
      'post'
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.missing).toEqual(['profile', 'bar_verification', 'payment_method']);
  });

  it('litigator posting passes when phone, bar, and payment are satisfied', () => {
    expect(evaluateOnboarding(profile({ role: 'litigator' }), 'post')).toEqual({ ok: true });
  });

  it('per diem claiming needs phone, bar, insurance, and connect', () => {
    const r = evaluateOnboarding(
      profile({ role: 'per_diem', phone_verified: false, bar_verification_status: 'unverified', insurance_status: 'none', stripe_connect_onboarded: false }),
      'claim'
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.missing).toEqual(['profile', 'bar_verification', 'insurance', 'stripe_connect']);
  });

  it('per diem claiming does not require a payment method', () => {
    expect(evaluateOnboarding(profile({ role: 'per_diem', payment_method_setup: false }), 'claim')).toEqual({ ok: true });
  });

  it('role both is gated on the litigator side when posting', () => {
    const r = evaluateOnboarding(profile({ role: 'both', payment_method_setup: false }), 'post');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.missing).toEqual(['payment_method']);
  });

  it('role both is gated on the per-diem side when claiming', () => {
    const r = evaluateOnboarding(profile({ role: 'both', insurance_status: 'expired', stripe_connect_onboarded: false }), 'claim');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.missing).toEqual(['insurance', 'stripe_connect']);
  });

  it('does not block a per-diem-only user from the post action (auth handles role mismatch)', () => {
    expect(evaluateOnboarding(profile({ role: 'per_diem', payment_method_setup: false }), 'post')).toEqual({ ok: true });
  });

  it('does not block a litigator-only user from the claim action', () => {
    expect(evaluateOnboarding(profile({ role: 'litigator', insurance_status: 'none', stripe_connect_onboarded: false }), 'claim')).toEqual({ ok: true });
  });
});
