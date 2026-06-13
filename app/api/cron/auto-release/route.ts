import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { releaseAppearancePayment } from '@/lib/stripe/release';

// Vercel cron endpoint. Auto-releases captured payments once their 24h hold has
// elapsed and a report has been submitted. Secured by the CRON_SECRET header
// (Vercel cron sends `Authorization: Bearer <CRON_SECRET>`).
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = createServiceClient();
  const now = new Date().toISOString();

  // Candidates: hold elapsed, payment captured (not yet released), still in
  // progress. The report-existence check happens inside the release helper.
  const { data: due, error } = await service
    .from('appearances')
    .select('id')
    .lt('auto_release_at', now)
    .eq('payment_status', 'captured')
    .eq('status', 'in_progress');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: { id: string; ok: boolean; note?: string; error?: string }[] = [];
  for (const row of due ?? []) {
    try {
      const r = await releaseAppearancePayment(service, row.id, null, { auto: true });
      results.push({ id: row.id, ok: true, note: r.note });
    } catch (err) {
      results.push({ id: row.id, ok: false, error: err instanceof Error ? err.message : 'failed' });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
