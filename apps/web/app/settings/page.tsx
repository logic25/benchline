'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AppShell } from '@/components/layout/app-shell';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ConflictDeclaration, Profile, UserRole } from '@/lib/types';
import { PhoneVerificationCard } from '@/components/settings/phone-verification-card';
import { toast } from 'sonner';

function linesToArray(s: string): string[] {
  return s.split(/\n/).map((l) => l.trim()).filter(Boolean);
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('litigator');
  const [barNumber, setBarNumber] = useState('');
  const [bio, setBio] = useState('');
  const [practiceAreas, setPracticeAreas] = useState('');
  const [courtsFamiliar, setCourtsFamiliar] = useState('');
  const [firmName, setFirmName] = useState('');
  const [firmBarNumbers, setFirmBarNumbers] = useState('');
  const [aiConsent, setAiConsent] = useState(true);
  const [declarations, setDeclarations] = useState<ConflictDeclaration[]>([]);
  const [newConflictName, setNewConflictName] = useState('');
  const [newConflictFirm, setNewConflictFirm] = useState('');
  const [newConflictBar, setNewConflictBar] = useState('');
  const [newConflictReason, setNewConflictReason] = useState('');
  const supabase = createClient();

  async function loadDeclarations(userId: string) {
    const { data } = await supabase
      .from('conflict_declarations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setDeclarations((data as ConflictDeclaration[]) || []);
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data);
        setFullName(data.full_name);
        setPhone(data.phone || '');
        setRole(data.role);
        setBarNumber(data.bar_number || '');
        setBio(data.bio || '');
        setPracticeAreas((data.practice_areas || []).join('\n'));
        setCourtsFamiliar((data.courts_familiar || []).join('\n'));
        setFirmName(data.firm_name || '');
        setFirmBarNumbers((data.firm_bar_numbers || []).join('\n'));
        setAiConsent(data.ai_processing_consent ?? true);
        await loadDeclarations(user.id);
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    await supabase.from('profiles').update({
      full_name: fullName,
      phone: phone || null,
      role,
      bar_number: barNumber || null,
      bio: bio || null,
      practice_areas: linesToArray(practiceAreas),
      courts_familiar: linesToArray(courtsFamiliar),
      firm_name: firmName || null,
      firm_bar_numbers: linesToArray(firmBarNumbers),
      ai_processing_consent: aiConsent,
    }).eq('id', profile.id);
    setSaving(false);
    toast.success('Profile saved');
  }

  async function addDeclaration() {
    if (!profile || !newConflictName.trim()) return;
    const { error } = await supabase.from('conflict_declarations').insert({
      user_id: profile.id,
      conflicted_party_name: newConflictName.trim(),
      conflicted_party_firm: newConflictFirm.trim() || null,
      conflicted_party_bar_number: newConflictBar.trim() || null,
      reason: newConflictReason.trim() || null,
    });
    if (error) { toast.error(error.message); return; }
    setNewConflictName(''); setNewConflictFirm(''); setNewConflictBar(''); setNewConflictReason('');
    await loadDeclarations(profile.id);
    toast.success('Conflict added');
  }

  async function removeDeclaration(id: string) {
    if (!profile) return;
    const { error } = await supabase.from('conflict_declarations').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    await loadDeclarations(profile.id);
  }

  async function startStripeConnect() {
    setConnecting(true);
    try {
      const res = await fetch('/api/stripe/connect-onboard', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setConnecting(false);
    }
  }

  const showConnect = profile?.role === 'per_diem' || profile?.role === 'both';

  if (loading) return <AppShell><div className="text-center py-12 text-muted-foreground">Loading...</div></AppShell>;

  return (
    <AppShell>
      <Header title="Settings" description="Manage your profile and preferences" />
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Full Name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={profile?.email || ''} disabled /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-5555" /></div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => v && setRole(v as UserRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="litigator">Litigator</SelectItem>
                  <SelectItem value="per_diem">Per Diem Attorney</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>NY Bar Number</Label><Input value={barNumber} onChange={(e) => setBarNumber(e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Practice areas</Label>
              <Textarea value={practiceAreas} onChange={(e) => setPracticeAreas(e.target.value)} rows={3} placeholder="One per line, e.g. Commercial litigation" />
            </div>
            <div className="space-y-2">
              <Label>Courts familiar</Label>
              <Textarea value={courtsFamiliar} onChange={(e) => setCourtsFamiliar(e.target.value)} rows={3} placeholder="One per line, e.g. Supreme Court - Kings County" />
            </div>
            <div className="space-y-2"><Label>Bio</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Brief description of your practice..." /></div>
            <div className="space-y-2"><Label>Firm Name</Label><Input value={firmName} onChange={(e) => setFirmName(e.target.value)} placeholder="e.g. Smith & Associates" /></div>
            <div className="space-y-2">
              <Label>Firm Bar Numbers</Label>
              <Textarea value={firmBarNumbers} onChange={(e) => setFirmBarNumbers(e.target.value)} rows={2} placeholder="One per line. Used for conflict screening." />
            </div>
          </CardContent>
        </Card>

        <PhoneVerificationCard
          initialPhone={profile?.phone || ''}
          initialVerified={profile?.phone_verified ?? false}
        />

        <Card>
          <CardHeader>
            <CardTitle>AI Report Structuring</CardTitle>
            <CardDescription>
              When enabled, outcome reports may be structured by AI. Identifying details are redacted before processing
              and restored afterward; data is processed under a zero-retention agreement.{' '}
              <a href="/privacy#ai" className="underline">Learn more</a>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={aiConsent} onChange={(e) => setAiConsent(e.target.checked)} className="h-4 w-4" />
              Allow AI-structured reports
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conflicts of Interest</CardTitle>
            <CardDescription>
              Declare parties, firms, or attorneys you cannot appear against. Appearances with matching opposing counsel
              are hidden from your browse results and blocked at claim time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {declarations.length > 0 && (
              <div className="space-y-2">
                {declarations.map((d) => (
                  <div key={d.id} className="flex items-start justify-between rounded-md border p-3 text-sm">
                    <div>
                      <p className="font-medium">{d.conflicted_party_name}</p>
                      <p className="text-muted-foreground text-xs">
                        {[d.conflicted_party_firm, d.conflicted_party_bar_number && `Bar #${d.conflicted_party_bar_number}`, d.reason].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={() => removeDeclaration(d.id)}>Remove</Button>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Party / attorney name</Label><Input value={newConflictName} onChange={(e) => setNewConflictName(e.target.value)} placeholder="Required" /></div>
              <div className="space-y-2"><Label>Firm</Label><Input value={newConflictFirm} onChange={(e) => setNewConflictFirm(e.target.value)} placeholder="Optional" /></div>
              <div className="space-y-2"><Label>Bar number</Label><Input value={newConflictBar} onChange={(e) => setNewConflictBar(e.target.value)} placeholder="Optional" /></div>
              <div className="space-y-2"><Label>Reason</Label><Input value={newConflictReason} onChange={(e) => setNewConflictReason(e.target.value)} placeholder="Optional" /></div>
            </div>
            <Button type="button" variant="outline" onClick={addDeclaration} disabled={!newConflictName.trim()}>Add conflict</Button>
          </CardContent>
        </Card>

        {showConnect && (
          <Card>
            <CardHeader>
              <CardTitle>Payouts</CardTitle>
              <CardDescription>
                Connect a Stripe account so litigators can release earned fees to you (live Stripe + Connect required).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="button" variant="outline" onClick={startStripeConnect} disabled={connecting}>
                {connecting ? 'Redirecting…' : profile?.stripe_account_id ? 'Update Stripe Connect' : 'Connect with Stripe'}
              </Button>
            </CardContent>
          </Card>
        )}

        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
      </div>
    </AppShell>
  );
}
