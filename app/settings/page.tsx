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
import type { Profile, UserRole } from '@/lib/types';

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
  const supabase = createClient();

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
    }).eq('id', profile.id);
    setSaving(false);
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
