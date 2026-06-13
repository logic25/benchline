import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { sendMessageSchema } from '@/lib/validation/schemas';
import { sendForNotification } from '@/lib/email/send-for-notification';
import { rateLimitGuard } from '@/lib/api/guard';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 });
  }
  const { appearanceId, body: text, attachments } = parsed.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const blocked = await rateLimitGuard('mutation', user.id);
  if (blocked) return blocked;

  // Confirm the sender is an involved party. The thread only exists once the
  // appearance is claimed; messaging an unclaimed appearance has no recipient.
  const { data: appearance } = await supabase
    .from('appearances')
    .select('posted_by, claimed_by, case_caption')
    .eq('id', appearanceId)
    .single();
  if (!appearance) return NextResponse.json({ error: 'Appearance not found' }, { status: 404 });

  const isParty = appearance.posted_by === user.id || appearance.claimed_by === user.id;
  if (!isParty) return NextResponse.json({ error: 'Not a participant in this appearance' }, { status: 403 });
  if (!appearance.claimed_by) {
    return NextResponse.json({ error: 'Messaging opens once the appearance is claimed' }, { status: 409 });
  }

  // Insert under the user's session so RLS double-checks involvement.
  const { data: message, error: insertErr } = await supabase
    .from('messages')
    .insert({ appearance_id: appearanceId, sender_id: user.id, body: text, attachments })
    .select()
    .single();
  if (insertErr || !message) {
    return NextResponse.json({ error: insertErr?.message ?? 'Could not send message' }, { status: 500 });
  }

  const recipientId = appearance.posted_by === user.id ? appearance.claimed_by : appearance.posted_by;
  const service = createServiceClient();

  // Notify the recipient (cross-user insert requires the service role).
  const { error: nErr } = await service.from('notifications').insert({
    user_id: recipientId,
    type: 'message_received',
    title: 'New message',
    body: 'You have a new message about an appearance.',
    metadata: { appearance_id: appearanceId, message_id: message.id },
  });
  if (nErr) console.error('notifications insert:', nErr.message);

  // Audit the send without recording the message body (metadata only).
  const { error: auditErr } = await service.from('audit_log').insert({
    appearance_id: appearanceId,
    actor_user_id: user.id,
    event_type: 'message.sent',
    payload: { message_id: message.id, attachment_count: attachments.length, has_body: text.length > 0 },
  });
  if (auditErr) console.error('audit_log insert:', auditErr.message);

  await sendForNotification({
    service,
    recipientUserId: recipientId,
    notificationType: 'message_received',
    context: { appearanceId, caseCaption: appearance.case_caption },
  });

  return NextResponse.json({ message });
}
