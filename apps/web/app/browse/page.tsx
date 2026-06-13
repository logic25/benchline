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

      // Hide appearances where the viewer has a conflict with opposing counsel:
      // their own/firm bar numbers and name, or any declared conflict party.
      const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
      const { data: { user } } = await supabase.auth.getUser();
      let visible = data || [];
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, firm_name, firm_bar_numbers, bar_number')
          .eq('id', user.id)
          .single();
        const { data: declarations } = await supabase
          .from('conflict_declarations')
          .select('conflicted_party_name, conflicted_party_firm, conflicted_party_bar_number')
          .eq('user_id', user.id);

        const ownBars = new Set(
          [norm(profile?.bar_number), ...((profile?.firm_bar_numbers as string[] | null) ?? []).map(norm)].filter(Boolean)
        );
        const ownNames = new Set([norm(profile?.full_name)].filter(Boolean));
        const ownFirms = new Set([norm(profile?.firm_name)].filter(Boolean));
        const declBars = new Set((declarations ?? []).map((d) => norm(d.conflicted_party_bar_number)).filter(Boolean));
        const declNames = new Set((declarations ?? []).map((d) => norm(d.conflicted_party_name)).filter(Boolean));
        const declFirms = new Set((declarations ?? []).map((d) => norm(d.conflicted_party_firm)).filter(Boolean));

        visible = visible.filter((a) => {
          const oName = norm(a.opposing_counsel_name);
          const oFirm = norm(a.opposing_counsel_firm);
          const oBar = norm(a.opposing_counsel_bar_number);
          if (oBar && (ownBars.has(oBar) || declBars.has(oBar))) return false;
          if (oName && (ownNames.has(oName) || declNames.has(oName))) return false;
          if (oFirm && (ownFirms.has(oFirm) || declFirms.has(oFirm))) return false;
          return true;
        });
      }

      setAppearances(visible);
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
