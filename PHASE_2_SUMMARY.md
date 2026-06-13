# Phase 2 — Trust & Safety Layer

Branch: `feat/phase-2-trust-safety` (based on `feat/phase-1-money-state`).

Four features, each on its own logical commit, all building on the Phase 1
money/state-machine/audit infrastructure (extended, not modified).

---

## Feature 1 — Automated bar verification

- **Migration `012_bar_verification.sql`**
  - `profiles`: adds `is_admin`, `bar_verification_status` enum
    (`unverified|pending|verified|rejected|expired`), `bar_verified_at`,
    `bar_verification_method`, `bar_verification_notes`, `bar_expires_at`.
    Legacy `bar_verified = true` rows migrate to `verified` (1-year expiry).
  - New table `bar_verification_requests` (user-submitted, admin-reviewed) with RLS:
    users insert/select their own; admins select all + update.
  - `is_admin(uid)` SECURITY DEFINER helper (avoids recursive profile RLS).
  - Private storage bucket `verification-docs` (users write only under
    `{user_id}/…`; admins read all).
  - Appearance RLS gates: only bar-verified users may INSERT (post) or take the
    open→claimed UPDATE path.
- **`lib/verification/oca-lookup.ts`** — `lookupAttorney()` stub returning
  `source: 'manual'` (Phase 3 will wire the live NY OCA registration lookup).
- **UI** — `/verify` (submit bar request + evidence upload), `/admin/verifications`
  (review queue, gated on `is_admin`). Sidebar gains a Verification link and an
  Admin Review link for admins.
- **Routes** — `POST /api/verification/submit`, `POST /api/admin/verification/review`
  (Zod-validated). The claim route also enforces the bar gate explicitly because
  the state machine runs under the service role (bypasses RLS).

## Feature 2 — Insurance upload + verification

- **Migration `013_insurance_verification.sql`**
  - `profiles`: `insurance_status` enum (`none|pending|verified|expired`),
    `insurance_verified_at`, `insurance_expires_at`, `insurance_carrier`,
    `insurance_policy_number`, `insurance_coverage_amount_cents`.
  - New table `insurance_uploads` (admin-reviewed) with the same RLS shape.
  - Private storage bucket `insurance-docs` (same folder-per-user RLS).
  - Appearance claim RLS additionally requires `insurance_status = 'verified'`.
- **Route** — `POST /api/verification/insurance/submit` (Zod). The shared admin
  review route handles `kind: 'insurance'`.
- **Cron** — `GET /api/cron/insurance-expiry` (daily, `CRON_SECRET` bearer): flips
  lapsed policies to `expired` and notifies at 30 days before / on expiry / 7 days
  after (de-duplicated within a 20h window). Wired in `vercel.json`.
- **UI** — `/verify` insurance card; `/admin/verifications` insurance tab.
- The claim route enforces the insurance gate explicitly (service-role bypass).

## Feature 3 — Conflict-of-interest check

- **Migration `014_conflict_check.sql`**
  - `appearances`: `opposing_counsel_name`, `opposing_counsel_firm`,
    `opposing_counsel_bar_number`.
  - `profiles`: `firm_name`, `firm_bar_numbers TEXT[]`.
  - New table `conflict_declarations` (users manage their own; RLS select/insert/delete).
- **`lib/conflict/check.ts`** — `hasConflict(supabase, userId, appearanceId)` matches
  opposing counsel against the user's own/firm bar numbers, name, firm, and declared
  conflict parties (case/whitespace-insensitive).
- **Claim route** — calls `hasConflict` **before** the state-machine transition;
  on a match returns **403 + reason** and writes a `conflict.blocked` audit event.
- **UI** — `/post` adds opposing-counsel fields (name required, for screening);
  `/browse` hides conflicted appearances client-side; `/settings` manages conflict
  declarations and firm bar numbers.
- **Tests** — `lib/__tests__/conflict-check.test.ts` (8 cases).

## Feature 4 — AWS Bedrock ZDR migration + AI redaction

- Adds dependency `@aws-sdk/client-bedrock-runtime`.
- **`lib/ai/bedrock-client.ts`** — `BedrockRuntimeClient` (region `AWS_REGION`,
  default `us-east-1`), `BEDROCK_MODEL` (`BEDROCK_MODEL_ID` or
  `anthropic.claude-sonnet-4-20250514-v1:0`), `invokeClaude(prompt, maxTokens)`.
- **`lib/ai/redact.ts`** — pre-call redaction (case caption→`[CASE]`,
  index→`[INDEX]`, judge→`[JUDGE]`, opposing counsel→`[OPP_COUNSEL_1]`, heuristic
  party names→`[PARTY_n]`) returning redacted text + a placeholder→original
  dictionary; `restore`/`restoreDeep` re-stitch the structured output.
- **`app/api/reports/structure/route.ts`** — now: checks `ai_processing_consent`
  (returns raw notes if opted out / Bedrock unconfigured); otherwise
  redact → Bedrock → Zod-validate → re-stitch → store `ai_structured_report` +
  `ai_redaction_dictionary` server-side (service role). Validation/call failures
  fall back to raw notes and log to `audit_log`.
- **Migration `015_ai_consent.sql`** — `profiles.ai_processing_consent BOOLEAN
  DEFAULT TRUE`; `outcome_reports.ai_redaction_dictionary JSONB`.
- **UI** — `/settings` AI consent toggle with disclosure link.
- **Tests** — `lib/__tests__/redact.test.ts` (7 cases, round-trip).

---

## New environment variables

| Variable | Purpose |
| --- | --- |
| `AWS_REGION` | Bedrock region (default `us-east-1`). |
| `AWS_ACCESS_KEY_ID` | AWS credentials for Bedrock. Server-only. |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials for Bedrock. Server-only. |
| `BEDROCK_MODEL_ID` | Optional override for the Claude model id on Bedrock. |

`CRON_SECRET` (already used by auto-release) also secures the new
insurance-expiry cron. `SUPABASE_SERVICE_ROLE_KEY` remains server-only.

## Bedrock setup

1. In the **us-east-1** AWS console, open **Bedrock → Model access** and request
   access to the Anthropic Claude model matching `BEDROCK_MODEL_ID`.
2. Create an IAM principal with `bedrock:InvokeModel` for that model and set
   `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` (and `AWS_REGION`) in the env.
3. Confirm the model is enabled in the same region as `AWS_REGION`.

## Admin user setup

There is no self-serve admin flow. To grant admin (verification reviewer):

```sql
UPDATE profiles SET is_admin = TRUE WHERE email = 'you@example.com';
```

The admin then sees **Admin Review** in the sidebar and can use `/admin/verifications`.

## Storage buckets

Migrations create two **private** buckets via `storage.buckets` inserts:
`verification-docs` and `insurance-docs`, each with RLS allowing a user to write
only under their own `{user_id}/…` prefix and admins to read all. If your Supabase
project restricts `storage.*` DDL, create the buckets in the dashboard and apply
the object policies from the migrations manually.

## Migrations to apply (in order)

`012_bar_verification.sql` → `013_insurance_verification.sql` →
`014_conflict_check.sql` → `015_ai_consent.sql`.

Note: each adds `notification_type` enum values via `ALTER TYPE … ADD VALUE`;
run each migration in its own transaction (the default for Supabase migration
tooling) so the new value is committed before any later use.

## Testing checklist

- [ ] `npm test` — 50 tests pass (state machine 27, pricing 8, conflict 8, redact 7).
- [ ] `npx tsc --noEmit` clean; `npx eslint` clean (one non-blocking
      exhaustive-deps warning in settings).
- [ ] `next build` succeeds (set dummy `NEXT_PUBLIC_SUPABASE_*` for static gen).
- [ ] Bar: submit at `/verify`; approve at `/admin/verifications`; confirm an
      unverified user cannot post or claim.
- [ ] Insurance: submit + approve; confirm an uninsured per diem cannot claim;
      run the expiry cron and confirm expiry/notifications.
- [ ] Conflict: post with opposing counsel = a per diem's name/firm/bar; confirm
      it is hidden in `/browse` and a direct claim returns 403 with a
      `conflict.blocked` audit row.
- [ ] AI: with consent on and Bedrock configured, submit a report and confirm a
      structured report is stored with names restored and a redaction dictionary;
      toggle consent off and confirm raw notes are returned.
