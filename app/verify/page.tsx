'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AppShell } from '@/components/layout/app-shell';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { BarVerificationStatus, InsuranceStatus, Profile } from '@/lib/types';
import { toast } from 'sonner';

const BAR_STATUS_LABEL: Record<BarVerificationStatus, string> = {
  unverified: 'Not submitted',
  pending: 'Pending review',
  verified: 'Verified',
  rejected: 'Rejected',
  expired: 'Expired',
};

const INSURANCE_STATUS_LABEL: Record<InsuranceStatus, string> = {
  none: 'Not submitted',
  pending: 'Pending review',
  verified: 'Verified',
  expired: 'Expired',
};

function statusVariant(s: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (s === 'verified') return 'default';
  if (s === 'pending') return 'secondary';
  if (s === 'rejected' || s === 'expired') return 'destructive';
  return 'outline';
}

export default function VerifyPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Bar form
  const [barNumber, setBarNumber] = useState('');
  const [barState, setBarState] = useState('NY');
  const [fullNameLegal, setFullNameLegal] = useState('');
  const [barFile, setBarFile] = useState<File | null>(null);
  const [barSubmitting, setBarSubmitting] = useState(false);

  // Insurance form
  const [carrier, setCarrier] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [coverage, setCoverage] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [expiresDate, setExpiresDate] = useState('');
  const [insFile, setInsFile] = useState<File | null>(null);
  const [insSubmitting, setInsSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data);
        setFullNameLegal(data.full_name || '');
        setBarNumber(data.bar_number || '');
        setBarState(data.bar_state || 'NY');
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function uploadDoc(bucket: string, file: File): Promise<string | undefined> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const ext = file.name.split('.').pop() || 'bin';
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
    if (error) throw error;
    return path;
  }

  async function submitBar(e: React.FormEvent) {
    e.preventDefault();
    setBarSubmitting(true);
    try {
      let evidenceUrl: string | undefined;
      if (barFile) evidenceUrl = await uploadDoc('verification-docs', barFile);
      const res = await fetch('/api/verification/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barNumber, barState, fullNameLegal, evidenceUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      toast.success('Bar verification submitted for review');
      setProfile((p) => (p ? { ...p, bar_verification_status: 'pending' } : p));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setBarSubmitting(false);
    }
  }

  async function submitInsurance(e: React.FormEvent) {
    e.preventDefault();
    setInsSubmitting(true);
    try {
      let documentUrl: string | undefined;
      if (insFile) documentUrl = await uploadDoc('insurance-docs', insFile);
      const coverageAmountCents = Math.round(parseFloat(coverage || '0') * 100);
      const res = await fetch('/api/verification/insurance/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentUrl, carrier, policyNumber, coverageAmountCents, effectiveDate, expiresDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      toast.success('Insurance submitted for review');
      setProfile((p) => (p ? { ...p, insurance_status: 'pending' } : p));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setInsSubmitting(false);
    }
  }

  if (loading) return <AppShell><div className="text-center py-12 text-muted-foreground">Loading...</div></AppShell>;

  const barStatus = profile?.bar_verification_status ?? 'unverified';
  const insStatus = profile?.insurance_status ?? 'none';

  return (
    <AppShell>
      <Header title="Verification" description="Verify your bar admission and malpractice insurance to post and claim appearances" />
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Bar admission</CardTitle>
              <Badge variant={statusVariant(barStatus)}>{BAR_STATUS_LABEL[barStatus]}</Badge>
            </div>
            <CardDescription>
              Required to post appearances (litigators) and to claim them (per diem attorneys). An admin reviews each
              submission.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {barStatus === 'verified' ? (
              <p className="text-sm text-muted-foreground">Your bar admission is verified.</p>
            ) : (
              <form onSubmit={submitBar} className="space-y-4">
                <div className="space-y-2"><Label>Legal name (as registered)</Label><Input value={fullNameLegal} onChange={(e) => setFullNameLegal(e.target.value)} required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Bar number</Label><Input value={barNumber} onChange={(e) => setBarNumber(e.target.value)} required /></div>
                  <div className="space-y-2"><Label>Bar state</Label><Input value={barState} onChange={(e) => setBarState(e.target.value.toUpperCase().slice(0, 2))} maxLength={2} required /></div>
                </div>
                <div className="space-y-2">
                  <Label>Evidence (registration card / OCA printout)</Label>
                  <Input type="file" accept="image/*,application/pdf" onChange={(e) => setBarFile(e.target.files?.[0] ?? null)} />
                </div>
                <Button type="submit" disabled={barSubmitting}>{barSubmitting ? 'Submitting…' : 'Submit for verification'}</Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Malpractice insurance</CardTitle>
              <Badge variant={statusVariant(insStatus)}>{INSURANCE_STATUS_LABEL[insStatus]}</Badge>
            </div>
            <CardDescription>Per diem attorneys must have verified insurance on file to claim appearances.</CardDescription>
          </CardHeader>
          <CardContent>
            {insStatus === 'verified' ? (
              <p className="text-sm text-muted-foreground">
                Your insurance is verified{profile?.insurance_expires_at ? ` (expires ${profile.insurance_expires_at.slice(0, 10)})` : ''}.
              </p>
            ) : (
              <form onSubmit={submitInsurance} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Carrier</Label><Input value={carrier} onChange={(e) => setCarrier(e.target.value)} required /></div>
                  <div className="space-y-2"><Label>Policy number</Label><Input value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} required /></div>
                </div>
                <div className="space-y-2"><Label>Coverage amount ($)</Label><Input type="number" step="0.01" min="0" value={coverage} onChange={(e) => setCoverage(e.target.value)} required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Effective date</Label><Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} required /></div>
                  <div className="space-y-2"><Label>Expires date</Label><Input type="date" value={expiresDate} onChange={(e) => setExpiresDate(e.target.value)} required /></div>
                </div>
                <div className="space-y-2">
                  <Label>Policy document</Label>
                  <Input type="file" accept="image/*,application/pdf" onChange={(e) => setInsFile(e.target.files?.[0] ?? null)} />
                </div>
                <Button type="submit" disabled={insSubmitting}>{insSubmitting ? 'Submitting…' : 'Submit for verification'}</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
