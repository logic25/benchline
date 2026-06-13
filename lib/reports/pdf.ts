import React from 'react';
import { Document, Page, Text, View, StyleSheet, renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import type { Appearance, OutcomeReport, Profile } from '@/lib/types';

// Branded PDF export of an outcome report. Built with React.createElement (no
// JSX) so this stays a plain .ts module that is easy to unit-test for structure.
// renderToBuffer runs server-side only.

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica', color: '#1a1a2e', lineHeight: 1.5 },
  header: { borderBottomWidth: 2, borderBottomColor: '#1a1a2e', paddingBottom: 12, marginBottom: 16 },
  brand: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#1a1a2e' },
  brandSub: { fontSize: 9, color: '#6b7280', marginTop: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  metaItem: { width: '50%', marginBottom: 4 },
  metaLabel: { fontSize: 8, color: '#6b7280', textTransform: 'uppercase' },
  metaValue: { fontSize: 11 },
  sectionTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginTop: 16, marginBottom: 6 },
  para: { marginBottom: 4 },
  bullet: { flexDirection: 'row', marginBottom: 3 },
  bulletDot: { width: 12 },
  bulletText: { flex: 1 },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
    fontSize: 8,
    color: '#6b7280',
  },
  sigLine: { marginTop: 18, borderTopWidth: 1, borderTopColor: '#1a1a2e', width: 220, paddingTop: 4 },
});

interface StructuredReport {
  summary?: string;
  key_takeaways?: string[];
  recommended_next_steps?: string[];
  risk_assessment?: string;
  tone?: string;
}

const h = React.createElement;

function metaItem(label: string, value: string) {
  return h(View, { style: styles.metaItem }, h(Text, { style: styles.metaLabel }, label), h(Text, { style: styles.metaValue }, value));
}

function bulletList(items: string[]) {
  return items.map((it, i) =>
    h(View, { style: styles.bullet, key: String(i) }, h(Text, { style: styles.bulletDot }, '•'), h(Text, { style: styles.bulletText }, it))
  );
}

// Builds the react-pdf Document element. Exported for structural unit tests.
export function buildReportDocument(
  report: OutcomeReport,
  appearance: Appearance,
  profile: Profile | null
): React.ReactElement<DocumentProps> {
  const structured = (report.ai_structured_report as StructuredReport | null) ?? null;
  const dateStr = appearance.appearance_date || '';
  const barLine = profile?.bar_number ? `NY Bar No. ${profile.bar_number}` : 'NY Bar No. ____________';

  const body: React.ReactElement[] = [];

  // Header.
  body.push(
    h(
      View,
      { style: styles.header, key: 'header' },
      h(Text, { style: styles.brand }, 'Benchline'),
      h(Text, { style: styles.brandSub }, 'Court Appearance Outcome Report'),
      h(
        View,
        { style: styles.metaRow },
        metaItem('Case', appearance.case_caption || '—'),
        metaItem('Index No.', appearance.case_index_number || '—'),
        metaItem('Court', appearance.court_name || '—'),
        metaItem('Date', dateStr),
        metaItem('Appearance type', appearance.appearance_type || '—'),
        metaItem('Outcome', report.outcome || '—')
      )
    )
  );

  // Structured AI body when present; otherwise fall back to raw report fields.
  if (structured) {
    if (structured.summary) {
      body.push(h(Text, { style: styles.sectionTitle, key: 's-sum' }, 'Summary'));
      body.push(h(Text, { style: styles.para, key: 'sum' }, structured.summary));
    }
    if (structured.key_takeaways?.length) {
      body.push(h(Text, { style: styles.sectionTitle, key: 's-take' }, 'Key takeaways'));
      body.push(...bulletList(structured.key_takeaways));
    }
    if (structured.recommended_next_steps?.length) {
      body.push(h(Text, { style: styles.sectionTitle, key: 's-next' }, 'Recommended next steps'));
      body.push(...bulletList(structured.recommended_next_steps));
    }
    if (structured.risk_assessment) {
      body.push(h(Text, { style: styles.sectionTitle, key: 's-risk' }, 'Risk assessment'));
      body.push(h(Text, { style: styles.para, key: 'risk' }, structured.risk_assessment));
    }
    if (structured.tone) {
      body.push(h(Text, { style: styles.sectionTitle, key: 's-tone' }, 'Overall tone'));
      body.push(h(Text, { style: styles.para, key: 'tone' }, structured.tone));
    }
  } else {
    body.push(h(Text, { style: styles.sectionTitle, key: 's-details' }, 'Report details'));
    if (report.judge_name) body.push(h(Text, { style: styles.para, key: 'judge' }, `Judge: ${report.judge_name}`));
    if (report.judge_notes) body.push(h(Text, { style: styles.para, key: 'jn' }, `Judge notes: ${report.judge_notes}`));
    if (report.action_items) body.push(h(Text, { style: styles.para, key: 'ai' }, `Action items: ${report.action_items}`));
    if (report.red_flags) body.push(h(Text, { style: styles.para, key: 'rf' }, `Red flags: ${report.red_flags}`));
    if (report.raw_notes) body.push(h(Text, { style: styles.para, key: 'rn' }, report.raw_notes));
  }

  // Footer: per diem name + bar number + signature line + confidentiality.
  body.push(
    h(
      View,
      { style: styles.sigLine, key: 'sig', wrap: false },
      h(Text, {}, profile?.full_name || 'Per Diem Attorney'),
      h(Text, { style: styles.brandSub }, barLine),
      h(Text, { style: styles.brandSub }, 'Signature: ______________________________')
    )
  );

  body.push(
    h(
      Text,
      { style: styles.footer, fixed: true, key: 'footer' },
      'CONFIDENTIAL — This report is prepared for the retaining attorney and may contain privileged attorney work product. ' +
        'Generated via Benchline.'
    )
  );

  return h(Document, {}, h(Page, { size: 'LETTER', style: styles.page }, ...body)) as React.ReactElement<DocumentProps>;
}

export async function generateReportPDF(
  report: OutcomeReport,
  appearance: Appearance,
  profile: Profile | null
): Promise<Buffer> {
  const doc = buildReportDocument(report, appearance, profile);
  return renderToBuffer(doc);
}
