'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AppShell } from '@/components/layout/app-shell';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { BarVerificationRequest, InsuranceUpload } from '@/lib/types';
import { toast } from 'sonner';

export default function AdminVerificationsPage() {
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [barRequests, setBarRequests] = useState<BarVerificationRequest[]>([]);
  const [insRequests, setInsRequests] = useState<InsuranceUpload[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsAdmin(false); return; }
    const { data: me } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!me?.is_admin) { setIsAdmin(false); return; }
    setIsAdmin(true);

    const { data: bars } = await supabase
      .from('bar_verification_requests')
      .select('*, user:profiles!bar_verification_requests_user_id_fkey(id, full_name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    setBarRequests((bars as BarVerificationRequest[]) || []);

    const { data: ins } = await supabase
      .from('insurance_uploads')
      .select('*, user:profiles!insurance_uploads_user_id_fkey(id, full_name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    setInsRequests((ins as InsuranceUpload[]) || []);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function review(kind: 'bar' | 'insurance', requestId: string, decision: 'approve' | 'reject') {
    setBusy(requestId);
    try {
      const res = await fetch('/api/admin/verification/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, requestId, decision, reviewNotes: notes[requestId] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Review failed');
      toast.success(decision === 'approve' ? 'Approved' : 'Rejected');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Review failed');
    } finally {
      setBusy(null);
    }
  }

  if (isAdmin === null) return <AppShell><div className="text-center py-12 text-muted-foreground">Loading…</div></AppShell>;
  if (!isAdmin) return <AppShell><div className="text-center py-12 text-muted-foreground">Not authorized.</div></AppShell>;

  return (
    <AppShell>
      <Header title="Verification Review" description="Approve or reject bar and insurance submissions" />
      <Tabs defaultValue="bar" className="max-w-3xl">
        <TabsList>
          <TabsTrigger value="bar">Bar ({barRequests.length})</TabsTrigger>
          <TabsTrigger value="insurance">Insurance ({insRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="bar" className="space-y-4">
          {barRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">No pending bar requests.</p>
          ) : barRequests.map((r) => (
            <Card key={r.id}>
              <CardHeader>
                <CardTitle className="text-base">{r.full_name_legal}</CardTitle>
                <CardDescription>
                  {r.user?.email} · Bar #{r.bar_number} ({r.bar_state}) · submitted {r.created_at.slice(0, 10)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {r.evidence_url && <p className="text-xs text-muted-foreground break-all">Evidence: {r.evidence_url}</p>}
                <Input placeholder="Review notes (optional)" value={notes[r.id] || ''} onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))} />
                <div className="flex gap-2">
                  <Button size="sm" disabled={busy === r.id} onClick={() => review('bar', r.id, 'approve')}>Approve</Button>
                  <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => review('bar', r.id, 'reject')}>Reject</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="insurance" className="space-y-4">
          {insRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">No pending insurance requests.</p>
          ) : insRequests.map((r) => (
            <Card key={r.id}>
              <CardHeader>
                <CardTitle className="text-base">{r.user?.full_name}</CardTitle>
                <CardDescription>
                  {r.user?.email} · {r.carrier} · Policy {r.policy_number} · ${((r.coverage_amount_cents ?? 0) / 100).toLocaleString()} · expires {r.expires_date}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {r.document_url && <p className="text-xs text-muted-foreground break-all">Document: {r.document_url}</p>}
                <Input placeholder="Review notes (optional)" value={notes[r.id] || ''} onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))} />
                <div className="flex gap-2">
                  <Button size="sm" disabled={busy === r.id} onClick={() => review('insurance', r.id, 'approve')}>Approve</Button>
                  <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => review('insurance', r.id, 'reject')}>Reject</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
