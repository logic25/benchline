'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AppShell } from '@/components/layout/app-shell';
import { Header } from '@/components/layout/header';
import { AppearanceCard } from '@/components/appearances/appearance-card';
import { Filters } from '@/components/appearances/filters';
import type { Appearance } from '@/lib/types';

export default function BrowsePage() {
  const [appearances, setAppearances] = useState<Appearance[]>([]);
  const [loading, setLoading] = useState(true);
  const [borough, setBorough] = useState('all');
  const [caseType, setCaseType] = useState('all');
  const [appearanceType, setAppearanceType] = useState('all');
  const [date, setDate] = useState('');
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      setLoading(true);
      let query = supabase
        .from('appearances')
        .select('*')
        .eq('status', 'open')
        .gte('appearance_date', new Date().toISOString().split('T')[0])
        .order('appearance_date', { ascending: true });

      if (borough !== 'all') query = query.eq('borough', borough);
      if (caseType !== 'all') query = query.eq('case_type', caseType);
      if (appearanceType !== 'all') query = query.eq('appearance_type', appearanceType);
      if (date) query = query.eq('appearance_date', date);

      const { data } = await query;
      setAppearances(data || []);
      setLoading(false);
    }
    load();
  }, [borough, caseType, appearanceType, date, supabase]);

  return (
    <AppShell>
      <Header title="Browse Appearances" description="Find court appearances that match your expertise" />
      <Filters
        borough={borough} caseType={caseType} appearanceType={appearanceType} date={date}
        onBoroughChange={(v) => setBorough(v || 'all')} onCaseTypeChange={(v) => setCaseType(v || 'all')}
        onAppearanceTypeChange={(v) => setAppearanceType(v || 'all')} onDateChange={setDate}
      />
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading appearances...</div>
      ) : appearances.length === 0 ? (
        <div className="text-center py-12"><p className="text-muted-foreground">No open appearances match your filters</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appearances.map((a) => (<AppearanceCard key={a.id} appearance={a} />))}
        </div>
      )}
    </AppShell>
  );
}
