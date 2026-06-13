'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import {
  Gavel,
  LayoutDashboard,
  CalendarClock,
  Users,
  ScrollText,
  Banknote,
  Scale,
  ShieldCheck,
  Link2,
  ArrowLeft,
  LogOut,
} from 'lucide-react';

const ADMIN_LINKS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/appearances', label: 'Appearances', icon: CalendarClock },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/disputes', label: 'Disputes', icon: Scale },
  { href: '/admin/verifications', label: 'Verifications', icon: ShieldCheck },
  { href: '/admin/payouts', label: 'Payouts', icon: Banknote },
  { href: '/admin/referrals', label: 'Referrals', icon: Link2 },
  { href: '/admin/audit', label: 'Audit Log', icon: ScrollText },
];

export function AdminShell({ children, adminName }: { children: React.ReactNode; adminName: string }) {
  const pathname = usePathname();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex min-h-screen w-[272px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="border-b border-sidebar-border px-5 py-6">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <Gavel className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div className="leading-tight">
              <span className="block font-heading text-xl tracking-[-0.02em] text-sidebar-foreground">
                Benchline
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">Admin</span>
            </div>
          </Link>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {ADMIN_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/12 text-primary shadow-sm ring-1 ring-primary/15'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={1.75} />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-2 border-t border-sidebar-border p-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
            Back to app
          </Link>
          <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-2 py-2 ring-1 ring-border/60">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              {adminName?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{adminName}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            Sign out
          </button>
        </div>
      </aside>
      <main className="relative flex-1 overflow-x-hidden bg-background p-6 md:p-10">
        <div className="relative mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
