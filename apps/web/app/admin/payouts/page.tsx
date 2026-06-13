import { createServiceClient } from '@/lib/supabase/service';
import { Badge } from '@/components/ui/badge';
import type { PayoutStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

type PayoutRow = {
  id: string;
  user_id: string;
  amount_cents: number;
  fee_cents: number;
  stripe_payout_id: string | null;
  status: PayoutStatus;
  created_at: string;
  user?: { full_name: string; email: string } | null;
};

const STATUS_VARIANT: Record<PayoutStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  in_transit: 'default',
  paid: 'outline',
  failed: 'destructive',
  canceled: 'outline',
};

export default async function AdminPayoutsPage() {
  const service = createServiceClient();
  const { data } = await service
    .from('payouts')
    .select('*, user:profiles!payouts_user_id_fkey(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(200);
  const rows = (data ?? []) as PayoutRow[];

  const totalFees = rows.reduce((s, r) => s + (r.fee_cents ?? 0), 0);
  const inFlight = rows.filter((r) => r.status === 'pending' || r.status === 'in_transit').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl tracking-[-0.02em]">Payouts</h1>
        <p className="text-sm text-muted-foreground">
          {rows.length} shown · {inFlight} in flight · instant-payout fees collected ${(totalFees / 100).toFixed(2)}
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">User</th>
              <th className="px-3 py-2 text-right font-medium">Amount</th>
              <th className="px-3 py-2 text-right font-medium">Instant fee</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Stripe payout</th>
              <th className="px-3 py-2 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">No payouts yet.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-t border-border/40 hover:bg-muted/30">
                <td className="px-3 py-2">{r.user?.full_name ?? r.user_id.slice(0, 8)}</td>
                <td className="px-3 py-2 text-right tabular-nums">${(r.amount_cents / 100).toFixed(2)}</td>
                <td className="px-3 py-2 text-right tabular-nums">${(r.fee_cents / 100).toFixed(2)}</td>
                <td className="px-3 py-2"><Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge></td>
                <td className="px-3 py-2 font-mono text-xs">{r.stripe_payout_id ?? '—'}</td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">{r.created_at.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
