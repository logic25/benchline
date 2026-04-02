'use client';

import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Header } from '@/components/layout/header';
import { ReportForm } from '@/components/reports/report-form';

export default function ReportPage() {
  const params = useParams();
  return (
    <AppShell>
      <Header title="Submit Outcome Report" description="Report what happened at the appearance" />
      <ReportForm appearanceId={params.id as string} />
    </AppShell>
  );
}
