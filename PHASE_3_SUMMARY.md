# Phase 3 — Communication & Polish Layer

Branch: `feat/phase-3-comms-polish` (based on `feat/phase-2-trust-safety`).

Seven features bringing Benchline to competitive parity with CourtGigs and
AppearMe. Each is its own logical commit, building on the Phase 1 money/state
machine/audit infrastructure and the Phase 2 trust & safety layer (extended,
not modified). New migrations run `016`–`019`.

All new API routes are Zod-validated; all new tables have RLS; appearance
status changes go through the state machine; TypeScript is strict (no `any`).

---

## Feature 1 — In-app messaging (per appearance)

- **Migration `016_messages.sql`** — `messages` table (appearance_id, sender_id,
  body, attachments JSONB, read_at). RLS: only the appearance poster/claimer may
  SELECT/INSERT (EXISTS against `appearances`). Index on `(appearance_id,
  created_at DESC)`. Adds `message_received` notification type. Enables Supabase
  Realtime on the table. Private storage bucket `appearance-attachments` with
  folder-per-user upload RLS and involved-party read RLS.
- **`components/appearances/message-thread.tsx`** — realtime thread (postgres
  changes subscription), composer with file attachments, signed-URL downloads,
  Cmd/Ctrl+Enter to send. Rendered on the appearance detail page only after the
  appearance is claimed, for the poster and claimer.
- **Route** — `POST /api/messages/send` (Zod; verifies the caller is an involved
  party). Inserts a `message_received` notification + transactional email; audits
  `message.sent` with attachment count only (never the body).

## Feature 2 — Resend transactional emails

- **`lib/email/client.ts`** — lazy Resend client; degrades to a no-op when
  `RESEND_API_KEY` is unset.
- **`lib/email/templates.ts`** — dependency-free HTML templates (welcome,
  appearance_claimed, check_in, report_submitted, payment_released,
  auto_release_warning, review_received, verification_approved/rejected,
  insurance_expiring, dispute_update, message_received) with a generic fallback.
- **`lib/email/send-for-notification.ts`** — maps an in-app notification type to
  a template and sends. **Never throws**: on any failure it logs `email.send_failed`
  to `audit_log` and returns false, so the user-facing transaction is unaffected.
- Wired into every existing notification insertion point (claim, check-in, report
  submit, payment release, verification review) plus a `POST /api/email/welcome`
  called from the signup form.

## Feature 3 — Twilio day-of SMS reminders

- **`lib/sms/client.ts`** — lazy Twilio client; `sendSms()` never throws and
  no-ops when unconfigured.
- **Migration `017_phone_verification.sql`** — `profiles.phone_verified` +
  `phone_verified_at`; `phone_verification_codes` table (service-role only, no
  permissive RLS policies). Codes are single-use and short-lived (10 min).
- **Routes** — `POST /api/phone/send-code` (generates + texts a 6-digit code),
  `POST /api/phone/verify-code` (consumes the most recent valid code, sets
  `phone_verified`). UI card in Settings.
- **Cron** — `GET /api/cron/day-of-reminders` (CRON_SECRET bearer; scheduled
  hourly 6–10am ET in `vercel.json`). Texts the claimed per diem for appearances
  dated today within the next 4 hours. **Only texts `phone_verified = true`
  users** and dedups via an `sms.day_of_reminder` audit-log check so a number is
  never texted twice for the same appearance.

## Feature 4 — ICS calendar export

- **`lib/calendar/ics.ts`** — pure `generateICS()` (RFC 5545: CRLF endings,
  75-octet line folding, text escaping, a `-PT2H` VALARM). Converts the
  appearance's Eastern local date/time to UTC stamps with manual DST handling.
  Unit-tested (`lib/__tests__/ics.test.ts`, 8 tests).
- **Route** — `GET /api/appearances/[id]/calendar.ics` (involved parties only;
  Next 16 awaited `params`). "Add to calendar" button on the detail page.

## Feature 5 — Branded PDF report export

- **`lib/reports/pdf.ts`** — `@react-pdf/renderer` via `React.createElement`
  (stays a plain `.ts` module, unit-testable). Header (Benchline + case
  metadata), structured AI body (or raw-field fallback), footer with per diem
  name, NY bar number, signature line, and a confidentiality notice.
  `buildReportDocument()` is exported for structural tests
  (`lib/__tests__/pdf.test.ts`, 5 tests); `generateReportPDF()` returns a Buffer.
- **Route** — `GET /api/reports/[id]/pdf` (involved parties only; awaited
  `params`). "Download branded PDF" button on the report card.

## Feature 6 — Dispute workflow

- **Migration `018_disputes.sql`** — `disputes` table (appearance_id, raised_by,
  against, reason, evidence_urls JSONB, status enum
  `open|in_review|resolved_for_raiser|resolved_for_other|split`,
  resolution_notes, `refund_amount_cents` for splits, resolved_by/at). Adds
  `dispute_update` notification type. RLS: involved parties + admins SELECT;
  raiser INSERT; admins UPDATE.
- **State machine** (`lib/appearances/state-machine.ts`, extended additively) —
  new events `raise_dispute` (`in_progress`/`completed` → `disputed`),
  `resolve_dispute_for_raiser` (→ `cancelled`), `resolve_dispute_for_other`
  (→ `completed`), `resolve_dispute_split` (→ `completed`). The legacy generic
  `dispute`/`resolve_dispute`/`refund` events are untouched (27 existing tests
  still pass).
- **Routes**
  - `POST /api/disputes/raise` — Zod; involved-party check; enforces the **7-day
    window** for already-completed appearances; transitions via `raise_dispute`;
    inserts the dispute row; notifies + emails the counterparty.
  - `POST /api/admin/disputes/resolve` — admin gate; per-decision Stripe money
    movement inside the state-machine side effect (idempotency keys throughout):
    - **for_raiser** — if funds are still authorized (manual-capture, not yet
      captured) the PaymentIntent is **cancelled** (void, no charge); if already
      captured, the full pay_rate is **refunded**. Appearance → cancelled,
      payment_status → refunded.
    - **for_other** — capture (if needed) and **transfer** the full pay_rate to
      the per diem's Connect account. Appearance → completed, released.
    - **split** — capture, **refund** the admin-set `refundAmountCents` to the
      litigator, **transfer** the remainder to the per diem. (Refund amount is
      validated ≤ pay_rate.)
- **UI** — `/appearances/[id]/dispute` (raise form), `/admin/disputes` (admin
  resolution queue with notes + split-amount input). "Raise a dispute" link on
  the detail page for involved parties on in_progress/completed appearances; a
  "Disputes" link in the admin sidebar.

## Feature 7 — Insurance referral links

- **Migration `019_referral_clicks.sql`** — `referral_clicks` table (user_id
  nullable, partner, source). RLS: users SELECT own, admins SELECT all; inserts
  are service-role only.
- **`lib/insurance-partners.ts`** — ALPS, Embroker, USI Affinity with
  **placeholder** URLs (see below).
- **Route** — `GET /r/insurance/[partner]` (awaited `params`) logs the click
  best-effort (never blocks) then 302s to the partner. Optional `?source=`.
- **UI** — `components/insurance/referral-card.tsx` on the earnings page (three
  CTAs, `rel="noopener noreferrer sponsored"`, `source=earnings`).

---

## Environment variables

Already appended to `.env.example`. All optional locally — the related feature
degrades to a no-op when unset.

```
# Transactional email (Resend). EMAIL_FROM must use a verified sending domain.
RESEND_API_KEY=
EMAIL_FROM=Benchline <hello@benchline.app>

# Twilio SMS (day-of reminders + phone verification). E.164 from-number.
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=

# Used by the email/SMS links (defaults to https://benchline.app).
NEXT_PUBLIC_APP_URL=

# Cron auth (already present from Phase 1) — protects the day-of-reminders job.
CRON_SECRET=
```

## Sender / provider setup

- **Resend** — verify the sending domain in the Resend dashboard, then set
  `EMAIL_FROM` to an address on that domain. Without `RESEND_API_KEY`, all
  emails silently no-op (no errors surfaced to users).
- **Twilio** — provision an SMS-capable number; set the three `TWILIO_*` vars.
  `TWILIO_FROM_NUMBER` must be E.164 (e.g. `+12125550100`). Day-of SMS only goes
  to users who completed phone verification in Settings.
- **Supabase** — run migrations `016`–`019`. Realtime must be enabled for the
  `messages` table (the migration's `ALTER PUBLICATION` handles it). Create the
  `appearance-attachments` storage bucket (the migration defines its policies).

## Partner referral URL placeholders

`lib/insurance-partners.ts` ships placeholder destinations — **replace with the
signed affiliate/referral links (with tracking params) before launch**:

| Partner       | Slug          | Placeholder URL                          |
| ------------- | ------------- | ---------------------------------------- |
| ALPS          | `alps`        | `https://www.alpsinsurance.com/`         |
| Embroker      | `embroker`    | `https://www.embroker.com/`              |
| USI Affinity  | `usi-affinity`| `https://www.mybarinsurance.com/`        |

## Testing checklist

- [x] `npx vitest run` — 63 tests pass (state-machine 27, conflict 8, pdf 5,
      redact 7, ics 8, pricing 8).
- [x] `npx tsc --noEmit` — clean.
- [x] `npx eslint` — clean on new files.
- [x] `npm run build` — succeeds (requires `NEXT_PUBLIC_SUPABASE_URL` /
      `NEXT_PUBLIC_SUPABASE_ANON_KEY` to be set, even to placeholders, for static
      prerender — a pre-existing project condition, not introduced here).
- [ ] Manual: send a message between poster and claimer; confirm realtime + email.
- [ ] Manual: verify a phone number, then trigger the day-of cron.
- [ ] Manual: download an ICS and a branded PDF.
- [ ] Manual: raise a dispute and resolve it three ways (verify Stripe refund /
      transfer / split in test mode).
- [ ] Manual: click an insurance CTA; confirm a `referral_clicks` row + redirect.

## Decisions worth a reviewer's eye

- **Dispute money movement keys off live PaymentIntent status** (`requires_capture`
  vs captured) rather than the local `payment_status`, so a `for_raiser`
  resolution voids an uncaptured hold instead of refunding a charge that never
  landed. All Stripe calls use deterministic idempotency keys.
- **State machine extended additively** — the four new dispute events coexist
  with the legacy `dispute`/`resolve_dispute`/`refund` events; no existing
  transition or test was changed.
- **`lib/insurance-partners.ts`** lives at `lib/` (not `lib/constants/`) because
  `lib/constants.ts` already exists as a file and a sibling directory of the same
  name would be confusing. URLs are placeholders pending partner agreements.
- **Email/SMS never block transactions** — failures are logged to `audit_log`
  and swallowed; this is intentional per the brief.
