import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserActions } from '@/components/admin/user-actions';
import type { Profile } from '@/lib/types';

export const dynamic = 'force-dynamic';

function usd(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = createServiceClient();

  const { data: profile } = await service.from('profiles').select('*').eq('id', id).single();
  if (!profile) notFound();
  const p = profile as Profile;

  const [{ data: posted }, { data: claimed }] = await Promise.all([
    service.from('appearances').select('pay_rate, payment_status').eq('posted_by', id),
    service.from('appearances').select('pay_rate, payment_status').eq('claimed_by', id),
  ]);

  const lifetimeGmv = [...(posted ?? []), ...(claimed ?? [])]
    .filter((a) => a.payment_status === 'captured' || a.payment_status === 'released')
    .reduce((sum, a) => sum + (a.pay_rate ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/admin/users" className="text-xs text-muted-foreground hover:underline">← All users</Link>
          <h1 className="font-heading text-2xl tracking-[-0.02em]">{p.full_name}</h1>
          <p className="text-sm text-muted-foreground">{p.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{p.role.replace('_', ' ')}</Badge>
            {p.is_admin && <Badge>admin</Badge>}
            <Badge variant="outline">bar: {p.bar_verification_status}</Badge>
            <Badge variant="outline">insurance: {p.insurance_status}</Badge>
          </div>
        </div>
        <UserActions userId={p.id} isAdmin={p.is_admin} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Appearances posted" value={String((posted ?? []).length)} />
        <Stat label="Appearances claimed" value={String((claimed ?? []).length)} />
        <Stat label="Lifetime GMV" value={usd(lifetimeGmv)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Field label="Phone verified" value={p.phone_verified ? 'yes' : 'no'} />
            <Field label="Bar number" value={p.bar_number ? `${p.bar_number} (${p.bar_state ?? '—'})` : '—'} />
            <Field label="Firm" value={p.firm_name ?? '—'} />
            <Field label="Stripe Connect" value={p.stripe_account_id ?? '—'} mono />
            <Field label="Stripe customer" value={p.stripe_customer_id ?? '—'} mono />
            <Field label="Onboarding" value={p.onboarding_completed ? 'complete' : `step ${p.onboarding_step}`} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reputation</CardTitle>
            <CardDescription>Aggregated from reviews</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Field label="Average rating" value={p.rating_count > 0 ? p.rating_avg.toFixed(2) : '—'} />
            <Field label="Review count" value={String(p.rating_count)} />
            <Field label="Joined" value={p.created_at.slice(0, 10)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardDescription>{label}</CardDescription><CardTitle className="text-2xl">{value}</CardTitle></CardHeader>
    </Card>
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
