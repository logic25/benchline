// PII redaction for AI report structuring. Before sending report text to the
// LLM we replace identifying details with stable placeholders, and after we
// receive the structured output we restore the originals. The placeholder ->
// original dictionary is also persisted so a stored report can be re-displayed
// with names intact.
//
// Redaction is best-effort defense-in-depth on top of Bedrock's zero-retention
// terms — it is not a guarantee of perfect anonymization.

export interface RedactionContext {
  caseCaption?: string | null;
  caseIndexNumber?: string | null;
  judgeName?: string | null;
  opposingCounsel?: string | null;
}

export interface RedactionResult {
  redacted: string;
  // placeholder -> original value
  dictionary: Record<string, string>;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Replace every occurrence of `value` in `text` with `placeholder`, recording it
// in the dictionary. No-op for empty/whitespace values.
function replaceAll(
  text: string,
  value: string | null | undefined,
  placeholder: string,
  dictionary: Record<string, string>
): string {
  const v = (value ?? '').trim();
  if (!v) return text;
  const re = new RegExp(escapeRegExp(v), 'gi');
  if (!re.test(text)) return text;
  dictionary[placeholder] = v;
  return text.replace(re, placeholder);
}

// Heuristic NER for party names: capture sequences of capitalized words (e.g.
// "John Q. Smith"). This is intentionally conservative — it only fires on 2+
// capitalized tokens to avoid redacting sentence-initial words.
const PERSON_NAME_RE = /\b([A-Z][a-z]+(?:\s+[A-Z]\.)?(?:\s+[A-Z][a-z]+)+)\b/g;

export function redact(text: string, ctx: RedactionContext): RedactionResult {
  const dictionary: Record<string, string> = {};
  let out = text ?? '';

  // Known fields first, so their placeholders win over the generic NER pass.
  out = replaceAll(out, ctx.caseCaption, '[CASE]', dictionary);
  out = replaceAll(out, ctx.caseIndexNumber, '[INDEX]', dictionary);
  out = replaceAll(out, ctx.judgeName, '[JUDGE]', dictionary);

  if (ctx.opposingCounsel && ctx.opposingCounsel.trim()) {
    out = replaceAll(out, ctx.opposingCounsel, '[OPP_COUNSEL_1]', dictionary);
  }

  // Generic party-name pass over whatever capitalized names remain.
  const seen = new Map<string, string>();
  let counter = 1;
  out = out.replace(PERSON_NAME_RE, (match) => {
    const key = match.toLowerCase();
    if (seen.has(key)) return seen.get(key)!;
    const placeholder = `[PARTY_${counter++}]`;
    seen.set(key, placeholder);
    dictionary[placeholder] = match;
    return placeholder;
  });

  return { redacted: out, dictionary };
}

// Restore placeholders to their original values. Works on a string or, applied
// recursively, on any JSON value (objects/arrays of strings) so structured
// model output can be re-stitched. Longer placeholders are restored first to
// avoid partial collisions (e.g. [PARTY_1] vs [PARTY_12]).
export function restore(value: string, dictionary: Record<string, string>): string {
  let out = value;
  const placeholders = Object.keys(dictionary).sort((a, b) => b.length - a.length);
  for (const ph of placeholders) {
    out = out.split(ph).join(dictionary[ph]);
  }
  return out;
}

export function restoreDeep<T>(value: T, dictionary: Record<string, string>): T {
  if (typeof value === 'string') return restore(value, dictionary) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => restoreDeep(v, dictionary)) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = restoreDeep(v, dictionary);
    return out as unknown as T;
  }
  return value;
}
