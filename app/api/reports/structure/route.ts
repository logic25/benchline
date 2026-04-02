import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { rawNotes, context } = await request.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 500 });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `You are a legal assistant structuring a court appearance outcome report. Given the following raw notes and context from a per diem attorney, produce a clean, professional structured report.

Context:
- Judge: ${context.judgeName || 'Not specified'}
- Outcome: ${context.outcome || 'Not specified'}
- Action Items: ${context.actionItems || 'None specified'}
- Judge Notes: ${context.judgeNotes || 'None'}

Raw Notes from Per Diem Attorney:
${rawNotes || 'No additional notes'}

Return a JSON object with these fields:
- summary: A 2-3 sentence professional summary
- key_takeaways: Array of 3-5 bullet points
- recommended_next_steps: Array of action items with deadlines if mentioned
- risk_assessment: Brief assessment of any concerns
- tone: Overall assessment (positive/neutral/concerning)

Return ONLY valid JSON, no markdown.`,
        }],
      }),
    });

    if (!response.ok) throw new Error('AI request failed');

    const data = await response.json();
    const content = data.content[0]?.text;

    try {
      const structured = JSON.parse(content);
      return NextResponse.json(structured);
    } catch {
      return NextResponse.json({ summary: content });
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'AI structuring failed' }, { status: 500 });
  }
}
