'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AppShell } from '@/components/layout/app-shell';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Dispute, Appearance } from '@/lib/types';
import { toast } from 'sonner';

type DisputeRow = Dispute & { appearance?: Appearance };

export default function AdminDisputesPage() {
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [splitAmount, setSplitAmount] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsAdmin(false); return; }
    const { data: me } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!me?.is_admin) { setIsAdmin(false); return; }
    setIsAdmin(true);

    const { data } = await supabase
      .from('disputes')
      .select('*, appearance:appearances!disputes_appearance_id_fkey(id, case_caption, pay_rate, payment_status)')
      .in('status', ['open', 'in_review'])
      .order('created_at', { ascending: true });
    setDisputes((data as DisputeRow[]) || []);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function resolve(d: DisputeRow, decision: 'for_raiser' | 'for_other' | 'split') {
    setBusy(d.id);
    try {
      const payload: Record<string, unknown> = {
        disputeId: d.id,
        decision,
        resolutionNotes: notes[d.id] || undefined,
      };
      if (decision === 'split') {
        const dollars = parseFloat(splitAmount[d.id] || '');
        if (Number.isNaN(dollars) || dollars < 0) {
          toast.error('Enter a valid refund amount for the split');
          setBusy(null);
          return;
        }
        payload.refundAmountCents = Math.round(dollars * 100);
      }
      const res = await fetch('/api/admin/disputes/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Resolution failed');
      toast.success('Dispute resolved');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Resolution failed');
    } finally {
      setBusy(null);
    }
  }

  if (isAdmin === null) return <AppShell><div className="text-center py-12 text-muted-foreground">Loading…</div></AppShell>;
  if (!isAdmin) return <AppShell><div className="text-center py-12 text-muted-foreground">Not authorized.</div></AppShell>;

  return (
    <AppShell>
      <Header title="Dispute Review" description="Resolve open disputes between litigators and per diems" />
      <div className="space-y-4 max-w-3xl">
        {disputes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6">No open disputes.</p>
        ) : disputes.map((d) => (
          <Card key={d.id}>
            <CardHeader>
              <CardTitle className="text-base">{d.appearance?.case_caption ?? 'Appearance'}</CardTitle>
              <CardDescription>
                Pay rate ${((d.appearance?.pay_rate ?? 0) / 100).toFixed(2)} · status {d.status} · opened {d.created_at.slice(0, 10)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Reason</p>
                <p className="text-sm whitespace-pre-wrap">{d.reason}</p>
              </div>
              {d.evidence_urls.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Evidence</p>
                  <ul className="text-xs space-y-1">
                    {d.evidence_urls.map((u) => (
                      <li key={u}><a href={u} target="_blank" rel="noopener noreferrer" className="underline break-all">{u}</a></li>
                    ))}
                  </ul>
                </div>
              )}
              <Textarea
                placeholder="Resolution notes (optional)"
                value={notes[d.id] || ''}
                onChange={(e) => setNotes((n) => ({ ...n, [d.id]: e.target.value }))}
                rows={2}
              />
              <div className="flex flex-wrap items-end gap-2">
                <Button size="sm" disabled={busy === d.id} onClick={() => resolve(d, 'for_raiser')}>
                  Refund raiser
                </Button>
                <Button size="sm" variant="secondary" disabled={busy === d.id} onClick={() => resolve(d, 'for_other')}>
                  Release to per diem
                </Button>
                <div className="flex items-end gap-1">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Split refund $</label>
                    <Input
                      className="w-28"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={splitAmount[d.id] || ''}
                      onChange={(e) => setSplitAmount((s) => ({ ...s, [d.id]: e.target.value }))}
                    />
                  </div>
                  <Button size="sm" variant="outline" disabled={busy === d.id} onClick={() => resolve(d, 'split')}>
                    Split
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
