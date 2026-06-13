import { describe, it, expect } from 'vitest';
import { redact, restore, restoreDeep } from '@/lib/ai/redact';

const ctx = {
  caseCaption: 'Smith v. Jones',
  caseIndexNumber: '123456/2024',
  judgeName: 'Hon. Maria Garcia',
  opposingCounsel: 'Robert Chen',
};

describe('redact', () => {
  it('replaces known fields with stable placeholders', () => {
    const text = 'In Smith v. Jones (123456/2024), Hon. Maria Garcia presided. Robert Chen appeared.';
    const { redacted, dictionary } = redact(text, ctx);
    expect(redacted).toContain('[CASE]');
    expect(redacted).toContain('[INDEX]');
    expect(redacted).toContain('[JUDGE]');
    expect(redacted).toContain('[OPP_COUNSEL_1]');
    expect(redacted).not.toContain('Smith v. Jones');
    expect(redacted).not.toContain('123456/2024');
    expect(redacted).not.toContain('Robert Chen');
    expect(dictionary['[CASE]']).toBe('Smith v. Jones');
    expect(dictionary['[INDEX]']).toBe('123456/2024');
  });

  it('redacts unknown capitalized party names heuristically', () => {
    const { redacted, dictionary } = redact('The witness Alice Wonderland testified.', {});
    expect(redacted).toContain('[PARTY_1]');
    expect(redacted).not.toContain('Alice Wonderland');
    expect(dictionary['[PARTY_1]']).toBe('Alice Wonderland');
  });

  it('reuses the same placeholder for repeated names', () => {
    const { redacted } = redact('Alice Wonderland and Alice Wonderland again.', {});
    const matches = redacted.match(/\[PARTY_1\]/g) || [];
    expect(matches.length).toBe(2);
    expect(redacted).not.toContain('[PARTY_2]');
  });

  it('round-trips: restore(redact(x)) === x for known fields', () => {
    const text = 'In Smith v. Jones (123456/2024), Hon. Maria Garcia presided. Robert Chen appeared.';
    const { redacted, dictionary } = redact(text, ctx);
    expect(restore(redacted, dictionary)).toBe(text);
  });

  it('round-trips heuristic names too', () => {
    const text = 'The witness Alice Wonderland testified before the panel.';
    const { redacted, dictionary } = redact(text, {});
    expect(restore(redacted, dictionary)).toBe(text);
  });

  it('restoreDeep restores names inside structured JSON output', () => {
    const text = 'Hon. Maria Garcia ruled for Robert Chen.';
    const { redacted, dictionary } = redact(text, ctx);
    // Simulate a structured model response that echoes the redacted tokens.
    const structured = {
      summary: redacted,
      key_takeaways: [`[JUDGE] favored [OPP_COUNSEL_1]`],
      nested: { note: '[JUDGE]' },
    };
    const restored = restoreDeep(structured, dictionary);
    expect(restored.summary).toBe(text);
    expect(restored.key_takeaways[0]).toBe('Hon. Maria Garcia favored Robert Chen');
    expect(restored.nested.note).toBe('Hon. Maria Garcia');
  });

  it('does not create dictionary entries for empty fields', () => {
    const { dictionary } = redact('No identifiers here at all.', { caseCaption: '', judgeName: null });
    expect(dictionary['[CASE]']).toBeUndefined();
    expect(dictionary['[JUDGE]']).toBeUndefined();
  });
});
