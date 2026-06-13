import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { phoneVerifyCodeSchema } from '@/lib/validation/schemas';
import { rateLimitGuard, clientIp } from '@/lib/api/guard';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const parsed = phoneVerifyCodeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 });
  }
  const { code } = parsed.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const blocked = await rateLimitGuard('auth', clientIp(request));
  if (blocked) return blocked;

  const service = createServiceClient();

  // Most recent unconsumed, unexpired code for this user.
  const { data: row } = await service
    .from('phone_verification_codes')
    .select('id, code, phone, expires_at, consumed_at')
    .eq('user_id', user.id)
    .is('consumed_at', null)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row || row.code !== code) {
    return NextResponse.json({ error: 'That code is incorrect or has expired.' }, { status: 400 });
  }

  const nowIso = new Date().toISOString();
  await service.from('phone_verification_codes').update({ consumed_at: nowIso }).eq('id', row.id);
  await service
    .from('profiles')
    .update({ phone: row.phone, phone_verified: true, phone_verified_at: nowIso })
    .eq('id', user.id);

  return NextResponse.json({ verified: true });
}
