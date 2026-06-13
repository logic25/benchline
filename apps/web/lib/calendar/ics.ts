import type { Appearance } from '@/lib/types';

// Minimal, dependency-free RFC 5545 generator for a single appearance event.
// Produces a VCALENDAR with one VEVENT that calendar apps (Google, Apple,
// Outlook) accept.

export interface IcsAppearance {
  id: string;
  case_caption: string;
  court_name: string;
  court_address?: string | null;
  borough?: string | null;
  appearance_date: string; // YYYY-MM-DD
  appearance_time: string; // HH:MM[:SS]
  appearance_type?: string | null;
  case_index_number?: string | null;
  instructions?: string | null;
}

const DEFAULT_DURATION_MIN = 60;

// Escapes TEXT values per RFC 5545 §3.3.11 (backslash, semicolon, comma, newline).
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

// Folds a content line to <=75 octets per RFC 5545 §3.1 (continuation lines
// start with a single space). We fold on character count, which is safe for the
// ASCII content we emit.
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let idx = 0;
  parts.push(line.slice(0, 75));
  idx = 75;
  while (idx < line.length) {
    parts.push(' ' + line.slice(idx, idx + 74));
    idx += 74;
  }
  return parts.join('\r\n');
}

// Formats a Date as a UTC timestamp: YYYYMMDDTHHMMSSZ.
function toUtcStamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

// Treats the stored date+time as US Eastern wall-clock (NY courts) and converts
// to UTC. NY is UTC-5 (EST) or UTC-4 (EDT); we approximate DST as US rules
// (second Sunday in March to first Sunday in November). This keeps the event at
// the correct local courthouse time without pulling in a tz library.
function easternToUtc(dateStr: string, timeStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  const tm = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(timeStr);
  const hh = tm ? Number(tm[1]) : 0;
  const mm = tm ? Number(tm[2]) : 0;
  const ss = tm && tm[3] ? Number(tm[3]) : 0;
  const offsetHours = isEasternDst(y, m, d) ? 4 : 5;
  // Build the UTC instant for the given Eastern wall-clock time.
  return new Date(Date.UTC(y, m - 1, d, hh + offsetHours, mm, ss));
}

function isEasternDst(year: number, month: number, day: number): boolean {
  // month is 1-12. DST: 2nd Sunday of March .. 1st Sunday of November.
  const secondSundayMarch = nthSunday(year, 3, 2);
  const firstSundayNov = nthSunday(year, 11, 1);
  const date = new Date(Date.UTC(year, month - 1, day));
  const start = new Date(Date.UTC(year, 2, secondSundayMarch));
  const end = new Date(Date.UTC(year, 10, firstSundayNov));
  return date >= start && date < end;
}

function nthSunday(year: number, month1: number, n: number): number {
  const firstDow = new Date(Date.UTC(year, month1 - 1, 1)).getUTCDay();
  const firstSunday = ((7 - firstDow) % 7) + 1;
  return firstSunday + (n - 1) * 7;
}

// Generates the ICS document for one appearance. `organizerProfile` (per diem or
// poster) is optional and only affects the SUMMARY prefix when present.
export function generateICS(appearance: IcsAppearance, opts?: { organizerName?: string }): string {
  const start = easternToUtc(appearance.appearance_date, appearance.appearance_time);
  const end = new Date(start.getTime() + DEFAULT_DURATION_MIN * 60 * 1000);
  const now = new Date();

  const summaryParts = [appearance.appearance_type ? capitalize(appearance.appearance_type) : 'Court appearance', appearance.case_caption];
  const summary = summaryParts.filter(Boolean).join(': ');

  const descLines = [
    appearance.case_index_number ? `Index: ${appearance.case_index_number}` : '',
    appearance.appearance_type ? `Type: ${appearance.appearance_type}` : '',
    opts?.organizerName ? `Covering attorney: ${opts.organizerName}` : '',
    appearance.instructions ? `Instructions: ${appearance.instructions}` : '',
  ].filter(Boolean);
  const description = descLines.join('\n');

  const location = [appearance.court_name, appearance.court_address, appearance.borough ? capitalize(appearance.borough.replace(/_/g, ' ')) : '']
    .filter(Boolean)
    .join(', ');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Benchline//Appearance//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:appearance-${appearance.id}@benchline.app`,
    `DTSTAMP:${toUtcStamp(now)}`,
    `DTSTART:${toUtcStamp(start)}`,
    `DTEND:${toUtcStamp(end)}`,
    `SUMMARY:${escapeText(summary)}`,
    description ? `DESCRIPTION:${escapeText(description)}` : '',
    location ? `LOCATION:${escapeText(location)}` : '',
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(summary)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return lines.map(foldLine).join('\r\n') + '\r\n';
}

function capitalize(s: string): string {
  return s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// Convenience: maps a full Appearance row to the ICS input shape.
export function appearanceToIcs(a: Appearance): IcsAppearance {
  return {
    id: a.id,
    case_caption: a.case_caption,
    court_name: a.court_name,
    court_address: a.court_address,
    borough: a.borough,
    appearance_date: a.appearance_date,
    appearance_time: a.appearance_time,
    appearance_type: a.appearance_type,
    case_index_number: a.case_index_number,
    instructions: a.instructions,
  };
}
