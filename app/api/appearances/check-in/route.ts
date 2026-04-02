import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { appearanceId } = await request.json();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase.from('appearances').update({ status: 'in_progress' }).eq('id', appearanceId).eq('claimed_by', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: appearance } = await supabase.from('appearances').select('posted_by, case_caption').eq('id', appearanceId).single();
  if (appearance) {
    const { error: nErr } = await supabase.from('notifications').insert({
      user_id: appearance.posted_by, type: 'check_in',
      title: 'Per Diem Checked In', body: `Your per diem attorney has checked in for ${appearance.case_caption}.`,
      metadata: { appearance_id: appearanceId },
    });
    if (nErr) console.error('notifications insert:', nErr);
  }

  return NextResponse.json({ success: true });
}
