import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { performTransition, TransitionError } from '@/lib/appearances/state-machine';
import { hasConflict } from '@/lib/conflict/check';
import { claimSchema } from '@/lib/validation/schemas';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const parsed = claimSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 });
  }
  const { appearanceId } = parsed.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // The state machine runs under the service role (bypasses RLS), so the
  // verification gate must be enforced here in code, not only via RLS.
  const { data: claimer } = await supabase
    .from('profiles')
    .select('bar_verification_status, insurance_status')
    .eq('id', user.id)
    .single();
  if (claimer?.bar_verification_status !== 'verified') {
    return NextResponse.json(
      { error: 'You must complete bar verification before claiming appearances.' },
      { status: 403 }
    );
  }
  if (claimer?.insurance_status !== 'verified') {
    return NextResponse.json(
      { error: 'You must have verified malpractice insurance on file before claiming appearances.' },
      { status: 403 }
    );
  }

  // Pre-flight ownership/eligibility checks against the open row.
  const { data: appearance } = await supabase
    .from('appearances')
    .select('posted_by, case_caption')
    .eq('id', appearanceId)
    .eq('status', 'open')
    .single();
  if (!appearance) return NextResponse.json({ error: 'Appearance not available' }, { status: 400 });
  if (appearance.posted_by === user.id) {
    return NextResponse.json({ error: 'Cannot claim your own appearance' }, { status: 400 });
  }

  const service = createServiceClient();

  // Conflict-of-interest gate, before any state change.
  const conflict = await hasConflict(service, user.id, appearanceId);
  if (conflict.conflict) {
    const { error: auditErr } = await service.from('audit_log').insert({
      appearance_id: appearanceId,
      actor_user_id: user.id,
      event_type: 'conflict.blocked',
      payload: { reason: conflict.reason ?? 'conflict of interest' },
    });
    if (auditErr) console.error('audit_log insert:', auditErr.message);
    return NextResponse.json(
      { error: conflict.reason ?? 'A conflict of interest prevents you from claiming this appearance.' },
      { status: 403 }
    );
  }

  try {
    await performTransition(service, appearanceId, 'claim', user.id, {
      auditEventType: 'appearance.claimed',
      patch: { claimed_by: user.id, claimed_at: new Date().toISOString() },
    });
  } catch (err) {
    if (err instanceof TransitionError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Claim failed' }, { status: 500 });
  }

  // Notify the poster (service role can insert across users).
  const { error: nErr } = await service.from('notifications').insert({
    user_id: appearance.posted_by,
    type: 'appearance_claimed',
    title: 'Appearance Claimed',
    body: `Your appearance for ${appearance.case_caption} has been claimed.`,
    metadata: { appearance_id: appearanceId },
  });
  if (nErr) console.error('notifications insert:', nErr);

  return NextResponse.json({ success: true });
}
