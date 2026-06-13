'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OUTCOME_TYPES } from '@/lib/constants';

interface ReportFormProps {
  appearanceId: string;
}

export function ReportForm({ appearanceId }: ReportFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [judgeName, setJudgeName] = useState('');
  const [judgeNotes, setJudgeNotes] = useState('');
  const [opposingCounsel, setOpposingCounsel] = useState('');
  const [actionItems, setActionItems] = useState('');
  const [redFlags, setRedFlags] = useState('');
  const [rawNotes, setRawNotes] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: reportError } = await supabase.from('outcome_reports').insert({
        appearance_id: appearanceId,
        submitted_by: user.id,
        outcome,
        next_date: nextDate || null,
        judge_name: judgeName,
        judge_notes: judgeNotes,
        opposing_counsel: opposingCounsel,
        action_items: actionItems,
        red_flags: redFlags,
        raw_notes: rawNotes,
      });

      if (reportError) throw reportError;

      const { data: appRow } = await supabase.from('appearances').select('posted_by, case_caption').eq('id', appearanceId).single();

      await supabase.from('appearances').update({ status: 'in_progress' }).eq('id', appearanceId);

      if (appRow?.posted_by) {
        const { error: nErr } = await supabase.from('notifications').insert({
          user_id: appRow.posted_by,
          type: 'report_submitted',
          title: 'Outcome report submitted',
          body: `A report was submitted for ${appRow.case_caption}.`,
          metadata: { appearance_id: appearanceId },
        });
        if (nErr) console.error(nErr);
      }

      try {
        // The route redacts, calls Bedrock, re-stitches, and stores the
        // structured report + redaction dictionary server-side under the
        // service role. We only trigger it here.
        await fetch('/api/reports/structure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appearanceId, rawNotes, context: { judgeName, outcome, actionItems, judgeNotes } }),
        });
      } catch {
        // AI structuring is non-critical
      }

      router.push(`/appearances/${appearanceId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">{error}</div>}

      <Card>
        <CardHeader><CardTitle>Outcome</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Result</Label>
              <Select value={outcome} onValueChange={(v) => v && setOutcome(v)}>
                <SelectTrigger><SelectValue placeholder="Select outcome" /></SelectTrigger>
                <SelectContent>{OUTCOME_TYPES.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Next Court Date</Label>
              <Input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Court Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Judge Name</Label>
              <Input placeholder="Hon. Jane Smith" value={judgeName} onChange={(e) => setJudgeName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Opposing Counsel</Label>
              <Input placeholder="Name and firm" value={opposingCounsel} onChange={(e) => setOpposingCounsel(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Judge Notes/Comments</Label>
            <Textarea placeholder="Anything the judge said on the record..." value={judgeNotes} onChange={(e) => setJudgeNotes(e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Follow-Up</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Action Items</Label>
            <Textarea placeholder="What does the posting attorney need to do next?" value={actionItems} onChange={(e) => setActionItems(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Red Flags or Concerns</Label>
            <Textarea placeholder="Anything unexpected or concerning..." value={redFlags} onChange={(e) => setRedFlags(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea placeholder="Any other details..." value={rawNotes} onChange={(e) => setRawNotes(e.target.value)} rows={4} />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" size="lg" className="w-full" disabled={loading || !outcome}>
        {loading ? 'Submitting...' : 'Submit Outcome Report'}
      </Button>
    </form>
  );
}
