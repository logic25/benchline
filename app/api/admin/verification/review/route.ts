import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { verificationReviewSchema } from '@/lib/validation/schemas';
import { sendForNotification } from '@/lib/email/send-for-notification';
import { rateLimitGuard } from '@/lib/api/guard';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const parsed = verificationReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 });
  }
  const { kind, requestId, decision, reviewNotes } = parsed.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const blocked = await rateLimitGuard('mutation', user.id);
  if (blocked) return blocked;

  // Admin gate: read the caller's own profile (RLS lets users read profiles).
  const { data: me } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!me?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const service = createServiceClient();
  const nowIso = new Date().toISOString();
  const requestStatus = decision === 'approve' ? 'approved' : 'rejected';

  if (kind === 'bar') {
    const { data: req } = await service
      .from('bar_verification_requests')
      .select('user_id, status')
      .eq('id', requestId)
      .single();
    if (!req) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

    const { error: updErr } = await service
      .from('bar_verification_requests')
      .update({ status: requestStatus, reviewed_by: user.id, reviewed_at: nowIso, review_notes: reviewNotes ?? null })
      .eq('id', requestId);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    const profilePatch =
      decision === 'approve'
        ? {
            bar_verification_status: 'verified' as const,
            bar_verified: true,
            bar_verified_at: nowIso,
            bar_verification_method: 'manual' as const,
            bar_verification_notes: reviewNotes ?? null,
            bar_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          }
        : {
            bar_verification_status: 'rejected' as const,
            bar_verified: false,
            bar_verification_notes: reviewNotes ?? null,
          };
    const { error: profErr } = await service.from('profiles').update(profilePatch).eq('id', req.user_id);
    if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 });

    await notify(service, req.user_id, decision, 'bar');
    await audit(service, user.id, 'verification.bar.reviewed', { request_id: requestId, decision });
  } else {
    const { data: req } = await service
      .from('insurance_uploads')
      .select('user_id, carrier, policy_number, coverage_amount_cents, expires_date')
      .eq('id', requestId)
      .single();
    if (!req) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

    const { error: updErr } = await service
      .from('insurance_uploads')
      .update({ status: requestStatus, reviewed_by: user.id, reviewed_at: nowIso, review_notes: reviewNotes ?? null })
      .eq('id', requestId);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    const profilePatch =
      decision === 'approve'
        ? {
            insurance_status: 'verified' as const,
            insurance_verified_at: nowIso,
            insurance_carrier: req.carrier,
            insurance_policy_number: req.policy_number,
            insurance_coverage_amount_cents: req.coverage_amount_cents,
            insurance_expires_at: req.expires_date ? new Date(req.expires_date).toISOString() : null,
          }
        : { insurance_status: 'none' as const };
    const { error: profErr } = await service.from('profiles').update(profilePatch).eq('id', req.user_id);
    if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 });

    await notify(service, req.user_id, decision, 'insurance');
    await audit(service, user.id, 'verification.insurance.reviewed', { request_id: requestId, decision });
  }

  return NextResponse.json({ success: true });
}

async function notify(
  service: ReturnType<typeof createServiceClient>,
  userId: string,
  decision: 'approve' | 'reject',
  kind: 'bar' | 'insurance'
) {
  const label = kind === 'bar' ? 'Bar verification' : 'Insurance verification';
  const { error } = await service.from('notifications').insert({
    user_id: userId,
    type: 'verification_reviewed',
    title: decision === 'approve' ? `${label} approved` : `${label} needs attention`,
    body:
      decision === 'approve'
        ? `Your ${label.toLowerCase()} has been approved.`
        : `Your ${label.toLowerCase()} was not approved. Please review and resubmit.`,
    metadata: { kind, decision },
  });
  if (error) console.error('notifications insert:', error.message);

  await sendForNotification({
    service,
    recipientUserId: userId,
    emailKey: decision === 'approve' ? 'verification_approved' : 'verification_rejected',
    context: {
      body:
        decision === 'approve'
          ? `Your ${label.toLowerCase()} has been approved.`
          : `Your ${label.toLowerCase()} was not approved. Please review and resubmit.`,
    },
  });
}

async function audit(
  service: ReturnType<typeof createServiceClient>,
  actorId: string,
  eventType: string,
  payload: Record<string, unknown>
) {
  const { error } = await service.from('audit_log').insert({ actor_user_id: actorId, event_type: eventType, payload });
  if (error) console.error('audit_log insert:', error.message);
}
