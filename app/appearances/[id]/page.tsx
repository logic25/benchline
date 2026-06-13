'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AppShell } from '@/components/layout/app-shell';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { STATUS_COLORS } from '@/lib/constants';
import { MapPin, Calendar, Gavel, FileText, Star, CalendarPlus } from 'lucide-react';
import { format } from 'date-fns';
import type { Appearance, Profile, OutcomeReport, Review } from '@/lib/types';
import Link from 'next/link';
import { StructuredReportView } from '@/components/reports/structured-report';
import { MessageThread } from '@/components/appearances/message-thread';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AppearanceDetailPage() {
  const params = useParams();
  const supabase = createClient();
  const [appearance, setAppearance] = useState<Appearance | null>(null);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [poster, setPoster] = useState<Profile | null>(null);
  const [claimer, setClaimer] = useState<Profile | null>(null);
  const [report, setReport] = useState<OutcomeReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [reviewRating, setReviewRating] = useState('5');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setCurrentUser(profileData);

      const { data } = await supabase.from('appearances').select('*').eq('id', params.id).single();
      if (!data) { setLoading(false); return; }
      setAppearance(data);

      const { data: posterData } = await supabase.from('profiles').select('*').eq('id', data.posted_by).single();
      setPoster(posterData);

      if (data.claimed_by) {
        const { data: claimerData } = await supabase.from('profiles').select('*').eq('id', data.claimed_by).single();
        setClaimer(claimerData);
      }

      const { data: reportData } = await supabase.from('outcome_reports').select('*').eq('appearance_id', data.id).maybeSingle();
      setReport(reportData ?? null);

      const { data: rev } = await supabase.from('reviews').select('*').eq('appearance_id', data.id).eq('reviewer_id', user.id).maybeSingle();
      setExistingReview(rev ?? null);

      setLoading(false);
    }
    load();
  }, [params.id, supabase]);

  async function handleClaim() {
    if (!appearance || !currentUser) return;
    setBusyAction('claim');
    setActionError(null);
    try {
      const res = await fetch('/api/appearances/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appearanceId: appearance.id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(typeof json.error === 'string' ? json.error : 'Could not claim');
        return;
      }
      setAppearance({ ...appearance, claimed_by: currentUser.id, status: 'claimed', claimed_at: new Date().toISOString() });
      setClaimer(currentUser);
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCheckIn() {
    if (!appearance) return;
    setBusyAction('checkin');
    setActionError(null);
    try {
      const res = await fetch('/api/appearances/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appearanceId: appearance.id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(typeof json.error === 'string' ? json.error : 'Check-in failed');
        return;
      }
      setAppearance({ ...appearance, status: 'in_progress' });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCancel() {
    if (!appearance) return;
    await supabase.from('appearances').update({ status: 'cancelled' }).eq('id', appearance.id);
    setAppearance({ ...appearance, status: 'cancelled' });
  }

  async function handleConfirmCompletion() {
    if (!appearance) return;
    setBusyAction('confirm');
    setActionError(null);
    try {
      const res = await fetch('/api/stripe/release-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appearanceId: appearance.id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(typeof json.error === 'string' ? json.error : 'Could not complete');
        return;
      }
      setAppearance({ ...appearance, status: 'completed', completed_at: new Date().toISOString() });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!appearance || !currentUser || !claimer) return;
    setReviewSaving(true);
    setActionError(null);
    const { data: newRev, error } = await supabase.from('reviews').insert({
      appearance_id: appearance.id,
      reviewer_id: currentUser.id,
      reviewee_id: claimer.id,
      rating: parseInt(reviewRating, 10),
      comment: reviewComment.trim() || '',
    }).select().single();
    setReviewSaving(false);
    if (error) {
      setActionError(error.message);
      return;
    }
    if (newRev) setExistingReview(newRev);
  }

  if (loading) return <AppShell><div className="text-center py-12 text-muted-foreground">Loading...</div></AppShell>;
  if (!appearance) return <AppShell><div className="text-center py-12 text-muted-foreground">Appearance not found</div></AppShell>;

  const isOwner = currentUser?.id === appearance.posted_by;
  const isClaimer = currentUser?.id === appearance.claimed_by;
  const canClaim = !isOwner && appearance.status === 'open' && (currentUser?.role === 'per_diem' || currentUser?.role === 'both');
  const showReportLink = isClaimer && !report && ['claimed', 'in_progress'].includes(appearance.status);
  const showCheckIn = isClaimer && appearance.status === 'claimed';

  return (
    <AppShell>
      <Header title={appearance.case_caption} />
      {actionError && (
        <div className="max-w-5xl mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Appearance Details</CardTitle>
                <Badge className={STATUS_COLORS[appearance.status] || ''}>{appearance.status.replace('_', ' ')}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{appearance.court_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{appearance.borough.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{format(new Date(appearance.appearance_date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}</p>
                    <p className="text-xs text-muted-foreground">{appearance.appearance_time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Gavel className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium capitalize">{appearance.appearance_type.replace('_', ' ')}</p>
                    <p className="text-xs text-muted-foreground capitalize">{appearance.case_type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{appearance.case_index_number || 'No index number'}</p>
                </div>
              </div>
              {appearance.instructions && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Instructions</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{appearance.instructions}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {report && (
            <Card>
              <CardHeader><CardTitle>Outcome Report</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-muted-foreground">Outcome</p><p className="text-sm font-medium capitalize">{report.outcome}</p></div>
                  {report.next_date && <div><p className="text-xs text-muted-foreground">Next Date</p><p className="text-sm font-medium">{format(new Date(report.next_date + 'T00:00:00'), 'MMM d, yyyy')}</p></div>}
                  {report.judge_name && <div><p className="text-xs text-muted-foreground">Judge</p><p className="text-sm font-medium">{report.judge_name}</p></div>}
                  {report.opposing_counsel && <div><p className="text-xs text-muted-foreground">Opposing Counsel</p><p className="text-sm font-medium">{report.opposing_counsel}</p></div>}
                </div>
                {report.judge_notes && <div><p className="text-xs text-muted-foreground">Judge Notes</p><p className="text-sm whitespace-pre-wrap">{report.judge_notes}</p></div>}
                {report.action_items && <div><p className="text-xs text-muted-foreground">Action Items</p><p className="text-sm whitespace-pre-wrap">{report.action_items}</p></div>}
                {report.red_flags && <div><p className="text-xs text-muted-foreground text-red-600">Red Flags</p><p className="text-sm whitespace-pre-wrap text-red-700">{report.red_flags}</p></div>}
              </CardContent>
            </Card>
          )}
          {report?.ai_structured_report && (
            <StructuredReportView data={report.ai_structured_report as Record<string, unknown>} />
          )}
          {currentUser && appearance.claimed_by && (isOwner || isClaimer) && (
            <MessageThread appearanceId={appearance.id} currentUserId={currentUser.id} />
          )}
          {isOwner && appearance.status === 'completed' && claimer && (
            <Card>
              <CardHeader><CardTitle>Rate coverage</CardTitle></CardHeader>
              <CardContent>
                {existingReview ? (
                  <p className="text-sm text-muted-foreground">
                    You rated this appearance {existingReview.rating}★
                    {existingReview.comment ? ` — “${existingReview.comment}”` : ''}.
                  </p>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Rate {claimer.full_name}</p>
                      <Select value={reviewRating} onValueChange={(v) => v && setReviewRating(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['5', '4', '3', '2', '1'].map((n) => (
                            <SelectItem key={n} value={n}>{n} stars</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea
                      placeholder="Optional feedback"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={3}
                    />
                    <Button type="submit" disabled={reviewSaving}>{reviewSaving ? 'Saving…' : 'Submit review'}</Button>
                  </form>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">${(appearance.pay_rate / 100).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">+${(appearance.platform_fee_cents / 100).toFixed(2)} platform fee{appearance.sales_tax_cents > 0 ? ` + $${(appearance.sales_tax_cents / 100).toFixed(2)} tax` : ''} (total charged ${(((appearance.total_charged_cents ?? appearance.pay_rate + appearance.platform_fee_cents + appearance.sales_tax_cents)) / 100).toFixed(2)})</p>
              {isOwner && !appearance.stripe_payment_intent_id && (
                <p className="text-xs text-amber-700 mt-2">
                  No card payment on file for this post yet. Complete payment from the post flow when Stripe is configured.
                </p>
              )}
            </CardContent>
          </Card>

          {poster && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Posted by</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-medium">{poster.full_name.charAt(0)}</div>
                  <div>
                    <p className="font-medium">{poster.full_name}</p>
                    {poster.rating_count > 0 && <div className="flex items-center gap-1 text-sm text-muted-foreground"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{Number(poster.rating_avg).toFixed(1)} ({poster.rating_count})</div>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {claimer && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Covered by</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center font-medium">{claimer.full_name.charAt(0)}</div>
                  <div>
                    <p className="font-medium">{claimer.full_name}</p>
                    {claimer.rating_count > 0 && <div className="flex items-center gap-1 text-sm text-muted-foreground"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{Number(claimer.rating_avg).toFixed(1)} ({claimer.rating_count})</div>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {canClaim && (
              <Button className="w-full" size="lg" onClick={handleClaim} disabled={busyAction !== null}>
                {busyAction === 'claim' ? 'Claiming...' : 'Claim This Appearance'}
              </Button>
            )}
            {showCheckIn && (
              <Button
                className="w-full"
                variant="secondary"
                size="lg"
                onClick={handleCheckIn}
                disabled={busyAction !== null}
              >
                {busyAction === 'checkin' ? 'Checking in…' : 'Check in at courthouse'}
              </Button>
            )}
            {showReportLink && (
              <Link href={`/report/${appearance.id}`} className="block">
                <Button className="w-full" size="lg">Submit Outcome Report</Button>
              </Link>
            )}
            {isOwner && report && appearance.status !== 'completed' && appearance.status !== 'cancelled' && (
              <Button className="w-full" size="lg" onClick={handleConfirmCompletion} disabled={busyAction !== null}>
                {busyAction === 'confirm' ? 'Completing…' : 'Confirm & release payment'}
              </Button>
            )}
            {isOwner && appearance.status === 'open' && <Button variant="outline" className="w-full" onClick={handleCancel}>Cancel Appearance</Button>}
            {(isOwner || isClaimer) && appearance.status !== 'cancelled' && (
              <a href={`/api/appearances/${appearance.id}/calendar.ics`} className="block">
                <Button variant="outline" className="w-full">
                  <CalendarPlus className="mr-2 h-4 w-4" />Add to calendar
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
