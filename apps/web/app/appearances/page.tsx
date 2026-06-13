'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AppShell } from '@/components/layout/app-shell';
import { Header } from '@/components/layout/header';
import { AppearanceCard } from '@/components/appearances/appearance-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import type { Appearance, Profile } from '@/lib/types';

export default function AppearancesPage() {
  const [appearances, setAppearances] = useState<Appearance[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
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
        .order('appearance_date', { ascending: false });
      setAppearances(data || []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  const posted = appearances.filter((a) => a.posted_by === profile?.id);
  const claimed = appearances.filter((a) => a.claimed_by === profile?.id);
  const active = appearances.filter((a) => ['open', 'claimed', 'in_progress'].includes(a.status));
  const completed = appearances.filter((a) => a.status === 'completed');

  return (
    <AppShell>
      <Header title="My Appearances" action={<Link href="/post"><Button><PlusCircle className="h-4 w-4 mr-2" />Post Appearance</Button></Link>} />
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
            <TabsTrigger value="posted">Posted ({posted.length})</TabsTrigger>
            <TabsTrigger value="claimed">Claimed ({claimed.length})</TabsTrigger>
          </TabsList>
          {[{ key: 'active', list: active }, { key: 'completed', list: completed }, { key: 'posted', list: posted }, { key: 'claimed', list: claimed }].map(({ key, list }) => (
            <TabsContent key={key} value={key}>
              {list.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No {key} appearances</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {list.map((a) => (<AppearanceCard key={a.id} appearance={a} />))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </AppShell>
  );
}
