import { describe, it, expect } from 'vitest';
import { generateICS, type IcsAppearance } from '@/lib/calendar/ics';

const base: IcsAppearance = {
  id: 'abc-123',
  case_caption: 'Smith v. Jones',
  court_name: 'Supreme Court',
  court_address: '60 Centre St',
  borough: 'manhattan',
  appearance_date: '2026-07-15', // July -> EDT (UTC-4)
  appearance_time: '09:30',
  appearance_type: 'conference',
  case_index_number: '123456/2026',
  instructions: 'Bring the motion papers; meet counsel at 9:15.',
};

describe('generateICS', () => {
  it('emits a well-formed VCALENDAR/VEVENT', () => {
    const ics = generateICS(base);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('UID:appearance-abc-123@benchline.app');
    expect(ics).toContain('VERSION:2.0');
  });

  it('uses CRLF line endings', () => {
    const ics = generateICS(base);
    expect(ics).toContain('\r\n');
    expect(ics.endsWith('\r\n')).toBe(true);
  });

  it('converts Eastern wall-clock to UTC (EDT in July = +4h)', () => {
    const ics = generateICS(base);
    // 09:30 EDT -> 13:30 UTC
    expect(ics).toContain('DTSTART:20260715T133000Z');
    // default 60-minute duration
    expect(ics).toContain('DTEND:20260715T143000Z');
  });

  it('converts Eastern wall-clock to UTC (EST in January = +5h)', () => {
    const ics = generateICS({ ...base, appearance_date: '2026-01-15', appearance_time: '09:30' });
    expect(ics).toContain('DTSTART:20260115T143000Z');
  });

  it('escapes commas and semicolons in text fields', () => {
    const ics = generateICS(base);
    // instructions contains a semicolon and the location has commas
    expect(ics).toContain('\\;');
    expect(ics).toMatch(/LOCATION:Supreme Court\\,/);
  });

  it('includes the case caption in the summary', () => {
    const ics = generateICS(base);
    expect(ics).toContain('SUMMARY:Conference: Smith v. Jones');
  });

  it('includes a 2-hour reminder alarm', () => {
    const ics = generateICS(base);
    expect(ics).toContain('BEGIN:VALARM');
    expect(ics).toContain('TRIGGER:-PT2H');
  });

  it('omits optional lines when fields are missing', () => {
    const minimal: IcsAppearance = {
      id: 'x',
      case_caption: 'A v. B',
      court_name: 'Court',
      appearance_date: '2026-03-10',
      appearance_time: '10:00',
    };
    const ics = generateICS(minimal);
    expect(ics).not.toContain('DESCRIPTION:Index');
    expect(ics).toContain('SUMMARY:Court appearance: A v. B');
  });
});
