import { describe, it, expect } from 'vitest';
import { buildReportDocument } from '@/lib/reports/pdf';
import type { Appearance, OutcomeReport, Profile } from '@/lib/types';

const appearance = {
  id: 'app-1',
  case_caption: 'Smith v. Jones',
  case_index_number: '123456/2026',
  court_name: 'Supreme Court',
  appearance_date: '2026-07-15',
  appearance_type: 'conference',
  posted_by: 'p1',
  claimed_by: 'p2',
} as unknown as Appearance;

const profile = {
  id: 'p2',
  full_name: 'Jane Doe, Esq.',
  bar_number: '7654321',
} as unknown as Profile;

const structuredReport = {
  id: 'r1',
  appearance_id: 'app-1',
  submitted_by: 'p2',
  outcome: 'adjourned',
  judge_name: 'Hon. Maria Garcia',
  judge_notes: '',
  opposing_counsel: '',
  action_items: '',
  red_flags: '',
  raw_notes: '',
  ai_redaction_dictionary: null,
  created_at: '2026-07-15T12:00:00Z',
  ai_structured_report: {
    summary: 'The matter was adjourned to a later date.',
    key_takeaways: ['Adjourned', 'Discovery ongoing'],
    recommended_next_steps: ['Calendar next date'],
    risk_assessment: 'Low risk.',
    tone: 'neutral',
  },
} as unknown as OutcomeReport;

// Recursively collect all string children from a react element tree.
function collectText(node: unknown, out: string[] = []): string[] {
  if (node == null) return out;
  if (typeof node === 'string') {
    out.push(node);
    return out;
  }
  if (Array.isArray(node)) {
    node.forEach((c) => collectText(c, out));
    return out;
  }
  if (typeof node === 'object' && 'props' in (node as Record<string, unknown>)) {
    const props = (node as { props?: { children?: unknown } }).props;
    if (props && 'children' in props) collectText(props.children, out);
  }
  return out;
}

describe('buildReportDocument', () => {
  it('returns a Document element', () => {
    const doc = buildReportDocument(structuredReport, appearance, profile);
    expect(doc).toBeTruthy();
    expect(typeof doc.type).not.toBe('undefined');
  });

  it('includes branding, case metadata, and the structured sections', () => {
    const doc = buildReportDocument(structuredReport, appearance, profile);
    const text = collectText(doc).join(' | ');
    expect(text).toContain('Benchline');
    expect(text).toContain('Smith v. Jones');
    expect(text).toContain('123456/2026');
    expect(text).toContain('The matter was adjourned to a later date.');
    expect(text).toContain('Discovery ongoing');
    expect(text).toContain('Calendar next date');
    expect(text).toContain('Low risk.');
  });

  it('includes the per diem name, bar number, and confidentiality notice', () => {
    const doc = buildReportDocument(structuredReport, appearance, profile);
    const text = collectText(doc).join(' | ');
    expect(text).toContain('Jane Doe, Esq.');
    expect(text).toContain('NY Bar No. 7654321');
    expect(text).toContain('CONFIDENTIAL');
  });

  it('falls back to raw report fields when there is no structured report', () => {
    const raw = {
      ...structuredReport,
      ai_structured_report: null,
      judge_notes: 'Judge was firm on timing.',
      action_items: 'File the brief.',
    } as unknown as OutcomeReport;
    const doc = buildReportDocument(raw, appearance, profile);
    const text = collectText(doc).join(' | ');
    expect(text).toContain('Report details');
    expect(text).toContain('Judge was firm on timing.');
    expect(text).toContain('File the brief.');
  });

  it('uses a placeholder bar line when the profile lacks a bar number', () => {
    const doc = buildReportDocument(structuredReport, appearance, { ...profile, bar_number: null } as unknown as Profile);
    const text = collectText(doc).join(' | ');
    expect(text).toContain('NY Bar No. ____________');
  });
});
