'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AppShell } from '@/components/layout/app-shell';
import { Header } from '@/components/layout/header';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { AppearanceCard } from '@/components/appearances/appearance-card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search } from 'lucide-react';
import Link from 'next/link';
import type { Appearance, Profile } from '@/lib/types';

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [appearances, setAppearances] = useState<Appearance[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(profileData);
      const { data } = await supabase.from('appearances').select('*')
        .or(`posted_by.eq.${user.id},claimed_by.eq.${user.id}`)
        .order('appearance_date', { ascending: true }).limit(10);
      setAppearances(data || []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  const active = appearances.filter((a) => ['open', 'claimed', 'in_progress'].includes(a.status));
  const completed = appearances.filter((a) => a.status === 'completed');
  const open = appearances.filter((a) => a.status === 'open');

  const stats = {
    active: active.length,
    completed: completed.length,
    totalSpent: completed.filter(a => a.posted_by === profile?.id).reduce((sum, a) => sum + a.pay_rate + a.platform_fee, 0),
    totalEarned: completed.filter(a => a.claimed_by === profile?.id).reduce((sum, a) => sum + a.pay_rate, 0),
    pending: open.length,
  };

  const isLitigator = profile?.role === 'litigator' || profile?.role === 'both';
  const isPerDiem = profile?.role === 'per_diem' || profile?.role === 'both';

  return (
    <AppShell>
      <Header
        title={`Welcome back, ${profile?.full_name?.split(' ')[0] || ''}`}
        description={loading ? '' : `You have ${active.length} active appearance${active.length !== 1 ? 's' : ''}`}
        action={
          <div className="flex gap-2">
            {isLitigator && <Link href="/post"><Button><PlusCircle className="h-4 w-4 mr-2" /> Post Appearance</Button></Link>}
            {isPerDiem && <Link href="/browse"><Button variant="outline"><Search className="h-4 w-4 mr-2" /> Browse</Button></Link>}
          </div>
        }
      />
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading dashboard...</div>
      ) : (
        <>
          <StatsCards stats={stats} role={profile?.role || 'litigator'} />
          <div>
            <h2 className="text-lg font-semibold mb-4">Upcoming Appearances</h2>
            {active.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-white rounded-lg border">
                <p>No upcoming appearances</p>
                {isLitigator && <Link href="/post"><Button variant="link" className="mt-2">Post your first appearance</Button></Link>}
                {isPerDiem && <Link href="/browse"><Button variant="link" className="mt-2">Browse available appearances</Button></Link>}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {active.map((a) => (<AppearanceCard key={a.id} appearance={a} />))}
              </div>
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}
