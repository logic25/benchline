import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateICS, appearanceToIcs } from '@/lib/calendar/ics';
import { rateLimitGuard } from '@/lib/api/guard';

// GET /api/appearances/{id}/calendar.ics — returns a downloadable ICS for the
// appearance. Authorized to involved parties only (RLS already restricts the
// SELECT, so a non-party simply gets no row).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const blocked = await rateLimitGuard('read', user.id);
  if (blocked) return blocked;

  const { data: appearance } = await supabase
    .from('appearances')
    .select('*')
    .eq('id', id)
    .single();
  if (!appearance) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (appearance.posted_by !== user.id && appearance.claimed_by !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let organizerName: string | undefined;
  if (appearance.claimed_by) {
    const { data: claimer } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', appearance.claimed_by)
      .single();
    organizerName = claimer?.full_name ?? undefined;
  }

  const ics = generateICS(appearanceToIcs(appearance), { organizerName });

  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="benchline-${id}.ics"`,
      'Cache-Control': 'no-store',
    },
  });
}
