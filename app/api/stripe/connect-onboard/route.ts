import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { data: profile } = await supabase.from('profiles').select('stripe_account_id').eq('id', user.id).single();
    let accountId = profile?.stripe_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express', email: user.email!,
        capabilities: { transfers: { requested: true } },
      });
      accountId = account.id;
      await supabase.from('profiles').update({ stripe_account_id: accountId }).eq('id', user.id);
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId, type: 'account_onboarding',
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?stripe=connected`,
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
