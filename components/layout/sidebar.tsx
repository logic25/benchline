'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { Profile } from '@/lib/types';
import { LayoutDashboard, PlusCircle, Search, FileText, DollarSign, Settings, LogOut, Gavel, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { NotificationsMenu } from '@/components/layout/notifications-menu';

interface SidebarProps {
  profile: Profile | null;
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const supabase = createClient();
  const role = profile?.role || 'litigator';

  const litigatorLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/post', label: 'Post Appearance', icon: PlusCircle },
    { href: '/appearances', label: 'My Appearances', icon: FileText },
    { href: '/verify', label: 'Verification', icon: ShieldCheck },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const perDiemLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/browse', label: 'Browse Appearances', icon: Search },
    { href: '/appearances', label: 'My Appearances', icon: FileText },
    { href: '/earnings', label: 'Earnings', icon: DollarSign },
    { href: '/verify', label: 'Verification', icon: ShieldCheck },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const bothLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/post', label: 'Post Appearance', icon: PlusCircle },
    { href: '/browse', label: 'Browse Appearances', icon: Search },
    { href: '/appearances', label: 'My Appearances', icon: FileText },
    { href: '/earnings', label: 'Earnings', icon: DollarSign },
    { href: '/verify', label: 'Verification', icon: ShieldCheck },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const baseLinks = role === 'litigator' ? litigatorLinks : role === 'per_diem' ? perDiemLinks : bothLinks;
  const links = profile?.is_admin
    ? [...baseLinks, { href: '/admin/verifications', label: 'Admin Review', icon: ShieldCheck }]
    : baseLinks;

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <aside className="flex min-h-screen w-[288px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar shadow-[4px_0_24px_-12px_rgba(15,23,42,0.08)]">
      <div className="border-b border-sidebar-border px-5 py-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <Gavel className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <span className="font-heading text-2xl leading-none tracking-[-0.02em] text-sidebar-foreground">
            Benchline
          </span>
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
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
        <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-2 py-2 ring-1 ring-border/60">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
            {profile?.full_name?.charAt(0) || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{profile?.full_name || 'Loading…'}</p>
            <p className="text-xs capitalize text-muted-foreground">{role.replace('_', ' ')}</p>
          </div>
          <NotificationsMenu />
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
  );
}
