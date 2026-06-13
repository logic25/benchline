import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { invokeClaude } from '@/lib/ai/bedrock-client';
import { redact, restoreDeep } from '@/lib/ai/redact';
import { structureReportSchema } from '@/lib/validation/schemas';

// Expected shape of the model's structured output. We Zod-validate it; on
// failure we record the error in the audit log and fall back to the raw notes.
const modelOutputSchema = z.object({
  summary: z.string(),
  key_takeaways: z.array(z.string()),
  recommended_next_steps: z.array(z.string()),
  risk_assessment: z.string(),
  tone: z.string(),
});
type ModelOutput = z.infer<typeof modelOutputSchema>;

function buildPrompt(redactedNotes: string, ctx: { judgeName: string; outcome: string; actionItems: string; judgeNotes: string }): string {
  return `You are a legal assistant structuring a court appearance outcome report. Identifying details have been replaced with bracketed placeholders (e.g. [CASE], [JUDGE], [PARTY_1]); preserve those placeholders verbatim in your output.

Context:
- Judge: ${ctx.judgeName || 'Not specified'}
- Outcome: ${ctx.outcome || 'Not specified'}
- Action Items: ${ctx.actionItems || 'None specified'}
- Judge Notes: ${ctx.judgeNotes || 'None'}

Raw Notes from Per Diem Attorney:
${redactedNotes || 'No additional notes'}

Return a JSON object with these fields:
- summary: A 2-3 sentence professional summary
- key_takeaways: Array of 3-5 bullet points
- recommended_next_steps: Array of action items with deadlines if mentioned
- risk_assessment: Brief assessment of any concerns
- tone: Overall assessment (positive/neutral/concerning)

Return ONLY valid JSON, no markdown.`;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const parsed = structureReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 });
  }
  const { appearanceId, rawNotes, context } = parsed.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Consent gate: if the user opted out, return the raw notes unchanged and do
  // not call the model.
  const { data: profile } = await supabase
    .from('profiles')
    .select('ai_processing_consent')
    .eq('id', user.id)
    .single();
  if (profile && profile.ai_processing_consent === false) {
    return NextResponse.json({ summary: rawNotes, ai_disabled: true });
  }

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    // Bedrock not configured: degrade gracefully to raw notes.
    return NextResponse.json({ summary: rawNotes, ai_unavailable: true });
  }

  const service = createServiceClient();

  // Pull identifying fields to redact from the appearance.
  const { data: appearance } = await supabase
    .from('appearances')
    .select('case_caption, case_index_number, opposing_counsel_name')
    .eq('id', appearanceId)
    .single();

  const { redacted, dictionary } = redact(rawNotes, {
    caseCaption: appearance?.case_caption,
    caseIndexNumber: appearance?.case_index_number,
    judgeName: context.judgeName,
    opposingCounsel: appearance?.opposing_counsel_name,
  });

  try {
    const raw = await invokeClaude(buildPrompt(redacted, context));

    let validated: ModelOutput;
    try {
      const json = JSON.parse(raw);
      validated = modelOutputSchema.parse(json);
    } catch (validationErr) {
      await service.from('audit_log').insert({
        appearance_id: appearanceId,
        actor_user_id: user.id,
        event_type: 'ai.structure.validation_failed',
        payload: { error: validationErr instanceof Error ? validationErr.message : 'parse/validation failed' },
      });
      return NextResponse.json({ summary: rawNotes, ai_validation_failed: true });
    }

    // Re-stitch the original names back into the structured output.
    const restored = restoreDeep<ModelOutput>(validated, dictionary);

    // Persist server-side (service role) so the dictionary never reaches the
    // client and the stored report stays consistent.
    await service
      .from('outcome_reports')
      .update({ ai_structured_report: restored, ai_redaction_dictionary: dictionary })
      .eq('appearance_id', appearanceId)
      .eq('submitted_by', user.id);

    await service.from('audit_log').insert({
      appearance_id: appearanceId,
      actor_user_id: user.id,
      event_type: 'ai.structure.completed',
      payload: { placeholders: Object.keys(dictionary).length },
    });

    return NextResponse.json(restored);
  } catch (err) {
    await service.from('audit_log').insert({
      appearance_id: appearanceId,
      actor_user_id: user.id,
      event_type: 'ai.structure.error',
      payload: { error: err instanceof Error ? err.message : 'bedrock call failed' },
    });
    return NextResponse.json({ summary: rawNotes, ai_error: true });
  }
}
