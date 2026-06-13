import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { barVerificationSubmitSchema } from '@/lib/validation/schemas';
import { lookupAttorney } from '@/lib/verification/oca-lookup';
import { rateLimitGuard } from '@/lib/api/guard';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const parsed = barVerificationSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 });
  }
  const { barNumber, barState, fullNameLegal, evidenceUrl } = parsed.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const blocked = await rateLimitGuard('mutation', user.id);
  if (blocked) return blocked;

  // Phase 2: always 'manual'; Phase 3 may auto-approve from OCA.
  const lookup = await lookupAttorney(barNumber, barState);

  const service = createServiceClient();

  const { data: req, error: reqErr } = await service
    .from('bar_verification_requests')
    .insert({
      user_id: user.id,
      bar_number: barNumber,
      bar_state: barState,
      full_name_legal: fullNameLegal,
      evidence_url: evidenceUrl ?? null,
      status: 'pending',
    })
    .select()
    .single();
  if (reqErr) return NextResponse.json({ error: reqErr.message }, { status: 500 });

  const { error: profErr } = await service
    .from('profiles')
    .update({ bar_verification_status: 'pending', bar_number: barNumber, bar_state: barState })
    .eq('id', user.id);
  if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 });

  const { error: auditErr } = await service.from('audit_log').insert({
    actor_user_id: user.id,
    event_type: 'verification.bar.submitted',
    payload: { request_id: req.id, bar_number: barNumber, bar_state: barState, oca_source: lookup.source },
  });
  if (auditErr) console.error('audit_log insert:', auditErr.message);

  return NextResponse.json({ success: true, requestId: req.id, ocaSource: lookup.source });
}
