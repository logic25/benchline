import { createServiceClient } from '@/lib/supabase/service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

function hoursAgo(h: number): string {
  return new Date(new Date().getTime() - h * 60 * 60 * 1000).toISOString();
}

function startOf(period: 'day' | 'week' | 'month'): string {
  const now = new Date();
  if (period === 'day') {
    now.setUTCHours(0, 0, 0, 0);
  } else if (period === 'week') {
    const day = now.getUTCDay();
    const diff = (day + 6) % 7; // Monday as week start
    now.setUTCDate(now.getUTCDate() - diff);
    now.setUTCHours(0, 0, 0, 0);
  } else {
    now.setUTCDate(1);
    now.setUTCHours(0, 0, 0, 0);
  }
  return now.toISOString();
}

function usd(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Sums pay_rate and platform_fee_cents for captured/released appearances created
// since `since`. GMV = gross merchandise value (sum of pay rates that moved).
async function moneyTotals(
  service: ReturnType<typeof createServiceClient>,
  since: string
): Promise<{ gmv: number; fees: number }> {
  const { data } = await service
    .from('appearances')
    .select('pay_rate, platform_fee_cents, payment_status, payment_captured_at')
    .in('payment_status', ['captured', 'released'])
    .gte('payment_captured_at', since);
  let gmv = 0;
  let fees = 0;
  for (const row of data ?? []) {
    gmv += row.pay_rate ?? 0;
    fees += row.platform_fee_cents ?? 0;
  }
  return { gmv, fees };
}

async function countSince(
  service: ReturnType<typeof createServiceClient>,
  eventTypes: string[],
  since: string
): Promise<number> {
  const { count } = await service
    .from('audit_log')
    .select('id', { count: 'exact', head: true })
    .in('event_type', eventTypes)
    .gte('created_at', since);
  return count ?? 0;
}

export default async function AdminOverviewPage() {
  const service = createServiceClient();

  const dayStart = startOf('day');
  const weekStart = startOf('week');
  const monthStart = startOf('month');
  const dayAgo = hoursAgo(24);

  const [
    barPending,
    insurancePending,
    openDisputes,
    litigators,
    perDiems,
    both,
    pendingPayouts,
    money,
    moneyWeek,
    moneyMonth,
    failedPayments,
    failedAi,
  ] = await Promise.all([
    service.from('bar_verification_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    service.from('insurance_uploads').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    service.from('disputes').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_review']),
    service.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'litigator'),
    service.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'per_diem'),
    service.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'both'),
    service.from('payouts').select('id', { count: 'exact', head: true }).in('status', ['pending', 'in_transit']),
    moneyTotals(service, dayStart),
    moneyTotals(service, weekStart),
    moneyTotals(service, monthStart),
    countSince(service, ['stripe.payment_failed', 'payment.failed'], dayAgo),
    countSince(service, ['ai.structure.error', 'ai.structure.validation_failed'], dayAgo),
  ]);

  const stats: { label: string; value: string; hint?: string }[] = [
    { label: 'Pending verifications', value: String((barPending.count ?? 0) + (insurancePending.count ?? 0)), hint: `${barPending.count ?? 0} bar · ${insurancePending.count ?? 0} insurance` },
    { label: 'Open disputes', value: String(openDisputes.count ?? 0) },
    { label: 'Pending payouts', value: String(pendingPayouts.count ?? 0), hint: 'pending or in transit' },
    { label: 'Failed payments (24h)', value: String(failedPayments) },
    { label: 'Failed AI (24h)', value: String(failedAi) },
    { label: 'Active users', value: String((litigators.count ?? 0) + (perDiems.count ?? 0) + (both.count ?? 0)), hint: `${litigators.count ?? 0} litigators · ${perDiems.count ?? 0} per diems · ${both.count ?? 0} both` },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl tracking-[-0.02em]">Admin Overview</h1>
        <p className="text-sm text-muted-foreground">Platform health and money at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-3xl">{s.value}</CardTitle>
            </CardHeader>
            {s.hint && <CardContent className="pt-0 text-xs text-muted-foreground">{s.hint}</CardContent>}
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gross volume (GMV)</CardTitle>
            <CardDescription>Captured + released pay rates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Today" value={usd(money.gmv)} />
            <Row label="This week" value={usd(moneyWeek.gmv)} />
            <Row label="This month" value={usd(moneyMonth.gmv)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform fees collected</CardTitle>
            <CardDescription>Benchline take across the same window</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Today" value={usd(money.fees)} />
            <Row label="This week" value={usd(moneyWeek.fees)} />
            <Row label="This month" value={usd(moneyMonth.fees)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 pb-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
