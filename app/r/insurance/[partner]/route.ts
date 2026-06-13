import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getInsurancePartner } from '@/lib/insurance-partners';

// GET /r/insurance/{partner} — logs the referral click (best-effort) then 302s
// to the partner's site. Auth is optional: a logged-out visitor still gets the
// redirect, just with a null user_id.
export async function GET(request: NextRequest, { params }: { params: Promise<{ partner: string }> }) {
  const { partner: slug } = await params;
  const partner = getInsurancePartner(slug);
  if (!partner) {
    return NextResponse.json({ error: 'Unknown partner' }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const source = request.nextUrl.searchParams.get('source');

  // Best-effort log; never block the redirect on a logging failure.
  try {
    const service = createServiceClient();
    await service.from('referral_clicks').insert({
      user_id: user?.id ?? null,
      partner: partner.slug,
      source: source ?? null,
    });
  } catch (err) {
    console.error('referral_clicks insert failed:', err instanceof Error ? err.message : err);
  }

  return NextResponse.redirect(partner.url, 302);
}
