import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { hasConflict } from '@/lib/conflict/check';

interface Fixture {
  appearance: Record<string, unknown> | null;
  profile: Record<string, unknown> | null;
  declarations: Record<string, unknown>[];
}

// Minimal chainable mock that returns canned rows per table. The query shape in
// check.ts is from(table).select(...).eq(...).single() for appearance/profile
// and from(table).select(...).eq(...) for declarations.
function mockSupabase(f: Fixture): SupabaseClient {
  function builder(table: string) {
    const chain = {
      select() { return chain; },
      eq() { return chain; },
      single() {
        if (table === 'appearances') return Promise.resolve({ data: f.appearance, error: null });
        if (table === 'profiles') return Promise.resolve({ data: f.profile, error: null });
        return Promise.resolve({ data: null, error: null });
      },
      then(resolve: (v: { data: unknown; error: null }) => unknown) {
        // For the declarations query (no .single()), the chain is awaited directly.
        return Promise.resolve({ data: f.declarations, error: null }).then(resolve);
      },
    };
    return chain;
  }
  return { from: (table: string) => builder(table) } as unknown as SupabaseClient;
}

const baseProfile = {
  full_name: 'Jane Doe',
  firm_name: 'Doe Legal',
  firm_bar_numbers: ['111'],
  bar_number: '222',
};

describe('hasConflict', () => {
  it('returns no conflict when opposing counsel is unrelated', async () => {
    const s = mockSupabase({
      appearance: { opposing_counsel_name: 'Bob Smith', opposing_counsel_firm: 'Smith LLP', opposing_counsel_bar_number: '999' },
      profile: baseProfile,
      declarations: [],
    });
    expect(await hasConflict(s, 'u1', 'a1')).toEqual({ conflict: false });
  });

  it('flags conflict when opposing counsel bar matches the user own bar', async () => {
    const s = mockSupabase({
      appearance: { opposing_counsel_name: 'X', opposing_counsel_firm: null, opposing_counsel_bar_number: '222' },
      profile: baseProfile,
      declarations: [],
    });
    const r = await hasConflict(s, 'u1', 'a1');
    expect(r.conflict).toBe(true);
  });

  it('flags conflict when opposing counsel bar matches a firm bar number', async () => {
    const s = mockSupabase({
      appearance: { opposing_counsel_name: 'X', opposing_counsel_firm: null, opposing_counsel_bar_number: '111' },
      profile: baseProfile,
      declarations: [],
    });
    expect((await hasConflict(s, 'u1', 'a1')).conflict).toBe(true);
  });

  it('flags conflict when opposing counsel name matches the user (case-insensitive)', async () => {
    const s = mockSupabase({
      appearance: { opposing_counsel_name: '  jane   DOE ', opposing_counsel_firm: null, opposing_counsel_bar_number: null },
      profile: baseProfile,
      declarations: [],
    });
    expect((await hasConflict(s, 'u1', 'a1')).conflict).toBe(true);
  });

  it('flags conflict when opposing firm matches the user firm', async () => {
    const s = mockSupabase({
      appearance: { opposing_counsel_name: 'X', opposing_counsel_firm: 'Doe Legal', opposing_counsel_bar_number: null },
      profile: baseProfile,
      declarations: [],
    });
    expect((await hasConflict(s, 'u1', 'a1')).conflict).toBe(true);
  });

  it('flags conflict against a declared party name', async () => {
    const s = mockSupabase({
      appearance: { opposing_counsel_name: 'Adverse Al', opposing_counsel_firm: null, opposing_counsel_bar_number: null },
      profile: baseProfile,
      declarations: [{ conflicted_party_name: 'Adverse Al', conflicted_party_firm: null, conflicted_party_bar_number: null }],
    });
    expect((await hasConflict(s, 'u1', 'a1')).conflict).toBe(true);
  });

  it('flags conflict against a declared bar number', async () => {
    const s = mockSupabase({
      appearance: { opposing_counsel_name: 'X', opposing_counsel_firm: null, opposing_counsel_bar_number: '777' },
      profile: baseProfile,
      declarations: [{ conflicted_party_name: 'Whoever', conflicted_party_firm: null, conflicted_party_bar_number: '777' }],
    });
    expect((await hasConflict(s, 'u1', 'a1')).conflict).toBe(true);
  });

  it('returns no conflict when the appearance is missing', async () => {
    const s = mockSupabase({ appearance: null, profile: baseProfile, declarations: [] });
    expect(await hasConflict(s, 'u1', 'a1')).toEqual({ conflict: false });
  });
});
