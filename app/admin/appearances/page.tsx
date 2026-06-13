import { createServiceClient } from '@/lib/supabase/service';
import type { AppearanceStatus, PaymentStatus } from '@/lib/types';
import { AppearancesTable, type AdminAppearanceRow } from '@/components/admin/appearances-table';

export const dynamic = 'force-dynamic';

type SearchParams = {
  status?: string;
  payment_status?: string;
  from?: string;
  to?: string;
  has_dispute?: string;
  q?: string;
  [key: string]: string | undefined;
};

export default async function AdminAppearancesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const service = createServiceClient();

  let query = service
    .from('appearances')
    .select(
      'id, status, payment_status, court_name, borough, appearance_date, pay_rate, created_at, case_caption, posted_by, claimed_by, poster:profiles!appearances_posted_by_fkey(full_name), claimer:profiles!appearances_claimed_by_fkey(full_name)'
    )
    .order('created_at', { ascending: false })
    .limit(200);

  if (sp.status) query = query.eq('status', sp.status);
  if (sp.payment_status) query = query.eq('payment_status', sp.payment_status);
  if (sp.from) query = query.gte('appearance_date', sp.from);
  if (sp.to) query = query.lte('appearance_date', sp.to);

  const { data } = await query;
  let rows = (data ?? []) as unknown as AdminAppearanceRow[];

  // has_dispute filter requires a join we resolve separately to keep the main
  // query simple: fetch appearance_ids that have any dispute row.
  if (sp.has_dispute === '1') {
    const { data: disp } = await service.from('disputes').select('appearance_id');
    const withDispute = new Set((disp ?? []).map((d) => d.appearance_id));
    rows = rows.filter((r) => withDispute.has(r.id));
  }

  if (sp.q) {
    const q = sp.q.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.case_caption?.toLowerCase().includes(q) ||
        r.court_name?.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
    );
  }

  const statuses: AppearanceStatus[] = ['open', 'claimed', 'in_progress', 'completed', 'disputed', 'cancelled'];
  const paymentStatuses: PaymentStatus[] = ['pending', 'authorized', 'captured', 'released', 'refunded', 'disputed', 'failed'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl tracking-[-0.02em]">Appearances</h1>
        <p className="text-sm text-muted-foreground">{rows.length} shown (most recent 200, newest first).</p>
      </div>
      <AppearancesTable
        rows={rows}
        statuses={statuses}
        paymentStatuses={paymentStatuses}
        current={sp}
      />
    </div>
  );
}
