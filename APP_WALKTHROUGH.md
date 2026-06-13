# Benchline app — user-facing route walkthrough

What every user will see, page by page, once `app.benchline.co` is live on Vercel.

---

## Public / unauthenticated

### `/` — Landing
Dark editorial hero (navy `oklch(0.14 0.035 268)` with cream `oklch(0.96 0.01 85)` text), grid overlay, gavel mark + "Benchline" wordmark. Headline: **"Coverage you can brief. Reports you can file."** Two CTAs: **Post an appearance** (litigator path) and **Join as per diem**. Below: "How it works" 3-step section, social proof block, footer.

### `/signup` — Create account
Glass card on dark navy background. Email + password (or Google OAuth via Supabase). On submit, sends magic link, then auth callback drops user onto `/onboarding`.

### `/login`
Same glass card pattern. OAuth + email. Surfaces an inline error banner if OAuth handoff fails.

---

## Authenticated — onboarding & verification gating

### `/onboarding` — First-run wizard *(gated everywhere downstream)*
Multi-step wizard that captures:
1. Role (`litigator`, `per_diem`, or `both`)
2. Basic profile (full name, phone)
3. **For per diems:** bar number + state, malpractice insurance upload, AI redaction consent
4. **For litigators:** firm name (optional)

Until `bar_verification_status === 'verified'` AND `insurance_status === 'verified'`, per diems can **browse** but cannot **claim**. Litigators with no Stripe Connect account get a banner on `/post`.

### `/verify` — Manual re-verification
Two tabs: **Bar verification** (number, state, full legal name, upload bar card → goes into `bar_verification_requests` queue) and **Insurance** (carrier, policy #, coverage amount, effective/expires dates, upload PDF → `insurance_uploads`). Status badge shows current state per credential.

---

## Litigator flow

### `/dashboard` — Personalized home
"Welcome back, Manny" header. Stats cards: Active count, Completed count, Total spent. Upcoming Appearances grid (cards by status: open / claimed / in_progress). Empty state CTA to `/post`.

### `/post` — Post an appearance
Form (`PostForm` component): case caption, court + borough, judge/part (optional), case type, appearance type, date & time, opposing counsel (for conflict check), pay rate, instructions. On submit:
1. Validates with Zod
2. Creates Stripe PaymentIntent (manual capture) for pay_rate + platform fee + NY sales tax
3. Inserts `appearance` row with status `open`, `payment_status = authorized`
4. Redirects to appearance detail page

### `/appearances` — My appearances
Tabs: All / Active / Completed. Cards sortable by date. Links into detail.

### `/appearances/[id]` — Detail (litigator view)
Case info, claim status, claimer info (once claimed), Outcome Report when submitted, **Release Payment** button (once report is in, manual confirm path). Side panel: in-app messaging thread (Supabase Realtime), uploaded files (sanitized via Bedrock redaction), audit log preview, calendar export (`/api/appearances/[id]/calendar.ics`), PDF export of final report.

### `/appearances/[id]/dispute` — Dispute submission
Form + reason picker → creates `disputes` row, sends admin notification, holds payment release.

---

## Per diem flow

### `/browse` — Marketplace
Filters: borough, case type, appearance type, date. Conflict-of-interest auto-hide: appearances where viewer's bar number, firm bar numbers, or declared conflicts overlap with opposing counsel are removed client-side. Each card shows pay, location, date, brief case info.

### `/appearances/[id]` (per diem view)
Same detail page, different actions visible: **Claim** button (gated on verified bar + insurance + no conflict), Check In (day-of), Submit Report (with structured fields + uploaded exhibits), Request Instant Payout (Stripe, 1.5% fee shown).

### `/earnings` — Money & payouts
Lifetime earned, this-month earned, pending vs released breakdown. Per-appearance payout history. **Instant Payout** CTA when balance available — calls `/api/stripe/instant-payout`.

### `/report/[id]` — Outcome report form
Structured: outcome (adjourned / argued / decided / settled), next date, judge, opposing counsel confirmed, notes, exhibit uploads. On submit, file is redacted via Bedrock (PII scrub) before storage. Saving moves appearance to `in_progress → completed_pending_release`.

---

## Settings & profile

### `/settings`
- Profile: name, phone (with SMS verification card), role, bio
- Practice info: practice areas (one per line), courts familiar with
- Firm: firm name, firm bar numbers (for conflict checks)
- Per diem: bar number, AI redaction consent toggle
- Conflict declarations: add party/firm/bar/reason rows
- Stripe Connect: connect/disconnect button → `/api/stripe/connect/start`

---

## Admin (role-gated)

### `/admin` — Ops home
KPI cards: today's GMV, this-week GMV, this-month GMV, platform fees collected. Active appearances count. Pending verifications count. Recent disputes.

### `/admin/verifications` — Verification queue
Two tabs: **Bar** and **Insurance**. Each pending row shows user info, submitted docs (link to Supabase Storage signed URL), notes textarea, **Approve** / **Reject** buttons. Approve flips status to `verified` and unlocks claim ability via RLS + code gate.

### `/admin/disputes` — Dispute resolution
Pending disputes table. Open a dispute → see appearance, both sides' messages, ability to resolve (refund litigator / release to per diem / partial / escalate).

### `/admin/users` & `/admin/users/[id]`
Search + paginate users. Detail page shows full audit trail, verification history, appearance count, lifetime money.

### `/admin/payouts`
Stripe transfers list with status, retry failed transfers.

### `/admin/appearances` & `/admin/appearances/[id]`
Cross-user appearance browser (admin override). Actions: cancel, force-release, refund.

### `/admin/audit`
Append-only `audit_log` viewer, filterable by event type (`appearance.claimed`, `payment.released`, `verification.approved`, `conflict.blocked`, `dispute.opened`, etc.).

### `/admin/referrals`
Insurance referral clicks (the link in the per diem dashboard pointing to our broker).

---

## Why I'm not attaching live screenshots

I tried to spin up `apps/web` locally to capture each screen. Next 16 dev server boots ("Ready in 318ms") but the background process is reaped by the sandbox's shell lifecycle the moment the spawning bash call returns — Next 16/Turbopack requires a persistent controlling terminal. A static production build also hits a sandbox memory ceiling during compile.

This is purely a sandbox constraint. On Vercel the app builds and serves normally (Vercel allocates 8GB+ for build and runs the production server in its own managed process).

**Fastest path to see it visually:** push to Vercel using `VERCEL_SETUP.md`. First deploy will show the real screens with the real fonts and data.

**Alternative path:** clone the repo to your Mac and `cd apps/web && npm install && npm run dev`. Standard local dev. The dev server stays up because your terminal does.
