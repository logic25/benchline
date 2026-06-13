import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateReportPDF } from '@/lib/reports/pdf';

// GET /api/reports/{id}/pdf — branded PDF of an outcome report. {id} is the
// outcome_reports id. Authorized to involved parties (RLS on outcome_reports
// already restricts SELECT to the submitter and the appearance's parties).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: report } = await supabase.from('outcome_reports').select('*').eq('id', id).single();
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: appearance } = await supabase
    .from('appearances')
    .select('*')
    .eq('id', report.appearance_id)
    .single();
  if (!appearance) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Defense-in-depth: confirm the caller is an involved party even though RLS
  // already gates the rows above.
  if (appearance.posted_by !== user.id && appearance.claimed_by !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // The report author (per diem) appears in the signature block.
  const { data: author } = await supabase.from('profiles').select('*').eq('id', report.submitted_by).single();

  const pdf = await generateReportPDF(report, appearance, author ?? null);

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="benchline-report-${id}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
