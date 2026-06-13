import type { Profile, UserRole } from '@/lib/types';
import { createServiceClient } from '@/lib/supabase/service';

// Onboarding gate. Two actions are gated: posting an appearance (litigators) and
// claiming one (per diems). A user with role 'both' must satisfy whichever
// requirement matches the action they are attempting.
//
// The decision is a pure function of the profile, so it is unit-testable without
// a database. requireOnboarding() is the thin server wrapper that loads the
// profile and delegates here.

export type OnboardingAction = 'post' | 'claim';

export type OnboardingResult = { ok: true } | { ok: false; missing: string[] };

// The subset of profile fields the gate reads. Accepting a partial shape keeps
// the pure evaluator easy to construct in tests.
export type OnboardingProfile = Pick<
  Profile,
  | 'role'
  | 'suspended'
  | 'onboarding_completed'
  | 'phone_verified'
  | 'bar_verification_status'
  | 'insurance_status'
  | 'payment_method_setup'
  | 'stripe_connect_onboarded'
>;

// Human-readable labels for each missing requirement, surfaced to the UI.
export const REQUIREMENT_LABELS: Record<string, string> = {
  profile: 'Complete your profile',
  bar_verification: 'Submit bar verification',
  payment_method: 'Save a payment method',
  insurance: 'Upload malpractice insurance',
  stripe_connect: 'Finish Stripe payout setup',
  suspended: 'Account suspended — contact support',
};

// Whether the action concerns the litigator side, the per-diem side, or both,
// given the user's role. 'both' users are gated on the side matching the action.
function appliesToLitigator(role: UserRole, action: OnboardingAction): boolean {
  if (action !== 'post') return false;
  return role === 'litigator' || role === 'both';
}

function appliesToPerDiem(role: UserRole, action: OnboardingAction): boolean {
  if (action !== 'claim') return false;
  return role === 'per_diem' || role === 'both';
}

// Pure: returns ok or the ordered list of requirement keys still missing.
export function evaluateOnboarding(
  profile: OnboardingProfile,
  action: OnboardingAction
): OnboardingResult {
  if (profile.suspended) return { ok: false, missing: ['suspended'] };

  // A finished wizard is sufficient — we don't re-derive each step once the user
  // has been marked complete (the wizard only completes after all steps pass).
  if (profile.onboarding_completed) return { ok: true };

  const missing: string[] = [];

  const litigator = appliesToLitigator(profile.role, action);
  const perDiem = appliesToPerDiem(profile.role, action);

  // Role/action mismatch (e.g. a pure per-diem trying to post): the action's own
  // authorization check handles that; onboarding does not block it here.
  if (!litigator && !perDiem) return { ok: true };

  if (!profile.phone_verified) missing.push('profile');
  if (profile.bar_verification_status !== 'verified') missing.push('bar_verification');

  if (litigator) {
    if (!profile.payment_method_setup) missing.push('payment_method');
  }
  if (perDiem) {
    if (profile.insurance_status !== 'verified') missing.push('insurance');
    if (!profile.stripe_connect_onboarded) missing.push('stripe_connect');
  }

  return missing.length === 0 ? { ok: true } : { ok: false, missing };
}

// Server wrapper: loads the profile with the service-role client and evaluates.
// Returns ok:true with no missing list if the profile cannot be loaded is NOT
// the behavior — a missing profile is treated as fully un-onboarded.
export async function requireOnboarding(
  userId: string,
  action: OnboardingAction
): Promise<OnboardingResult> {
  const service = createServiceClient();
  const { data } = await service
    .from('profiles')
    .select(
      'role, suspended, onboarding_completed, phone_verified, bar_verification_status, insurance_status, payment_method_setup, stripe_connect_onboarded'
    )
    .eq('id', userId)
    .single();

  if (!data) return { ok: false, missing: ['profile'] };
  return evaluateOnboarding(data as OnboardingProfile, action);
}
