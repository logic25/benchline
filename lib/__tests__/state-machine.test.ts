import { describe, it, expect, vi } from 'vitest';
import {
  validTransition,
  performTransition,
  TransitionError,
  type TransitionEvent,
} from '@/lib/appearances/state-machine';
import type { AppearanceStatus } from '@/lib/types';

describe('validTransition', () => {
  const allowed: Array<[AppearanceStatus, TransitionEvent, AppearanceStatus]> = [
    ['open', 'claim', 'claimed'],
    ['open', 'cancel', 'cancelled'],
    ['claimed', 'check_in', 'in_progress'],
    ['claimed', 'cancel', 'cancelled'],
    ['claimed', 'dispute', 'disputed'],
    ['in_progress', 'confirm_completion', 'completed'],
    ['in_progress', 'auto_release', 'completed'],
    ['in_progress', 'dispute', 'disputed'],
    ['completed', 'dispute', 'disputed'],
    ['disputed', 'resolve_dispute', 'completed'],
    ['disputed', 'refund', 'cancelled'],
  ];

  it.each(allowed)('allows %s --%s--> %s', (from, event, to) => {
    expect(validTransition(from, event)).toBe(to);
  });

  const blocked: Array<[AppearanceStatus, TransitionEvent]> = [
    ['open', 'check_in'],
    ['open', 'confirm_completion'],
    ['claimed', 'claim'],
    ['claimed', 'confirm_completion'],
    ['in_progress', 'claim'],
    ['in_progress', 'cancel'],
    ['completed', 'claim'],
    ['completed', 'confirm_completion'],
    ['cancelled', 'claim'],
    ['cancelled', 'cancel'],
    ['disputed', 'claim'],
  ];

  it.each(blocked)('blocks %s --%s-->', (from, event) => {
    expect(validTransition(from, event)).toBeNull();
  });
});

// Minimal Supabase query-builder mock. select/eq/single resolve to a row;
// update().eq().eq().select().single() resolves to the updated row; insert resolves ok.
function makeSupabaseMock(opts: {
  appearance: Record<string, unknown> | null;
  updateReturns?: Record<string, unknown> | null;
  updateError?: { message: string } | null;
  // When true, the guarded update resolves to a null row (simulates a lost race).
  updateMatchesNothing?: boolean;
}) {
  const auditInsert = vi.fn().mockResolvedValue({ error: null });

  const from = vi.fn((table: string) => {
    if (table === 'audit_log') {
      return { insert: auditInsert };
    }
    // appearances
    const chain: Record<string, unknown> = {};
    chain.select = () => chain;
    chain.eq = () => chain;
    chain.single = () => Promise.resolve({ data: opts.appearance, error: opts.appearance ? null : { message: 'not found' } });
    chain.update = () => {
      const upd: Record<string, unknown> = {};
      upd.eq = () => upd;
      upd.select = () => upd;
      upd.single = () =>
        Promise.resolve({
          data:
            opts.updateError || opts.updateMatchesNothing
              ? null
              : opts.updateReturns ?? { ...opts.appearance, status: 'updated' },
          error: opts.updateError ?? null,
        });
      return upd;
    };
    return chain;
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { client: { from } as any, auditInsert };
}

describe('performTransition', () => {
  it('transitions a valid event and writes an audit row', async () => {
    const appearance = { id: 'a1', status: 'open', posted_by: 'p1', claimed_by: null };
    const { client, auditInsert } = makeSupabaseMock({
      appearance,
      updateReturns: { ...appearance, status: 'claimed', claimed_by: 'u2' },
    });

    const result = await performTransition(client, 'a1', 'claim', 'u2', {
      patch: { claimed_by: 'u2' },
    });

    expect(result.ok).toBe(true);
    expect(result.from).toBe('open');
    expect(result.to).toBe('claimed');
    expect(auditInsert).toHaveBeenCalledOnce();
    const auditArg = auditInsert.mock.calls[0][0];
    expect(auditArg.from_status).toBe('open');
    expect(auditArg.to_status).toBe('claimed');
  });

  it('rejects an invalid event for the current status', async () => {
    const appearance = { id: 'a1', status: 'open', posted_by: 'p1', claimed_by: null };
    const { client } = makeSupabaseMock({ appearance });

    await expect(performTransition(client, 'a1', 'confirm_completion', 'u2')).rejects.toBeInstanceOf(
      TransitionError
    );
  });

  it('throws when the appearance is missing', async () => {
    const { client } = makeSupabaseMock({ appearance: null });
    await expect(performTransition(client, 'missing', 'claim', 'u2')).rejects.toBeInstanceOf(
      TransitionError
    );
  });

  it('is idempotent: replaying a claim on an already-claimed row is rejected', async () => {
    // After the first claim the row is in 'claimed'; a duplicate request loads
    // the claimed row and validTransition('claimed','claim') is null.
    const claimed = { id: 'a1', status: 'claimed', posted_by: 'p1', claimed_by: 'u2' };
    const { client, auditInsert } = makeSupabaseMock({ appearance: claimed });

    await expect(performTransition(client, 'a1', 'claim', 'u3')).rejects.toBeInstanceOf(
      TransitionError
    );
    expect(auditInsert).not.toHaveBeenCalled();
  });

  it('treats a lost guarded update (concurrent change) as a failure', async () => {
    // Simulates two claims racing: the guarded WHERE status=open matches no rows
    // on the second caller, so the update returns null.
    const appearance = { id: 'a1', status: 'open', posted_by: 'p1', claimed_by: null };
    const { client } = makeSupabaseMock({ appearance, updateMatchesNothing: true });

    await expect(performTransition(client, 'a1', 'claim', 'u2')).rejects.toBeInstanceOf(
      TransitionError
    );
  });
});
