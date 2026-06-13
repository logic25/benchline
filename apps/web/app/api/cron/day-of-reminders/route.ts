import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { sendSms, isSmsConfigured } from '@/lib/sms/client';

// Hourly Vercel cron (intended for the morning hours). Sends a day-of SMS to the
// per diem covering each appearance scheduled later today, when their court time
// is within the next 4 hours. Only phone-verified users receive SMS. A
// 'sms.day_of_reminder' audit row per appearance prevents double-sends.
//
// Secured by the CRON_SECRET bearer header (same convention as the other crons).
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isSmsConfigured()) {
    return NextResponse.json({ skipped: 'sms_not_configured' });
  }

  const service = createServiceClient();
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://benchline.app';

  // Claimed/in-progress appearances scheduled today.
  const { data: due, error } = await service
    .from('appearances')
    .select('id, court_name, court_address, appearance_time, case_caption, claimed_by, status')
    .eq('appearance_date', todayStr)
    .in('status', ['claimed', 'in_progress'])
    .not('claimed_by', 'is', null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: { id: string; sent: boolean; reason?: string }[] = [];
  for (const appt of due ?? []) {
    // Within the next 4 hours?
    const apptTime = parseTimeToday(appt.appearance_time, now);
    if (!apptTime) {
      results.push({ id: appt.id, sent: false, reason: 'bad_time' });
      continue;
    }
    const hoursUntil = (apptTime.getTime() - now.getTime()) / (60 * 60 * 1000);
    if (hoursUntil < 0 || hoursUntil > 4) {
      results.push({ id: appt.id, sent: false, reason: 'outside_window' });
      continue;
    }

    // Skip if we already sent a reminder for this appearance.
    const { count } = await service
      .from('audit_log')
      .select('id', { count: 'exact', head: true })
      .eq('appearance_id', appt.id)
      .eq('event_type', 'sms.day_of_reminder');
    if ((count ?? 0) > 0) {
      results.push({ id: appt.id, sent: false, reason: 'already_sent' });
      continue;
    }

    // Recipient must be phone-verified.
    const { data: claimer } = await service
      .from('profiles')
      .select('phone, phone_verified')
      .eq('id', appt.claimed_by)
      .single();
    if (!claimer?.phone_verified || !claimer.phone) {
      results.push({ id: appt.id, sent: false, reason: 'phone_not_verified' });
      continue;
    }

    const lines = [
      `Benchline reminder: ${appt.case_caption} today at ${appt.appearance_time}.`,
      `${appt.court_name}${appt.court_address ? `, ${appt.court_address}` : ''}.`,
      `Details: ${appUrl}/appearances/${appt.id}`,
    ];
    const sid = await sendSms(claimer.phone, lines.join('\n'));

    await service.from('audit_log').insert({
      appearance_id: appt.id,
      actor_user_id: appt.claimed_by,
      event_type: 'sms.day_of_reminder',
      payload: { sent: Boolean(sid), sid: sid ?? null },
    });

    results.push({ id: appt.id, sent: Boolean(sid), reason: sid ? undefined : 'send_failed' });
  }

  return NextResponse.json({ considered: results.length, sent: results.filter((r) => r.sent).length, results });
}

// Combines an HH:MM[:SS] time string with today's date in local server time.
function parseTimeToday(time: string, now: Date): Date | null {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(time);
  if (!m) return null;
  const d = new Date(now);
  d.setHours(Number(m[1]), Number(m[2]), m[3] ? Number(m[3]) : 0, 0);
  return d;
}
