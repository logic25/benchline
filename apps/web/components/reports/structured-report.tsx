'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function StructuredReportView({ data }: { data: Record<string, unknown> | null | undefined }) {
  if (!data || !isRecord(data)) return null;

  const summary = typeof data.summary === 'string' ? data.summary : null;
  const tone = typeof data.tone === 'string' ? data.tone : null;
  const risk = typeof data.risk_assessment === 'string' ? data.risk_assessment : null;
  const takeaways = Array.isArray(data.key_takeaways)
    ? data.key_takeaways.filter((x): x is string => typeof x === 'string')
    : [];
  const steps = Array.isArray(data.recommended_next_steps) ? data.recommended_next_steps : [];

  const hasAny = summary || takeaways.length || steps.length || risk || tone;
  if (!hasAny) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI brief</CardTitle>
        {tone && <p className="text-xs text-muted-foreground capitalize">Tone: {tone}</p>}
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {summary && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Summary</p>
            <p className="whitespace-pre-wrap leading-relaxed">{summary}</p>
          </div>
        )}
        {takeaways.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Key takeaways</p>
            <ul className="list-disc pl-5 space-y-1">
              {takeaways.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        )}
        {steps.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Recommended next steps</p>
            <ul className="list-disc pl-5 space-y-1">
              {steps.map((s, i) => (
                <li key={i} className="whitespace-pre-wrap">
                  {typeof s === 'string' ? s : JSON.stringify(s)}
                </li>
              ))}
            </ul>
          </div>
        )}
        {risk && (
          <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 p-3">
            <p className="text-xs font-medium text-amber-900 dark:text-amber-200 mb-1">Risk</p>
            <p className="text-amber-900 dark:text-amber-100 whitespace-pre-wrap">{risk}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
