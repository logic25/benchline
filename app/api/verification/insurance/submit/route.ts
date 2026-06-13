import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { insuranceSubmitSchema } from '@/lib/validation/schemas';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const parsed = insuranceSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 });
  }
  const { documentUrl, carrier, policyNumber, coverageAmountCents, effectiveDate, expiresDate } = parsed.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (new Date(expiresDate) <= new Date(effectiveDate)) {
    return NextResponse.json({ error: 'Expiration must be after the effective date' }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: upload, error: insErr } = await service
    .from('insurance_uploads')
    .insert({
      user_id: user.id,
      document_url: documentUrl ?? null,
      carrier,
      policy_number: policyNumber,
      coverage_amount_cents: coverageAmountCents,
      effective_date: effectiveDate,
      expires_date: expiresDate,
      status: 'pending',
    })
    .select()
    .single();
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  const { error: profErr } = await service
    .from('profiles')
    .update({ insurance_status: 'pending' })
    .eq('id', user.id);
  if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 });

  const { error: auditErr } = await service.from('audit_log').insert({
    actor_user_id: user.id,
    event_type: 'verification.insurance.submitted',
    payload: { upload_id: upload.id, carrier, expires_date: expiresDate },
  });
  if (auditErr) console.error('audit_log insert:', auditErr.message);

  return NextResponse.json({ success: true, uploadId: upload.id });
}
