import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { appearanceId } = await request.json();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: appearance } = await supabase.from('appearances').select('*').eq('id', appearanceId).eq('status', 'open').single();
  if (!appearance) return NextResponse.json({ error: 'Appearance not available' }, { status: 400 });
  if (appearance.posted_by === user.id) return NextResponse.json({ error: 'Cannot claim your own appearance' }, { status: 400 });

  const { error } = await supabase.from('appearances').update({
    claimed_by: user.id, status: 'claimed', claimed_at: new Date().toISOString(),
  }).eq('id', appearanceId).eq('status', 'open');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { error: nErr } = await supabase.from('notifications').insert({
    user_id: appearance.posted_by, type: 'appearance_claimed',
    title: 'Appearance Claimed', body: `Your appearance for ${appearance.case_caption} has been claimed.`,
    metadata: { appearance_id: appearanceId },
  });
  if (nErr) console.error('notifications insert:', nErr);

  return NextResponse.json({ success: true });
}
