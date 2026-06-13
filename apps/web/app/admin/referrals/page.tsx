import { createServiceClient } from '@/lib/supabase/service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { INSURANCE_PARTNERS } from '@/lib/insurance-partners';
import type { ReferralClick } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminReferralsPage() {
  const service = createServiceClient();
  const { data } = await service
    .from('referral_clicks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300);
  const rows = (data ?? []) as ReferralClick[];

  const byPartner = new Map<string, number>();
  for (const r of rows) byPartner.set(r.partner, (byPartner.get(r.partner) ?? 0) + 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl tracking-[-0.02em]">Insurance Referrals</h1>
        <p className="text-sm text-muted-foreground">{rows.length} clicks (most recent 300).</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {INSURANCE_PARTNERS.map((p) => (
          <Card key={p.slug}>
            <CardHeader className="pb-2">
              <CardDescription>{p.name}</CardDescription>
              <CardTitle className="text-2xl">{byPartner.get(p.slug) ?? 0}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xs text-muted-foreground">
              clicks · conversions tracked via partner portal (TODO)
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Partner</th>
              <th className="px-3 py-2 font-medium">Source</th>
              <th className="px-3 py-2 font-medium">User</th>
              <th className="px-3 py-2 font-medium">Clicked</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">No referral clicks yet.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-t border-border/40 hover:bg-muted/30">
                <td className="px-3 py-2">{r.partner}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.source ?? '—'}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.user_id ? r.user_id.slice(0, 8) : 'anon'}</td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">{r.created_at.slice(0, 16).replace('T', ' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
