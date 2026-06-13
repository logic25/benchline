// Plain-HTML transactional email templates. Each template returns a subject +
// html body. Kept dependency-free (no React Email) so they render the same on
// the server with no build step.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://benchline.app';

export interface RenderedEmail {
  subject: string;
  html: string;
}

function layout(heading: string, bodyHtml: string, cta?: { label: string; href: string }): string {
  const button = cta
    ? `<tr><td style="padding:8px 0 0;">
         <a href="${cta.href}" style="display:inline-block;background:#1a1a2e;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;font-size:14px;">${cta.label}</a>
       </td></tr>`
    : '';
  return `<!doctype html><html><body style="margin:0;background:#f4f4f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:24px 0;">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e6e6ea;">
          <tr><td style="background:#1a1a2e;padding:20px 28px;">
            <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-0.02em;">Benchline</span>
          </td></tr>
          <tr><td style="padding:28px;">
            <h1 style="margin:0 0 12px;font-size:20px;color:#1a1a2e;">${heading}</h1>
            <div style="font-size:14px;line-height:1.6;color:#3a3a44;">${bodyHtml}</div>
            <table cellpadding="0" cellspacing="0">${button}</table>
          </td></tr>
          <tr><td style="padding:18px 28px;border-top:1px solid #eee;font-size:12px;color:#9a9aa5;">
            Benchline — per diem coverage for NY attorneys.
            <a href="${APP_URL}/settings" style="color:#9a9aa5;">Manage notifications</a>.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;
}

export type EmailKey =
  | 'appearance_claimed'
  | 'check_in'
  | 'report_submitted'
  | 'payment_released'
  | 'auto_release_warning'
  | 'review_received'
  | 'verification_approved'
  | 'verification_rejected'
  | 'insurance_expiring'
  | 'dispute_update'
  | 'message_received'
  | 'welcome';

export interface EmailContext {
  recipientName?: string;
  title?: string;
  body?: string;
  appearanceId?: string;
  caseCaption?: string;
  extra?: Record<string, unknown>;
}

function appearanceLink(id?: string): string {
  return id ? `${APP_URL}/appearances/${id}` : `${APP_URL}/dashboard`;
}

// Renders the email for a given key. Unknown keys fall back to a generic
// notification email built from title/body so new notification types still send.
export function renderEmail(key: EmailKey | string, ctx: EmailContext): RenderedEmail {
  const name = ctx.recipientName ? `${ctx.recipientName}` : 'there';
  const caseName = ctx.caseCaption ? `<strong>${ctx.caseCaption}</strong>` : 'your appearance';
  const link = appearanceLink(ctx.appearanceId);

  switch (key) {
    case 'welcome':
      return {
        subject: 'Welcome to Benchline',
        html: layout(
          `Welcome, ${name}`,
          `<p>Thanks for joining Benchline. Complete your bar verification to start posting or covering appearances.</p>`,
          { label: 'Go to dashboard', href: `${APP_URL}/dashboard` }
        ),
      };
    case 'appearance_claimed':
      return {
        subject: 'Your appearance was claimed',
        html: layout(
          'Appearance claimed',
          `<p>Good news — ${caseName} has been claimed by a per diem attorney.</p>`,
          { label: 'View appearance', href: link }
        ),
      };
    case 'check_in':
      return {
        subject: 'Per diem checked in',
        html: layout(
          'Checked in at the courthouse',
          `<p>Your per diem attorney has checked in for ${caseName}.</p>`,
          { label: 'View appearance', href: link }
        ),
      };
    case 'report_submitted':
      return {
        subject: 'Outcome report submitted',
        html: layout(
          'Outcome report is ready',
          `<p>An outcome report was submitted for ${caseName}. Review it and release payment when you are satisfied.</p>`,
          { label: 'Review report', href: link }
        ),
      };
    case 'payment_released':
      return {
        subject: 'Payment released',
        html: layout(
          'You have been paid',
          `<p>${ctx.body || 'Payment for your appearance has been released.'}</p>`,
          { label: 'View earnings', href: `${APP_URL}/earnings` }
        ),
      };
    case 'auto_release_warning':
      return {
        subject: 'Payment will auto-release soon',
        html: layout(
          'Confirm within 4 hours',
          `<p>Payment for ${caseName} will auto-release in about 4 hours unless you confirm or raise an issue.</p>`,
          { label: 'Review now', href: link }
        ),
      };
    case 'review_received':
      return {
        subject: 'You received a review',
        html: layout(
          'New review',
          `<p>${ctx.body || 'You received a new review on a completed appearance.'}</p>`,
          { label: 'View profile', href: `${APP_URL}/profile` }
        ),
      };
    case 'verification_approved':
      return {
        subject: 'Verification approved',
        html: layout(
          'You are verified',
          `<p>${ctx.body || 'Your verification has been approved. You can now post and claim appearances.'}</p>`,
          { label: 'Go to dashboard', href: `${APP_URL}/dashboard` }
        ),
      };
    case 'verification_rejected':
      return {
        subject: 'Verification needs attention',
        html: layout(
          'Verification not approved',
          `<p>${ctx.body || 'Your verification was not approved. Please review and resubmit.'}</p>`,
          { label: 'Resubmit', href: `${APP_URL}/verify` }
        ),
      };
    case 'insurance_expiring':
      return {
        subject: 'Your malpractice insurance is expiring',
        html: layout(
          'Insurance expiring',
          `<p>${ctx.body || 'Your malpractice insurance on file is expiring soon. Upload a renewal to keep claiming appearances.'}</p>`,
          { label: 'Update insurance', href: `${APP_URL}/verify` }
        ),
      };
    case 'dispute_update':
      return {
        subject: 'Dispute update',
        html: layout(
          ctx.title || 'Dispute update',
          `<p>${ctx.body || 'There is an update on a dispute involving your appearance.'}</p>`,
          { label: 'View appearance', href: link }
        ),
      };
    case 'message_received':
      return {
        subject: 'New message on Benchline',
        html: layout(
          'New message',
          `<p>You have a new message about ${caseName}.</p>`,
          { label: 'Open conversation', href: link }
        ),
      };
    default:
      return {
        subject: ctx.title || 'Benchline notification',
        html: layout(ctx.title || 'Notification', `<p>${ctx.body || ''}</p>`, {
          label: 'Open Benchline',
          href: `${APP_URL}/dashboard`,
        }),
      };
  }
}
