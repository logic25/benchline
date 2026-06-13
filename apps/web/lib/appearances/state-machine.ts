import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppearanceStatus } from '@/lib/types';

// Single source of truth for the appearance lifecycle. Every status change must
// go through performTransition so that validation, side effects, the status
// update, and the audit-log entry happen together. The DB trigger in
// 009_state_machine_constraints.sql is a backstop for direct writes.

export type TransitionEvent =
  | 'claim'
  | 'check_in'
  | 'submit_report'
  | 'confirm_completion'
  | 'auto_release'
  | 'cancel'
  | 'dispute'
  | 'resolve_dispute'
  | 'refund'
  // Phase 3 dispute workflow. raise_dispute is the user-facing entry point
  // (a party opens a formal dispute); the resolve_* events are admin-only
  // outcomes. These coexist with the older generic dispute/resolve_dispute/
  // refund events above.
  | 'raise_dispute'
  | 'resolve_dispute_for_raiser'
  | 'resolve_dispute_for_other'
  | 'resolve_dispute_split';

// from-status -> event -> to-status. submit_report is modeled as a no-op on
// status (it does not move the appearance out of in_progress) but is recorded
// in the audit log; it is intentionally absent here so callers handle it as an
// event without a status change.
const TRANSITIONS: Record<AppearanceStatus, Partial<Record<TransitionEvent, AppearanceStatus>>> = {
  open: {
    claim: 'claimed',
    cancel: 'cancelled',
  },
  claimed: {
    check_in: 'in_progress',
    cancel: 'cancelled',
    dispute: 'disputed',
  },
  in_progress: {
    confirm_completion: 'completed',
    auto_release: 'completed',
    dispute: 'disputed',
    raise_dispute: 'disputed',
  },
  completed: {
    dispute: 'disputed',
    // A completed appearance may be disputed within a window (enforced by the
    // dispute route, which checks completed_at), e.g. if payment already
    // auto-released but the work was deficient.
    raise_dispute: 'disputed',
  },
  disputed: {
    resolve_dispute: 'completed',
    // A refund resolves the dispute by cancelling the appearance; the money
    // side of "refunded" lives on appearances.payment_status, not the
    // appearance_status enum (which has no 'refunded' member).
    refund: 'cancelled',
    // Admin resolutions. For-raiser refunds the litigator (cancelled);
    // for-other and split release/transfer to the per diem (completed).
    resolve_dispute_for_raiser: 'cancelled',
    resolve_dispute_for_other: 'completed',
    resolve_dispute_split: 'completed',
  },
  cancelled: {},
};

export class TransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransitionError';
  }
}

// Returns the resulting status for a (from, event) pair, or null if the
// transition is not allowed.
export function validTransition(
  from: AppearanceStatus,
  event: TransitionEvent
): AppearanceStatus | null {
  return TRANSITIONS[from]?.[event] ?? null;
}

export interface TransitionContext {
  // Side effect run after validation and before the status write. Throwing here
  // aborts the transition (status is not updated). Use for Stripe calls etc.
  sideEffect?: (args: {
    supabase: SupabaseClient;
    appearance: AppearanceRow;
    to: AppearanceStatus;
  }) => Promise<Record<string, unknown> | void>;
  // Extra columns to set alongside status (e.g. claimed_by, timestamps).
  patch?: Record<string, unknown>;
  // Extra data merged into the audit-log payload.
  payload?: Record<string, unknown>;
  // Event type string recorded in the audit log. Defaults to status.transition.
  auditEventType?: string;
}

interface AppearanceRow {
  id: string;
  status: AppearanceStatus;
  posted_by: string;
  claimed_by: string | null;
  [key: string]: unknown;
}

export interface TransitionResult {
  ok: boolean;
  from: AppearanceStatus;
  to: AppearanceStatus;
  appearance: AppearanceRow;
}

// Loads the appearance, validates the event, runs side effects, then updates
// status guarded by the expected from-status (optimistic concurrency — the
// guarded WHERE makes concurrent claims of the same row safe). Finally writes an
// audit-log row. Throws TransitionError on any failure.
export async function performTransition(
  supabase: SupabaseClient,
  appearanceId: string,
  event: TransitionEvent,
  actorUserId: string | null,
  ctx: TransitionContext = {}
): Promise<TransitionResult> {
  const { data: appearance, error: loadErr } = await supabase
    .from('appearances')
    .select('*')
    .eq('id', appearanceId)
    .single();

  if (loadErr || !appearance) {
    throw new TransitionError('Appearance not found');
  }

  const from = appearance.status as AppearanceStatus;
  const to = validTransition(from, event);
  if (!to) {
    throw new TransitionError(`Cannot ${event} an appearance in status "${from}"`);
  }

  let sideEffectPayload: Record<string, unknown> | undefined;
  if (ctx.sideEffect) {
    sideEffectPayload = (await ctx.sideEffect({ supabase, appearance, to })) ?? undefined;
  }

  // Guarded update: only succeeds if the row is still in the expected status.
  const { data: updated, error: updateErr } = await supabase
    .from('appearances')
    .update({ status: to, ...(ctx.patch ?? {}) })
    .eq('id', appearanceId)
    .eq('status', from)
    .select()
    .single();

  if (updateErr || !updated) {
    throw new TransitionError(
      updateErr?.message ?? 'Appearance changed concurrently; please retry'
    );
  }

  const { error: auditErr } = await supabase.from('audit_log').insert({
    appearance_id: appearanceId,
    actor_user_id: actorUserId,
    event_type: ctx.auditEventType ?? 'status.transition',
    from_status: from,
    to_status: to,
    payload: { event, ...(ctx.payload ?? {}), ...(sideEffectPayload ?? {}) },
  });
  if (auditErr) {
    // The status change already committed; surface the audit failure but don't
    // pretend the transition didn't happen.
    console.error('audit_log insert failed:', auditErr.message);
  }

  return { ok: true, from, to, appearance: updated };
}
