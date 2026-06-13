'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

type UserAction = 'toggle_suspend' | 'toggle_admin' | 'resend_verification';

export function UserActions({ userId, isAdmin }: { userId: string; isAdmin: boolean }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState<{ action: UserAction; label: string; desc: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: UserAction) {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/users/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Action failed');
      toast.success('Done');
      setConfirm(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button size="sm" variant="outline" disabled={busy} onClick={() => run('resend_verification')}>
        Resend verification email
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setConfirm({ action: 'toggle_admin', label: isAdmin ? 'Revoke admin' : 'Grant admin', desc: isAdmin ? 'Remove administrator access from this user.' : 'Grant this user full administrator access.' })}
      >
        {isAdmin ? 'Revoke admin' : 'Grant admin'}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => setConfirm({ action: 'toggle_suspend', label: 'Toggle suspension', desc: 'Suspending blocks this user from posting or claiming appearances. Re-running lifts the suspension.' })}
      >
        Suspend / unsuspend
      </Button>

      <Dialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirm?.label}</DialogTitle>
            <DialogDescription>{confirm?.desc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirm(null)} disabled={busy}>Cancel</Button>
            <Button disabled={busy} onClick={() => confirm && run(confirm.action)}>
              {busy ? 'Working…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
