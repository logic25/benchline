import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { appearanceId } = await request.json();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { data: appearance, error: loadErr } = await supabase
      .from('appearances')
      .select('*')
      .eq('id', appearanceId)
      .single();

    if (loadErr || !appearance || appearance.posted_by !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let transferNote: string | undefined;

    if (process.env.STRIPE_SECRET_KEY && appearance.claimed_by) {
      const { data: claimer } = await supabase
        .from('profiles')
        .select('stripe_account_id')
        .eq('id', appearance.claimed_by)
        .single();

      if (claimer?.stripe_account_id) {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        await stripe.transfers.create({
          amount: appearance.pay_rate,
          currency: 'usd',
          destination: claimer.stripe_account_id,
          metadata: { appearance_id: appearanceId },
        });
        transferNote = 'transfer_ok';
      } else {
        transferNote = 'no_connect_account';
      }
    } else {
      transferNote = process.env.STRIPE_SECRET_KEY ? 'no_stripe' : 'stripe_disabled';
    }

    await supabase
      .from('appearances')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', appearanceId);

    if (appearance.claimed_by) {
      await supabase.from('notifications').insert({
        user_id: appearance.claimed_by,
        type: 'payment_released',
        title: 'Payment Released',
        body: `$${(appearance.pay_rate / 100).toFixed(2)} recorded for ${appearance.case_caption}.`,
        metadata: { appearance_id: appearanceId, transfer_note: transferNote },
      });
    }

    return NextResponse.json({ success: true, transferNote });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Payment release failed' },
      { status: 500 }
    );
  }
}
