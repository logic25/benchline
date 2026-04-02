'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BOROUGHS, CASE_TYPES, APPEARANCE_TYPES, NYC_COURTS, PAY_RATE_SUGGESTIONS, PLATFORM_FEE_RATE } from '@/lib/constants';
import { AppearancePay } from '@/components/payment/appearance-pay';

export function PostForm() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [borough, setBorough] = useState('');
  const [courtName, setCourtName] = useState('');
  const [appearanceDate, setAppearanceDate] = useState('');
  const [appearanceTime, setAppearanceTime] = useState('');
  const [caseType, setCaseType] = useState('');
  const [caseCaption, setCaseCaption] = useState('');
  const [caseIndexNumber, setCaseIndexNumber] = useState('');
  const [appearanceType, setAppearanceType] = useState('');
  const [instructions, setInstructions] = useState('');
  const [payRate, setPayRate] = useState('');
  const [postedAppearanceId, setPostedAppearanceId] = useState<string | null>(null);

  const filteredCourts = NYC_COURTS.filter((c) => c.borough === borough);
  const suggestion = PAY_RATE_SUGGESTIONS.find((s) => s.type === appearanceType);
  const payRateCents = Math.round(parseFloat(payRate || '0') * 100);
  const platformFee = Math.round(payRateCents * PLATFORM_FEE_RATE);
  const totalCharge = payRateCents + platformFee;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const selectedCourt = NYC_COURTS.find((c) => c.value === courtName);

      const { data, error: insertError } = await supabase
        .from('appearances')
        .insert({
          posted_by: user.id,
          court_name: selectedCourt?.label || courtName,
          borough,
          appearance_date: appearanceDate,
          appearance_time: appearanceTime,
          case_type: caseType,
          case_caption: caseCaption,
          case_index_number: caseIndexNumber,
          appearance_type: appearanceType,
          instructions,
          pay_rate: payRateCents,
          platform_fee: platformFee,
          status: 'open',
        })
        .select()
        .single();

      if (insertError) throw insertError;
      setPostedAppearanceId(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (postedAppearanceId) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Pay & confirm</CardTitle>
            <CardDescription>
              Total due: <strong>${(totalCharge / 100).toFixed(2)}</strong> (includes platform fee). You can skip in development if
              Stripe is not configured.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AppearancePay appearanceId={postedAppearanceId} onComplete={() => router.push(`/appearances/${postedAppearanceId}`)} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">{error}</div>}

      <Card>
        <CardHeader><CardTitle>Court Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Borough</Label>
              <Select value={borough} onValueChange={(v) => v && setBorough(v)}>
                <SelectTrigger><SelectValue placeholder="Select borough" /></SelectTrigger>
                <SelectContent>{BOROUGHS.map((b) => (<SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Court</Label>
              <Select value={courtName} onValueChange={(v) => v && setCourtName(v)} disabled={!borough}>
                <SelectTrigger><SelectValue placeholder="Select court" /></SelectTrigger>
                <SelectContent>{filteredCourts.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={appearanceDate} onChange={(e) => setAppearanceDate(e.target.value)} required min={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input type="time" value={appearanceTime} onChange={(e) => setAppearanceTime(e.target.value)} required />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Case Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Case Type</Label>
              <Select value={caseType} onValueChange={(v) => v && setCaseType(v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{CASE_TYPES.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Appearance Type</Label>
              <Select value={appearanceType} onValueChange={(v) => v && setAppearanceType(v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{APPEARANCE_TYPES.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Case Caption</Label>
            <Input placeholder="e.g. Smith v. Jones" value={caseCaption} onChange={(e) => setCaseCaption(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Index/Docket Number</Label>
            <Input placeholder="e.g. 123456/2024" value={caseIndexNumber} onChange={(e) => setCaseIndexNumber(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Instructions for Per Diem</Label>
            <Textarea placeholder="What does the per diem attorney need to know? What should they do/say?" value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={5} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Pay Rate ($)</Label>
            <Input type="number" step="0.01" min="50" placeholder="e.g. 200.00" value={payRate} onChange={(e) => setPayRate(e.target.value)} required />
            {suggestion && (
              <p className="text-xs text-muted-foreground">
                Suggested range for {appearanceType.replace('_', ' ')}: ${(suggestion.min / 100).toFixed(0)} - ${(suggestion.max / 100).toFixed(0)}
              </p>
            )}
          </div>
          {payRate && (
            <div className="bg-gray-50 p-4 rounded-md space-y-2 text-sm">
              <div className="flex justify-between"><span>Per diem receives</span><span className="font-medium">${(payRateCents / 100).toFixed(2)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Platform fee (15%)</span><span>${(platformFee / 100).toFixed(2)}</span></div>
              <div className="border-t pt-2 flex justify-between font-semibold"><span>Total charge</span><span>${(totalCharge / 100).toFixed(2)}</span></div>
            </div>
          )}
        </CardContent>
      </Card>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? 'Posting...' : 'Post Appearance'}
      </Button>
    </form>
  );
}
