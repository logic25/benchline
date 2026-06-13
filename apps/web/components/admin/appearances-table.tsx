'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge, PaymentBadge } from '@/components/admin/status-badge';
import type { AppearanceStatus, PaymentStatus } from '@/lib/types';

export interface AdminAppearanceRow {
  id: string;
  status: AppearanceStatus;
  payment_status: PaymentStatus;
  court_name: string;
  borough: string;
  appearance_date: string;
  pay_rate: number;
  created_at: string;
  case_caption: string;
  posted_by: string;
  claimed_by: string | null;
  poster?: { full_name: string } | null;
  claimer?: { full_name: string } | null;
}

export function AppearancesTable({
  rows,
  statuses,
  paymentStatuses,
  current,
}: {
  rows: AdminAppearanceRow[];
  statuses: AppearanceStatus[];
  paymentStatuses: PaymentStatus[];
  current: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/admin/appearances?${next.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border/60 bg-card/40 p-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Search</label>
          <Input
            defaultValue={current.q ?? ''}
            placeholder="caption, court, id"
            className="w-56"
            onKeyDown={(e) => {
              if (e.key === 'Enter') setParam('q', (e.target as HTMLInputElement).value.trim());
            }}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Status</label>
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={current.status ?? ''}
            onChange={(e) => setParam('status', e.target.value)}
          >
            <option value="">All</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Payment</label>
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={current.payment_status ?? ''}
            onChange={(e) => setParam('payment_status', e.target.value)}
          >
            <option value="">All</option>
            {paymentStatuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">From</label>
          <Input type="date" defaultValue={current.from ?? ''} className="w-40" onChange={(e) => setParam('from', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">To</label>
          <Input type="date" defaultValue={current.to ?? ''} className="w-40" onChange={(e) => setParam('to', e.target.value)} />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={current.has_dispute === '1'}
            onChange={(e) => setParam('has_dispute', e.target.checked ? '1' : '')}
          />
          Has dispute
        </label>
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/appearances')}>
          Clear
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">ID</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Payment</th>
              <th className="px-3 py-2 font-medium">Poster</th>
              <th className="px-3 py-2 font-medium">Claimer</th>
              <th className="px-3 py-2 font-medium">Court</th>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 text-right font-medium">Fee</th>
              <th className="px-3 py-2 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">No appearances match.</td>
              </tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-t border-border/40 hover:bg-muted/30">
                <td className="px-3 py-2 font-mono text-xs">
                  <Link href={`/admin/appearances/${r.id}`} className="text-primary hover:underline">
                    {r.id.slice(0, 8)}
                  </Link>
                </td>
                <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
                <td className="px-3 py-2"><PaymentBadge status={r.payment_status} /></td>
                <td className="px-3 py-2">{r.poster?.full_name ?? '—'}</td>
                <td className="px-3 py-2">{r.claimer?.full_name ?? '—'}</td>
                <td className="px-3 py-2">{r.court_name}</td>
                <td className="px-3 py-2 whitespace-nowrap">{r.appearance_date}</td>
                <td className="px-3 py-2 text-right tabular-nums">${(r.pay_rate / 100).toFixed(2)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">{r.created_at.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
