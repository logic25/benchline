'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AppShell } from '@/components/layout/app-shell';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Zap } from 'lucide-react';
import type { Appearance, Payout } from '@/lib/types';
import { format } from 'date-fns';

export default function EarningsPage() {
  const [appearances, setAppearances] = useState<Appearance[]>([]);
  const [availableCents, setAvailableCents] = useState(0);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingOut, setPayingOut] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const supabase = createClient();

  const loadPayouts = useCallback(async () => {
    const res = await fetch('/api/stripe/instant-payout');
    if (!res.ok) return;
    const data = await res.json();
    setAvailableCents(data.availableCents ?? 0);
    setPayouts(data.payouts ?? []);
  }, []);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('appearances').select('*')
        .eq('claimed_by', user.id).in('status', ['completed', 'in_progress', 'claimed'])
        .order('completed_at', { ascending: false });
      setAppearances(data || []);
      await loadPayouts();
      setLoading(false);
    }
    load();
  }, [supabase, loadPayouts]);

  const totalEarned = appearances.filter((a) => a.status === 'completed').reduce((sum, a) => sum + a.pay_rate, 0);
  const pendingPayment = appearances.filter((a) => a.status === 'in_progress' || a.status === 'claimed').reduce((sum, a) => sum + a.pay_rate, 0);

  // Instant payout fee mirrors the server (1.5%, $0.50 min).
  const feeCents = Math.max(Math.round(availableCents * 0.015), 50);

  async function handleInstantPayout() {
    setPayingOut(true);
    setPayoutError(null);
    try {
      const res = await fetch('/api/stripe/instant-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPayoutError(typeof data.error === 'string' ? data.error : 'Payout failed');
        return;
      }
      await loadPayouts();
    } finally {
      setPayingOut(false);
    }
  }

  return (
    <AppShell>
      <Header title="Earnings" description="Track your earnings and payment history" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><DollarSign className="h-8 w-8 text-green-600" /><div><p className="text-2xl font-bold">${(totalEarned / 100).toFixed(2)}</p><p className="text-xs text-muted-foreground">Total Earned</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><DollarSign className="h-8 w-8 text-yellow-600" /><div><p className="text-2xl font-bold">${(pendingPayment / 100).toFixed(2)}</p><p className="text-xs text-muted-foreground">Pending Payment</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><DollarSign className="h-8 w-8 text-gray-600" /><div><p className="text-2xl font-bold">{appearances.length}</p><p className="text-xs text-muted-foreground">Total Appearances</p></div></div></CardContent></Card>
      </div>

      <Card className="mb-8">
        <CardHeader><CardTitle>Available to withdraw</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-3xl font-bold text-green-700">${(availableCents / 100).toFixed(2)}</p>
              {availableCents > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Instant payout fee (1.5%): ${(feeCents / 100).toFixed(2)} — you receive ${((availableCents - feeCents) / 100).toFixed(2)}
                </p>
              )}
            </div>
            <Button onClick={handleInstantPayout} disabled={payingOut || availableCents <= 0}>
              <Zap className="h-4 w-4 mr-2" />
              {payingOut ? 'Processing…' : 'Instant payout (1.5% fee)'}
            </Button>
          </div>
          {payoutError && <p className="text-sm text-destructive mt-3">{payoutError}</p>}
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <>
          <Card className="mb-8">
            <CardHeader><CardTitle>Payout History</CardTitle></CardHeader>
            <CardContent>
              {payouts.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No payouts yet</p>
              ) : (
                <div className="space-y-3">
                  {payouts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div>
                        <p className="font-medium">${(p.amount_cents / 100).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Fee ${(p.fee_cents / 100).toFixed(2)} · {format(new Date(p.created_at), 'MMM d, yyyy')}</p>
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">{p.status.replace('_', ' ')}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
            <CardContent>
              {appearances.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No earnings yet</p>
              ) : (
                <div className="space-y-3">
                  {appearances.map((a) => (
                    <div key={a.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div>
                        <p className="font-medium">{a.case_caption}</p>
                        <p className="text-sm text-muted-foreground">{a.court_name}</p>
                        <p className="text-xs text-muted-foreground">{a.completed_at ? format(new Date(a.completed_at), 'MMM d, yyyy') : 'Pending'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-700">${(a.pay_rate / 100).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground capitalize">{a.status.replace('_', ' ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </AppShell>
  );
}
