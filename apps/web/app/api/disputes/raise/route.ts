import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { performTransition, TransitionError } from '@/lib/appearances/state-machine';
import { raiseDisputeSchema } from '@/lib/validation/schemas';
import { sendForNotification } from '@/lib/email/send-for-notification';
import { rateLimitGuard } from '@/lib/api/guard';
import { NextRequest, NextResponse } from 'next/server';

// A completed appearance may only be disputed within this window after
// completion (in_progress appearances have no window).
const DISPUTE_WINDOW_DAYS = 7;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const parsed = raiseDisputeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 });
  }
  const { appearanceId, reason, evidenceUrls } = parsed.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const blocked = await rateLimitGuard('mutation', user.id);
  if (blocked) return blocked;

  // Only an involved party (poster or claimer) may raise a dispute.
  const { data: appearance } = await supabase
    .from('appearances')
    .select('id, posted_by, claimed_by, status, completed_at, case_caption')
    .eq('id', appearanceId)
    .single();
  if (!appearance) return NextResponse.json({ error: 'Appearance not found' }, { status: 404 });

  const isPoster = appearance.posted_by === user.id;
  const isClaimer = appearance.claimed_by === user.id;
  if (!isPoster && !isClaimer) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Enforce the 7-day window for already-completed appearances.
  if (appearance.status === 'completed') {
    if (!appearance.completed_at) {
      return NextResponse.json({ error: 'This appearance can no longer be disputed' }, { status: 409 });
    }
    const ageMs = Date.now() - new Date(appearance.completed_at).getTime();
    if (ageMs > DISPUTE_WINDOW_DAYS * 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        { error: `Disputes must be raised within ${DISPUTE_WINDOW_DAYS} days of completion` },
        { status: 409 }
      );
    }
  }

  const against = isPoster ? appearance.claimed_by : appearance.posted_by;
  if (!against) {
    return NextResponse.json({ error: 'No counterparty to dispute against' }, { status: 409 });
  }

  const service = createServiceClient();

  // Move the appearance to disputed via the state machine (validates the
  // from-status and writes an audit-log entry).
  try {
    await performTransition(service, appearanceId, 'raise_dispute', user.id, {
      auditEventType: 'dispute.raised',
      payload: { raised_by: user.id, against },
    });
  } catch (err) {
    if (err instanceof TransitionError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not raise dispute' },
      { status: 500 }
    );
  }

  const { data: dispute, error: insErr } = await service
    .from('disputes')
    .insert({
      appearance_id: appearanceId,
      raised_by: user.id,
      against,
      reason,
      evidence_urls: evidenceUrls,
      status: 'open',
    })
    .select()
    .single();
  if (insErr || !dispute) {
    return NextResponse.json({ error: insErr?.message ?? 'Could not record dispute' }, { status: 500 });
  }

  // Notify the counterparty.
  const { error: nErr } = await service.from('notifications').insert({
    user_id: against,
    type: 'dispute_update',
    title: 'A dispute was opened',
    body: `A dispute has been opened on ${appearance.case_caption}. An admin will review it.`,
    metadata: { appearance_id: appearanceId, dispute_id: dispute.id },
  });
  if (nErr) console.error('notifications insert:', nErr.message);

  await sendForNotification({
    service,
    recipientUserId: against,
    notificationType: 'dispute_update',
    context: {
      appearanceId,
      caseCaption: appearance.case_caption,
      body: `A dispute has been opened on ${appearance.case_caption}. An admin will review it.`,
    },
  });

  return NextResponse.json({ success: true, dispute });
}
