'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import type { Notification } from '@/lib/types';

export function NotificationsMenu() {
  const supabase = createClient();
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(40);
    setItems(data || []);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const unread = items.filter((n) => !n.read).length;

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, read: true } : x)));
  }

  function hrefFor(n: Notification): string | null {
    const id = n.metadata?.appearance_id;
    if (typeof id === 'string') return `/appearances/${id}`;
    return null;
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative h-8 w-8 shrink-0"
        aria-label="Notifications"
        onClick={() => setOpen(true)}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Notifications</SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-8rem)] pr-1">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No notifications yet</p>
            ) : (
              items.map((n) => {
                const href = hrefFor(n);
                return (
                  <div
                    key={n.id}
                    className={`rounded-lg border p-3 text-sm ${n.read ? 'opacity-80' : 'border-primary/30 bg-primary/5'}`}
                  >
                    <p className="font-medium">{n.title}</p>
                    {n.body && <p className="text-muted-foreground mt-1 text-xs">{n.body}</p>}
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {href && (
                        <Link
                          href={href}
                          className="text-xs text-primary underline"
                          onClick={() => {
                            markRead(n.id);
                            setOpen(false);
                          }}
                        >
                          View appearance
                        </Link>
                      )}
                      {!n.read && (
                        <button type="button" className="text-xs text-muted-foreground underline" onClick={() => markRead(n.id)}>
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
