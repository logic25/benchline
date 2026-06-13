import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge, PaymentBadge } from '@/components/admin/status-badge';
import { AppearancePowerActions } from '@/components/admin/appearance-power-actions';
import type { Appearance, AuditLogEntry, Dispute } from '@/lib/types';

export const dynamic = 'force-dynamic';

function money(cents: number | null | undefined): string {
  return `$${((cents ?? 0) / 100).toFixed(2)}`;
}

export default async function AdminAppearanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = createServiceClient();

  const { data: appearance } = await service
    .from('appearances')
    .select('*, poster:profiles!appearances_posted_by_fkey(id, full_name, email), claimer:profiles!appearances_claimed_by_fkey(id, full_name, email)')
    .eq('id', id)
    .single();

  if (!appearance) notFound();
  const a = appearance as Appearance & {
    poster?: { id: string; full_name: string; email: string };
    claimer?: { id: string; full_name: string; email: string };
  };

  const [{ data: audit }, { data: disputes }] = await Promise.all([
    service.from('audit_log').select('*').eq('appearance_id', id).order('created_at', { ascending: true }),
    service.from('disputes').select('*').eq('appearance_id', id).order('created_at', { ascending: false }),
  ]);

  const auditRows = (audit ?? []) as AuditLogEntry[];
  const disputeRows = (disputes ?? []) as Dispute[];

  const timeline: { label: string; at: string | null }[] = [
    { label: 'Authorized', at: a.payment_authorized_at },
    { label: 'Captured', at: a.payment_captured_at },
    { label: 'Released', at: a.payment_released_at },
    { label: 'Auto-release at', at: a.auto_release_at },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/admin/appearances" className="text-xs text-muted-foreground hover:underline">← All appearances</Link>
          <h1 className="font-heading text-2xl tracking-[-0.02em]">{a.case_caption}</h1>
          <p className="font-mono text-xs text-muted-foreground">{a.id}</p>
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status={a.status} />
            <PaymentBadge status={a.payment_status} />
          </div>
        </div>
        <AppearancePowerActions
          appearanceId={a.id}
          status={a.status}
          paymentStatus={a.payment_status}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Case & court</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Field label="Court" value={`${a.court_name} (${a.borough})`} />
            <Field label="Index #" value={a.case_index_number} />
            <Field label="Type" value={`${a.case_type} · ${a.appearance_type}`} />
            <Field label="Date" value={`${a.appearance_date} ${a.appearance_time}`} />
            <Field label="Pay rate" value={money(a.pay_rate)} />
            <Field label="Platform fee" value={money(a.platform_fee_cents)} />
            <Field label="Total charged" value={money(a.total_charged_cents)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Parties</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Field label="Posted by" value={a.poster ? `${a.poster.full_name} · ${a.poster.email}` : a.posted_by} />
            <Field label="Claimed by" value={a.claimer ? `${a.claimer.full_name} · ${a.claimer.email}` : (a.claimed_by ?? '—')} />
            <Field label="Stripe PI" value={a.stripe_payment_intent_id ?? '—'} mono />
            <Field label="Stripe transfer" value={a.stripe_transfer_id ?? '—'} mono />
            <Field label="Stripe refund" value={a.stripe_refund_id ?? '—'} mono />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Payment timeline</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          {timeline.map((t) => (
            <Field key={t.label} label={t.label} value={t.at ? new Date(t.at).toLocaleString() : '—'} />
          ))}
        </CardContent>
      </Card>

      {disputeRows.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Dispute history</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {disputeRows.map((d) => (
              <div key={d.id} className="rounded-lg border border-border/50 p-3">
                <p className="text-xs text-muted-foreground">{d.created_at.slice(0, 16).replace('T', ' ')} · status <span className="font-medium">{d.status}</span></p>
                <p className="mt-1 whitespace-pre-wrap">{d.reason}</p>
                {d.resolution_notes && <p className="mt-1 text-xs text-muted-foreground">Resolution: {d.resolution_notes}</p>}
                {d.refund_amount_cents != null && <p className="text-xs text-muted-foreground">Split refund: {money(d.refund_amount_cents)}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit log</CardTitle>
          <CardDescription>{auditRows.length} events</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {auditRows.length === 0 ? (
            <p className="text-muted-foreground">No audit events.</p>
          ) : auditRows.map((e) => (
            <details key={e.id} className="rounded-lg border border-border/50 px-3 py-2">
              <summary className="cursor-pointer text-sm">
                <span className="font-mono text-xs text-muted-foreground">{e.created_at.slice(0, 19).replace('T', ' ')}</span>
                {'  '}<span className="font-medium">{e.event_type}</span>
                {e.from_status && <span className="text-muted-foreground"> · {e.from_status} → {e.to_status}</span>}
              </summary>
              <pre className="mt-2 overflow-x-auto rounded bg-muted/60 p-2 text-xs">{JSON.stringify(e.payload, null, 2)}</pre>
            </details>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/40 py-1 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? 'text-right font-mono text-xs break-all' : 'text-right'}>{value}</span>
    </div>
  );
}
