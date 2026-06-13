import type { SupabaseClient } from '@supabase/supabase-js';

// Conflict-of-interest gate. A per diem attorney must not cover a case where the
// opposing counsel is themselves, their firm, or a party they have explicitly
// declared a conflict against. The claim route calls hasConflict BEFORE running
// the state-machine transition and blocks with 403 + reason on a match.

export interface ConflictResult {
  conflict: boolean;
  reason?: string;
}

function norm(s: string | null | undefined): string {
  return (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export async function hasConflict(
  supabase: SupabaseClient,
  userId: string,
  appearanceId: string
): Promise<ConflictResult> {
  const { data: appearance } = await supabase
    .from('appearances')
    .select('opposing_counsel_name, opposing_counsel_firm, opposing_counsel_bar_number')
    .eq('id', appearanceId)
    .single();
  if (!appearance) return { conflict: false };

  const oppName = norm(appearance.opposing_counsel_name);
  const oppFirm = norm(appearance.opposing_counsel_firm);
  const oppBar = norm(appearance.opposing_counsel_bar_number);

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, firm_name, firm_bar_numbers, bar_number')
    .eq('id', userId)
    .single();

  // 1) The claimer is the opposing counsel (by bar number or name), or the
    //    opposing firm matches the claimer's firm.
  if (profile) {
    const ownBars = [
      norm(profile.bar_number),
      ...((profile.firm_bar_numbers as string[] | null) ?? []).map(norm),
    ].filter(Boolean);
    if (oppBar && ownBars.includes(oppBar)) {
      return { conflict: true, reason: 'Opposing counsel bar number matches your own or your firm.' };
    }
    if (oppName && norm(profile.full_name) && oppName === norm(profile.full_name)) {
      return { conflict: true, reason: 'You are listed as opposing counsel on this appearance.' };
    }
    if (oppFirm && norm(profile.firm_name) && oppFirm === norm(profile.firm_name)) {
      return { conflict: true, reason: 'Opposing counsel is from your firm.' };
    }
  }

  // 2) The claimer has declared a conflict against the opposing party.
  const { data: declarations } = await supabase
    .from('conflict_declarations')
    .select('conflicted_party_name, conflicted_party_firm, conflicted_party_bar_number')
    .eq('user_id', userId);

  for (const d of declarations ?? []) {
    const dName = norm(d.conflicted_party_name);
    const dFirm = norm(d.conflicted_party_firm);
    const dBar = norm(d.conflicted_party_bar_number);
    if (dBar && oppBar && dBar === oppBar) {
      return { conflict: true, reason: 'Opposing counsel matches a declared conflict (bar number).' };
    }
    if (dName && oppName && dName === oppName) {
      return { conflict: true, reason: 'Opposing counsel matches a declared conflict (name).' };
    }
    if (dFirm && oppFirm && dFirm === oppFirm) {
      return { conflict: true, reason: 'Opposing counsel firm matches a declared conflict.' };
    }
  }

  return { conflict: false };
}
