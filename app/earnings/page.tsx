'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AppShell } from '@/components/layout/app-shell';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import type { Appearance } from '@/lib/types';
import { format } from 'date-fns';

export default function EarningsPage() {
  const [appearances, setAppearances] = useState<Appearance[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('appearances').select('*')
        .eq('claimed_by', user.id).in('status', ['completed', 'in_progress', 'claimed'])
        .order('completed_at', { ascending: false });
      setAppearances(data || []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  const totalEarned = appearances.filter((a) => a.status === 'completed').reduce((sum, a) => sum + a.pay_rate, 0);
  const pendingPayment = appearances.filter((a) => a.status === 'in_progress' || a.status === 'claimed').reduce((sum, a) => sum + a.pay_rate, 0);

  return (
    <AppShell>
      <Header title="Earnings" description="Track your earnings and payment history" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><DollarSign className="h-8 w-8 text-green-600" /><div><p className="text-2xl font-bold">${(totalEarned / 100).toFixed(2)}</p><p className="text-xs text-muted-foreground">Total Earned</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><DollarSign className="h-8 w-8 text-yellow-600" /><div><p className="text-2xl font-bold">${(pendingPayment / 100).toFixed(2)}</p><p className="text-xs text-muted-foreground">Pending Payment</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><DollarSign className="h-8 w-8 text-gray-600" /><div><p className="text-2xl font-bold">{appearances.length}</p><p className="text-xs text-muted-foreground">Total Appearances</p></div></div></CardContent></Card>
      </div>
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
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
      )}
    </AppShell>
  );
}
