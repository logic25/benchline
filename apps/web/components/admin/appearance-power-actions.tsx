'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { AppearanceStatus, PaymentStatus } from '@/lib/types';
import { toast } from 'sonner';

type ActionKind = 'force_release' | 'force_refund' | 'force_cancel' | 'mark_resolved';

const ACTION_LABEL: Record<ActionKind, string> = {
  force_release: 'Force release payment',
  force_refund: 'Force refund',
  force_cancel: 'Force cancel',
  mark_resolved: 'Mark dispute resolved',
};

const ACTION_DESC: Record<ActionKind, string> = {
  force_release: 'Captures (if needed) and transfers the full pay rate to the per diem. Use only when a stuck appearance should pay out.',
  force_refund: 'Voids an uncaptured authorization, or refunds a captured charge in full to the litigator.',
  force_cancel: 'Cancels the appearance without moving money. Will not refund — use force refund for that.',
  mark_resolved: 'Closes an open dispute administratively without moving money (records the note only).',
};

export function AppearancePowerActions({
  appearanceId,
  status,
  paymentStatus,
}: {
  appearanceId: string;
  status: AppearanceStatus;
  paymentStatus: PaymentStatus;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<ActionKind | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(action: ActionKind) {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/appearances/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appearanceId, action, notes: notes || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Action failed');
      toast.success('Action applied');
      setOpen(null);
      setNotes('');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  const canRelease = ['authorized', 'captured', 'pending'].includes(paymentStatus) && status !== 'cancelled';
  const canRefund = ['authorized', 'captured', 'released', 'disputed'].includes(paymentStatus);
  const canCancel = status !== 'cancelled' && status !== 'completed';
  const canResolve = status === 'disputed';

  const buttons: { kind: ActionKind; show: boolean; variant: 'default' | 'outline' | 'destructive' }[] = [
    { kind: 'force_release', show: canRelease, variant: 'default' },
    { kind: 'force_refund', show: canRefund, variant: 'outline' },
    { kind: 'mark_resolved', show: canResolve, variant: 'outline' },
    { kind: 'force_cancel', show: canCancel, variant: 'destructive' },
  ];

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {buttons.filter((b) => b.show).map((b) => (
        <Button key={b.kind} size="sm" variant={b.variant} onClick={() => { setNotes(''); setOpen(b.kind); }}>
          {ACTION_LABEL[b.kind]}
        </Button>
      ))}

      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{open ? ACTION_LABEL[open] : ''}</DialogTitle>
            <DialogDescription>{open ? ACTION_DESC[open] : ''}</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason / note (recorded in the audit log)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(null)} disabled={busy}>Cancel</Button>
            <Button
              variant={open === 'force_cancel' ? 'destructive' : 'default'}
              disabled={busy}
              onClick={() => open && run(open)}
            >
              {busy ? 'Working…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
