import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { releaseAppearancePayment } from '@/lib/stripe/release';
import { TransitionError } from '@/lib/appearances/state-machine';
import { releasePaymentSchema } from '@/lib/validation/schemas';

// Litigator-initiated release. Authenticates with the user session, verifies
// ownership, then runs the shared release logic with the service-role client
// (needed for the guarded transition + audit-log write).
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const parsed = releasePaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 });
  }
  const { appearanceId } = parsed.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: appearance } = await supabase
    .from('appearances')
    .select('posted_by')
    .eq('id', appearanceId)
    .single();

  if (!appearance || appearance.posted_by !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const service = createServiceClient();
    const result = await releaseAppearancePayment(service, appearanceId, user.id, { auto: false });
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    if (err instanceof TransitionError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Payment release failed' },
      { status: 500 }
    );
  }
}
