import type { SupabaseClient } from '@supabase/supabase-js';
import { getResend, emailFrom } from '@/lib/email/client';
import { renderEmail, type EmailKey, type EmailContext } from '@/lib/email/templates';

// Maps an in-app notification type to a transactional email template. A few
// notification types fan out to different emails depending on metadata
// (handled by the caller passing an explicit emailKey).
const NOTIFICATION_TO_EMAIL: Record<string, EmailKey> = {
  appearance_claimed: 'appearance_claimed',
  check_in: 'check_in',
  report_submitted: 'report_submitted',
  payment_released: 'payment_released',
  review_received: 'review_received',
  insurance_expiring: 'insurance_expiring',
  message_received: 'message_received',
  dispute_update: 'dispute_update',
};

interface SendArgs {
  // Service-role client; this is called from server code that bypasses RLS.
  service: SupabaseClient;
  recipientUserId: string;
  // Either provide a notification type (mapped above) or an explicit email key.
  notificationType?: string;
  emailKey?: EmailKey;
  context?: Omit<EmailContext, 'recipientName'>;
}

// Sends the transactional email that mirrors an in-app notification. Never
// throws: on any failure it records an audit_log row and returns false, so the
// user-facing transaction is unaffected. Returns true only when Resend accepts
// the message.
export async function sendForNotification(args: SendArgs): Promise<boolean> {
  const { service, recipientUserId, notificationType, context } = args;
  const key = args.emailKey ?? (notificationType ? NOTIFICATION_TO_EMAIL[notificationType] : undefined);
  if (!key) return false;

  const resend = getResend();
  if (!resend) return false; // Email not configured; degrade silently.

  let recipientEmail: string | undefined;
  let recipientName: string | undefined;
  try {
    const { data: profile } = await service
      .from('profiles')
      .select('email, full_name')
      .eq('id', recipientUserId)
      .single();
    recipientEmail = profile?.email ?? undefined;
    recipientName = profile?.full_name ?? undefined;
  } catch {
    recipientEmail = undefined;
  }
  if (!recipientEmail) return false;

  const rendered = renderEmail(key, { ...context, recipientName });

  try {
    const { error } = await resend.emails.send({
      from: emailFrom(),
      to: recipientEmail,
      subject: rendered.subject,
      html: rendered.html,
    });
    if (error) {
      await logFailure(service, recipientUserId, key, error.message ?? 'resend error', context?.appearanceId);
      return false;
    }
    return true;
  } catch (err) {
    await logFailure(
      service,
      recipientUserId,
      key,
      err instanceof Error ? err.message : 'resend threw',
      context?.appearanceId
    );
    return false;
  }
}

async function logFailure(
  service: SupabaseClient,
  recipientUserId: string,
  key: string,
  message: string,
  appearanceId?: string
): Promise<void> {
  const { error } = await service.from('audit_log').insert({
    appearance_id: appearanceId ?? null,
    actor_user_id: recipientUserId,
    event_type: 'email.send_failed',
    payload: { email_key: key, error: message },
  });
  if (error) console.error('audit_log insert (email failure):', error.message);
}
