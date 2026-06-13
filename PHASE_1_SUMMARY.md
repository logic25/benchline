# Benchline — Phase 1: Money, State & Payouts

Branch: `feat/phase-1-money-state`

This phase makes money handling correct and auditable, adds Stripe Instant
Payouts for per diems, and centralizes appearance state transitions behind a
single guarded code path. AI / report-structuring routes were intentionally left
untouched (Phase 2 — AWS Bedrock ZDR migration).

---

## 1. What changed and why

### Fee model (NY RPC 5.4 / NYSBA Op. 1271 vs 1113)
Percentage-of-legal-fee structures are a compliance risk. NYSBA Op. 1271 (2024)
condemned a percentage arrangement; Op. 1113 blessed flat fees. We therefore made
**flat fee the default** and put percentage mode behind a feature flag.

- `lib/pricing.ts` — `computePlatformFee(payRateCents, caseType, isVirtual, override?)`
  - **Flat (default):** virtual $25; in-person standard (civil/commercial/housing) $35;
    in-person specialty (family/criminal/matrimonial/bankruptcy) $50.
  - **Percentage (flagged):** 15% of pay rate, min $20.
  - Controlled by env `FEE_MODE=flat|percentage` (default `flat`).
- The **fee model used is stored on every appearance** (`appearances.fee_model`) for audit.

### Sales tax (NYC 8.875%)
- `sales_tax_cents` is computed as **8.875% of the platform fee only** (never the legal
  fee) and stored. It is **NOT collected yet** — Benchline needs a Certificate of
  Authority first. The math is wired and displayed (labelled "not yet collected").

### Money is always integer cents
- Renamed `appearances.platform_fee` → `platform_fee_cents` (backfilled).
- Added `sales_tax_cents`, `total_charged_cents` (= pay_rate + platform_fee + sales_tax).

### Payment lifecycle + Stripe (separate charges & transfers)
- Post time: `create-payment-intent` **pre-authorizes** the litigator's card with
  `capture_method='manual'`, computing and persisting the authoritative fee/tax and the
  PaymentIntent id.
- Release time (manual confirm or auto-release cron): **capture** the PaymentIntent to the
  platform balance, then **transfer** `pay_rate` to the per diem's Connect account. The
  platform fee + sales tax stays on the platform.
- **Why not destination charges?** The per diem (transfer destination) is unknown at post
  time, and Stripe does not allow setting `transfer_data.destination` after PaymentIntent
  creation (it's create-only; update/capture only accept `transfer_data.amount`). Separate
  charges & transfers is the Stripe-supported pattern for "destination unknown at auth".
  See "Known limitations" for the trade-off.
- **Every Stripe call uses an idempotency key** (`<appearanceId>:<event>`, `payout:<id>`).

### Webhook is the source of truth
- `app/api/stripe/webhook/route.ts` verifies the signature against the raw body and is
  **idempotent**: each event is inserted into `audit_log` keyed by `stripe_event_id`
  (UNIQUE). A duplicate delivery hits the unique constraint and is skipped before any
  mutation. It updates `appearances.payment_status` across the lifecycle and tracks payout
  status. Runs with the **service-role** client (no user session).

### State machine (single source of truth)
- `lib/appearances/state-machine.ts` — `validTransition(from, event)` and
  `performTransition(supabase, id, event, actor, ctx)`. `performTransition`:
  loads the row → validates the event → runs side effects (Stripe) → **guarded** status
  update (`WHERE status = from`, optimistic concurrency) → writes `audit_log`.
- Routes refactored to go through it: `claim`, `check-in`, and release
  (`confirm_completion` / `auto_release`).
- A DB trigger (migration 009) enforces the same transition table as a backstop against
  direct writes, including the 7-day dispute window on completed appearances.
- Note: `refunded` is a **payment_status**, not an appearance status. A refund resolves a
  dispute by moving the appearance to `cancelled` while `payment_status='refunded'`.

### Instant Payouts
- `app/api/stripe/instant-payout/route.ts` — per-diem-initiated. Computes available balance
  (sum of `released` appearances minus prior non-failed payouts), calls
  `stripe.payouts.create({ method: 'instant' })` on the connected account, records the
  payout (`payouts` table). 1.5% fee ($0.50 min) computed and shown in the UI. `GET`
  returns available balance + history for the earnings page.
- `app/earnings/page.tsx` — "Available to withdraw" card, instant-payout button with
  fee/net, payout history.

### Auto-release cron
- `app/api/cron/auto-release/route.ts` — secured by `CRON_SECRET` (Bearer header). Releases
  payments where `auto_release_at < NOW()`, `payment_status='captured'`, `status='in_progress'`,
  and a report exists. `vercel.json` schedules it every 15 minutes.
- `auto_release_at` is set to **NOW() + 24h** by a trigger when the per diem submits their
  outcome report (migration 007).

### Server-side validation
- `lib/validation/schemas.ts` — Zod schemas; every mutating route `safeParse`s its body and
  returns **400** with issues on failure.

---

## 2. Migration order

Run in numeric order (they build on each other):

```
007_payment_status.sql          # payment_status/fee_model enums + columns, auto_release trigger
008_audit_log.sql               # audit_log table (+ stripe_event_id UNIQUE), RLS
009_state_machine_constraints.sql  # is_valid_transition() + BEFORE UPDATE trigger
010_idempotency_keys.sql        # idempotency_keys table, RLS
011_payouts.sql                 # payouts table + payout_status enum, RLS
```

007 renames `platform_fee` → `platform_fee_cents` and backfills, so apply it before any
code that reads the new column.

---

## 3. New env vars

| Var | Where | Purpose |
| --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | server only (local + Vercel) | Webhook, cron, audit-log writes bypass RLS. **Never** expose to client. |
| `CRON_SECRET` | server only (local + Vercel) | Auth for the auto-release cron (`Authorization: Bearer <CRON_SECRET>`). |
| `FEE_MODE` | server (optional) | `flat` (default) or `percentage`. |

All three are documented in `.env.example`.

---

## 4. Stripe dashboard config needed

1. **Connect → Instant Payouts:** enable the Instant Payouts capability for connected
   (Express) accounts. Connected accounts need an eligible debit card / supported bank.
2. **Connect capabilities:** Express accounts are created with `transfers` requested
   (existing). Ensure `transfers` is active so release transfers succeed.
3. **Webhook endpoint:** point at `/api/stripe/webhook` and subscribe to:
   - `payment_intent.amount_capturable_updated`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`
   - `transfer.created`
   - `transfer.reversed`
   - `payout.paid`, `payout.failed`, `payout.canceled`
   - `account.updated`
   Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
4. **Vercel:** set `CRON_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` in project env; the cron in
   `vercel.json` runs every 15 minutes.

---

## 5. Testing checklist

Automated (run `npm test` — 35 tests, all passing):
- State machine: every valid transition, every blocked transition, idempotent replay,
  concurrent-update loss.
- Pricing: flat (virtual/standard/specialty), percentage flag + floor, sales tax, override.

Manual happy path (must still work end-to-end):
- [ ] Post appearance → fee/tax shown (flat) → pre-auth PaymentIntent created
      (`payment_status` → `authorized` via webhook).
- [ ] Per diem claims (status `open → claimed`, audit row written).
- [ ] Per diem checks in (`claimed → in_progress`).
- [ ] Per diem submits report (`auto_release_at` set to +24h).
- [ ] Litigator confirms completion → capture + transfer; `payment_status='released'`,
      `status='completed'`; per diem notified.
- [ ] Per diem sees "Available to withdraw" and runs an instant payout; `payouts` row
      created, fee shown.

Edge cases:
- [ ] Duplicate webhook delivery → second is a no-op (unique `stripe_event_id`).
- [ ] Double-claim race → only one succeeds (guarded update; other gets 409).
- [ ] Release before report submitted → rejected.
- [ ] Invalid transition (e.g. confirm an `open` appearance) → 409.
- [ ] Bad request body → 400 with Zod issues.
- [ ] Cron with wrong/missing `CRON_SECRET` → 401.
- [ ] Instant payout with no available balance → 400.
- [ ] `FEE_MODE=percentage` → 15%/min-$20 fee applied and stored as `fee_model='percentage'`.

---

## 6. Known limitations / deferred

- **Separate charges & transfers (not destination charges):** chosen because the destination
  is unknown at pre-auth and Stripe won't let us set it later. Trade-off: funds land on the
  platform balance first, so Benchline is briefly the merchant of record for the full amount.
  If true destination charges are required, the PaymentIntent must be (re)created at claim
  time once the per diem is known — deferred.
- **`is_virtual` column not added:** the flat fee distinguishes virtual ($25) vs in-person,
  but the schema has no virtual flag. The API currently treats all appearances as in-person
  (the higher, safer fee). Add an `is_virtual` column + post-form toggle in a follow-up.
- **Sales tax computed, not collected:** awaiting Certificate of Authority.
- **`account.updated`** is logged but Connect capability state isn't persisted on the profile.
- **Idempotency_keys table** is created and ready; routes currently rely on Stripe idempotency
  keys + the webhook's `stripe_event_id` uniqueness. Wiring the table into non-Stripe routes
  is a follow-up if needed.
- **A few client-side status writes remain outside `performTransition`:** the detail page's
  cancel button and the report form's `in_progress` set still write status directly. The DB
  trigger (009) keeps these valid, but they don't emit audit rows. Routing them through
  `performTransition` (or server actions) is a small follow-up; cancel is not a money event.
- **Admin audit access:** done via the service role (bypasses RLS); no in-app admin UI yet.
- **AI / report structuring + Bedrock ZDR:** Phase 2 (untouched here).

---

## 7. Files

**New:** `supabase/migrations/007-011`, `lib/pricing.ts`,
`lib/appearances/state-machine.ts`, `lib/validation/schemas.ts`,
`lib/supabase/service.ts`, `lib/stripe/release.ts`,
`app/api/stripe/instant-payout/route.ts`, `app/api/cron/auto-release/route.ts`,
`vercel.json`, `vitest.config.ts`, `lib/__tests__/state-machine.test.ts`,
`lib/__tests__/pricing.test.ts`.

**Modified:** `lib/types.ts`, `lib/constants.ts`,
`app/api/stripe/create-payment-intent/route.ts`, `app/api/stripe/webhook/route.ts`,
`app/api/stripe/release-payment/route.ts`, `app/api/appearances/claim/route.ts`,
`app/api/appearances/check-in/route.ts`, `app/appearances/[id]/page.tsx`,
`app/dashboard/page.tsx`, `app/earnings/page.tsx`,
`components/appearances/post-form.tsx`, `.env.example`, `package.json`.
