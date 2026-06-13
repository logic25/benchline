import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { performTransition, TransitionError } from '@/lib/appearances/state-machine';
import { checkInSchema } from '@/lib/validation/schemas';
import { sendForNotification } from '@/lib/email/send-for-notification';
import { rateLimitGuard } from '@/lib/api/guard';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const parsed = checkInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 });
  }
  const { appearanceId } = parsed.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const blocked = await rateLimitGuard('mutation', user.id);
  if (blocked) return blocked;

  // Only the claimer may check in.
  const { data: appearance } = await supabase
    .from('appearances')
    .select('posted_by, claimed_by, case_caption')
    .eq('id', appearanceId)
    .single();
  if (!appearance || appearance.claimed_by !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = createServiceClient();
  try {
    await performTransition(service, appearanceId, 'check_in', user.id, {
      auditEventType: 'appearance.checked_in',
    });
  } catch (err) {
    if (err instanceof TransitionError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Check-in failed' }, { status: 500 });
  }

  const { error: nErr } = await service.from('notifications').insert({
    user_id: appearance.posted_by,
    type: 'check_in',
    title: 'Per Diem Checked In',
    body: `Your per diem attorney has checked in for ${appearance.case_caption}.`,
    metadata: { appearance_id: appearanceId },
  });
  if (nErr) console.error('notifications insert:', nErr);

  await sendForNotification({
    service,
    recipientUserId: appearance.posted_by,
    notificationType: 'check_in',
    context: { appearanceId, caseCaption: appearance.case_caption },
  });

  return NextResponse.json({ success: true });
}
