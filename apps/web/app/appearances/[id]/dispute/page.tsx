'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AppShell } from '@/components/layout/app-shell';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import type { Appearance } from '@/lib/types';

export default function RaiseDisputePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [appearance, setAppearance] = useState<Appearance | null>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('appearances').select('*').eq('id', params.id).single();
      setAppearance(data ?? null);
      setLoading(false);
    }
    load();
  }, [params.id, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!appearance) return;
    setSubmitting(true);
    setError(null);
    const evidenceUrls = evidence
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const res = await fetch('/api/disputes/raise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appearanceId: appearance.id, reason: reason.trim(), evidenceUrls }),
    });
    const json = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setError(typeof json.error === 'string' ? json.error : 'Could not raise dispute');
      return;
    }
    router.push(`/appearances/${appearance.id}`);
  }

  if (loading) return <AppShell><div className="text-center py-12 text-muted-foreground">Loading…</div></AppShell>;
  if (!appearance) return <AppShell><div className="text-center py-12 text-muted-foreground">Appearance not found</div></AppShell>;

  return (
    <AppShell>
      <Header title="Raise a dispute" description={appearance.case_caption} />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Open a formal dispute</CardTitle>
          <CardDescription>
            Describe what went wrong. An admin will review the dispute and decide the outcome, which may
            include a refund or release of payment. Completed appearances can only be disputed within 7 days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">What happened?</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain the issue in detail (minimum 10 characters)…"
                rows={6}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Evidence links (optional)</label>
              <Input
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder="One URL per line"
              />
              <p className="text-xs text-muted-foreground">Paste links to supporting documents, one per line.</p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting || reason.trim().length < 10}>
                {submitting ? 'Submitting…' : 'Submit dispute'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
