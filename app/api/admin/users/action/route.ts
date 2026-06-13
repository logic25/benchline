import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { sendForNotification } from '@/lib/email/send-for-notification';
import { log } from '@/lib/log';

const schema = z.object({
  userId: z.string().uuid(),
  action: z.enum(['toggle_suspend', 'toggle_admin', 'resend_verification']),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 });
  }
  const { userId, action } = parsed.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: me } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!me?.is_admin) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const service = createServiceClient();
  const { data: target } = await service
    .from('profiles')
    .select('id, is_admin, suspended')
    .eq('id', userId)
    .single();
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const nowIso = new Date().toISOString();
  let patch: Record<string, unknown> | null = null;
  let eventType = `admin.user.${action}`;

  if (action === 'toggle_suspend') {
    if (userId === user.id) return NextResponse.json({ error: 'You cannot suspend yourself' }, { status: 400 });
    const next = !target.suspended;
    patch = { suspended: next, suspended_at: next ? nowIso : null };
    eventType = next ? 'admin.user.suspended' : 'admin.user.unsuspended';
  } else if (action === 'toggle_admin') {
    if (userId === user.id) return NextResponse.json({ error: 'You cannot change your own admin status' }, { status: 400 });
    patch = { is_admin: !target.is_admin };
    eventType = target.is_admin ? 'admin.user.admin_revoked' : 'admin.user.admin_granted';
  } else {
    // resend_verification: best-effort re-engagement nudge; never fails the request.
    const sent = await sendForNotification({ service, recipientUserId: userId, emailKey: 'welcome' });
    log.info('admin.user.resend_verification', { userId, sent });
  }

  if (patch) {
    const { error } = await service.from('profiles').update(patch).eq('id', userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await service.from('audit_log').insert({
    appearance_id: null,
    actor_user_id: user.id,
    event_type: eventType,
    payload: { target_user_id: userId },
  });

  return NextResponse.json({ success: true });
}
