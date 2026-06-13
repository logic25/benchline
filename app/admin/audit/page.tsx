import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { AuditLogEntry } from '@/lib/types';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

type SP = {
  event_type?: string;
  actor?: string;
  appearance_id?: string;
  from?: string;
  to?: string;
  page?: string;
};

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = Math.max(0, parseInt(sp.page ?? '0', 10) || 0);
  const service = createServiceClient();

  let query = service
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

  if (sp.event_type) query = query.eq('event_type', sp.event_type);
  if (sp.actor) query = query.eq('actor_user_id', sp.actor);
  if (sp.appearance_id) query = query.eq('appearance_id', sp.appearance_id);
  if (sp.from) query = query.gte('created_at', sp.from);
  if (sp.to) query = query.lte('created_at', `${sp.to}T23:59:59Z`);

  const { data, count } = await query;
  const rows = (data ?? []) as AuditLogEntry[];
  const total = count ?? 0;
  const maxPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);

  function pageHref(p: number): string {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (v && k !== 'page') next.set(k, v);
    next.set('page', String(p));
    return `/admin/audit?${next.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl tracking-[-0.02em]">Audit Log</h1>
        <p className="text-sm text-muted-foreground">{total} events · page {page + 1} of {maxPage + 1}</p>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-border/60 bg-card/40 p-4" method="get">
        <Field name="event_type" label="Event type" defaultValue={sp.event_type} placeholder="e.g. dispute.resolved" />
        <Field name="actor" label="Actor user id" defaultValue={sp.actor} placeholder="uuid" />
        <Field name="appearance_id" label="Appearance id" defaultValue={sp.appearance_id} placeholder="uuid" />
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">From</label>
          <Input type="date" name="from" defaultValue={sp.from} className="w-40" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">To</label>
          <Input type="date" name="to" defaultValue={sp.to} className="w-40" />
        </div>
        <Button type="submit" size="sm">Filter</Button>
        <Link href="/admin/audit" className="text-sm text-muted-foreground hover:underline">Clear</Link>
      </form>

      <div className="space-y-2">
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No audit events match.</p>
        ) : rows.map((e) => (
          <details key={e.id} className="rounded-lg border border-border/50 px-3 py-2 text-sm">
            <summary className="flex cursor-pointer flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{e.created_at.slice(0, 19).replace('T', ' ')}</span>
              <span className="font-medium">{e.event_type}</span>
              {e.from_status && <span className="text-xs text-muted-foreground">{e.from_status} → {e.to_status}</span>}
              {e.appearance_id && (
                <Link href={`/admin/appearances/${e.appearance_id}`} className="ml-auto font-mono text-xs text-primary hover:underline">
                  {e.appearance_id.slice(0, 8)}
                </Link>
              )}
            </summary>
            <pre className="mt-2 overflow-x-auto rounded bg-muted/60 p-2 text-xs">{JSON.stringify({ actor_user_id: e.actor_user_id, stripe_event_id: e.stripe_event_id, payload: e.payload }, null, 2)}</pre>
          </details>
        ))}
      </div>

      <div className="flex items-center justify-between">
        {page > 0 ? (
          <Link href={pageHref(page - 1)} className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted">← Previous</Link>
        ) : <span className="px-3 py-1.5 text-sm text-muted-foreground opacity-50">← Previous</span>}
        {page < maxPage ? (
          <Link href={pageHref(page + 1)} className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted">Next →</Link>
        ) : <span className="px-3 py-1.5 text-sm text-muted-foreground opacity-50">Next →</span>}
      </div>
    </div>
  );
}

function Field({ name, label, defaultValue, placeholder }: { name: string; label: string; defaultValue?: string; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <Input name={name} defaultValue={defaultValue} placeholder={placeholder} className="w-48" />
    </div>
  );
}
