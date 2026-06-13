import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { sendSms, isSmsConfigured } from '@/lib/sms/client';
import { phoneSendCodeSchema } from '@/lib/validation/schemas';
import { rateLimitGuard, clientIp } from '@/lib/api/guard';

const CODE_TTL_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const parsed = phoneSendCodeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 });
  }
  const { phone } = parsed.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const blocked = await rateLimitGuard('auth', clientIp(request));
  if (blocked) return blocked;

  if (!isSmsConfigured()) {
    return NextResponse.json({ error: 'SMS is not configured on this deployment.' }, { status: 503 });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const service = createServiceClient();

  // Store the phone (unverified) and the pending code.
  await service.from('profiles').update({ phone, phone_verified: false, phone_verified_at: null }).eq('id', user.id);
  const { error: insErr } = await service.from('phone_verification_codes').insert({
    user_id: user.id,
    phone,
    code,
    expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
  });
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  const sid = await sendSms(phone, `Your Benchline verification code is ${code}. It expires in 10 minutes.`);
  if (!sid) {
    return NextResponse.json({ error: 'Could not send the verification SMS. Check the number and try again.' }, { status: 502 });
  }

  return NextResponse.json({ sent: true });
}
