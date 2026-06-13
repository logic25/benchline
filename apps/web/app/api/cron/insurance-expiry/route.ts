import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

// Daily Vercel cron. Marks expired insurance and sends reminder notifications at
// 30 days before expiry, on the expiry day, and 7 days after. Secured by the
// CRON_SECRET bearer header (same convention as auto-release).
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = createServiceClient();
  const now = new Date();
  const nowIso = now.toISOString();

  // 1) Flip verified -> expired once the policy has lapsed.
  const { data: lapsed } = await service
    .from('profiles')
    .select('id, insurance_expires_at')
    .eq('insurance_status', 'verified')
    .lt('insurance_expires_at', nowIso);

  let expiredCount = 0;
  for (const p of lapsed ?? []) {
    await service.from('profiles').update({ insurance_status: 'expired' }).eq('id', p.id);
    await notifyOnce(service, p.id, 'insurance_expired', 'Insurance expired', 'Your malpractice insurance has expired. You cannot claim new appearances until you upload a current policy.');
    expiredCount++;
  }

  // 2) Reminder 30 days before expiry (still verified).
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const in29 = new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000);
  const { data: soon } = await service
    .from('profiles')
    .select('id')
    .eq('insurance_status', 'verified')
    .gte('insurance_expires_at', in29.toISOString())
    .lt('insurance_expires_at', in30.toISOString());

  let warnedCount = 0;
  for (const p of soon ?? []) {
    await notifyOnce(service, p.id, 'insurance_expiring', 'Insurance expiring soon', 'Your malpractice insurance expires in about 30 days. Please renew and re-upload your policy.');
    warnedCount++;
  }

  // 3) Follow-up 7 days after expiry (now expired).
  const ago7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const ago8 = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
  const { data: stale } = await service
    .from('profiles')
    .select('id')
    .eq('insurance_status', 'expired')
    .gte('insurance_expires_at', ago8.toISOString())
    .lt('insurance_expires_at', ago7.toISOString());

  let followUpCount = 0;
  for (const p of stale ?? []) {
    await notifyOnce(service, p.id, 'insurance_expired', 'Insurance still expired', 'Your malpractice insurance has been expired for a week. Upload a current policy to resume claiming appearances.');
    followUpCount++;
  }

  return NextResponse.json({ expired: expiredCount, warned: warnedCount, followUp: followUpCount });
}

// Avoid duplicate notifications if the cron runs more than once in a day: only
// insert when no identical-type notification exists from the last 20 hours.
async function notifyOnce(
  service: ReturnType<typeof createServiceClient>,
  userId: string,
  type: 'insurance_expiring' | 'insurance_expired',
  title: string,
  body: string
) {
  const since = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();
  const { count } = await service
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('type', type)
    .gte('created_at', since);
  if ((count ?? 0) > 0) return;

  const { error } = await service.from('notifications').insert({ user_id: userId, type, title, body, metadata: {} });
  if (error) console.error('notifications insert:', error.message);
}
