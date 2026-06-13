# Vercel Two-Project Setup

This monorepo deploys as **two independent Vercel projects** from a single GitHub repo (`logic25/benchline`), each pointed at a different folder via Root Directory.

| Project              | Root Directory     | Production Domain          | Preview Domain                    |
| -------------------- | ------------------ | -------------------------- | --------------------------------- |
| `benchline-web`      | `apps/web`         | `app.benchline.co`         | `benchline-web-*.vercel.app`      |
| `benchline-marketing`| `apps/marketing`   | `benchline.co` + `www`     | `benchline-marketing-*.vercel.app`|

Both projects watch the same `master` branch. Vercel intelligently rebuilds only the project whose files actually changed (thanks to Ignored Build Step — see Step 4 below).

---

## Step 1 — Create the Marketing project first

Marketing is the simpler one (static export, no env vars, no cron jobs). Do this first to validate the wiring.

1. Go to **vercel.com → Add New → Project**
2. **Import Git Repository** → pick `logic25/benchline`
3. On the Configure screen:
   - **Project Name:** `benchline-marketing`
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** click **Edit** → enter `apps/marketing` → Continue
   - **Build & Output Settings:** leave defaults (the `next.config.ts` handles static export)
   - **Environment Variables:** none required for marketing
4. Click **Deploy**
5. Once it succeeds, go to **Settings → Domains**:
   - Add `benchline.co` (apex)
   - Add `www.benchline.co` (redirect to apex)
   - Follow Vercel's DNS instructions at your registrar (GoDaddy):
     - `A` record for apex → `76.76.21.21`
     - `CNAME` for `www` → `cname.vercel-dns.com`

---

## Step 2 — Create the Web (main app) project

1. **vercel.com → Add New → Project → Import** `logic25/benchline` again
2. On the Configure screen:
   - **Project Name:** `benchline-web`
   - **Framework Preset:** Next.js
   - **Root Directory:** click **Edit** → enter `apps/web` → Continue
   - **Environment Variables:** see Step 3
3. Don't deploy yet — fill env vars first, then deploy

---

## Step 3 — Environment variables for `benchline-web`

Paste these into Vercel's **Environment Variables** screen during project creation (or **Settings → Environment Variables** after). Set them for **Production** and **Preview**.

### Required for any deploy to render

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
NEXT_PUBLIC_APP_URL=https://app.benchline.co
CRON_SECRET=<generate: openssl rand -hex 32>
FEE_MODE=flat
```

### Stripe (needed for posting/claiming/payouts)

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

After first deploy, configure the Stripe webhook endpoint at:
`https://app.benchline.co/api/stripe/webhook`
Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `transfer.created`, `account.updated`, `charge.dispute.created`

### Email + SMS (transactional)

```
RESEND_API_KEY=re_...
EMAIL_FROM=Benchline <hello@benchline.co>
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1...
```

### AI (Bedrock for redaction; Anthropic for direct calls if used)

```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
BEDROCK_MODEL_ID=anthropic.claude-sonnet-4-5-20250929-v2:0
ANTHROPIC_API_KEY=sk-ant-...
```

### Observability + rate limiting

```
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=<for source map upload>
SENTRY_ORG=<org-slug>
SENTRY_PROJECT=benchline-web
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

### Supabase → Authentication → URL Configuration

Before first auth attempt, add these to **Supabase dashboard → Authentication → URL Configuration**:

- **Site URL:** `https://app.benchline.co`
- **Redirect URLs (allowlist):**
  - `http://localhost:3000/auth/callback`
  - `https://app.benchline.co/auth/callback`
  - `https://benchline-web-*.vercel.app/auth/callback` (preview deploys)

---

## Step 4 — Skip unnecessary builds (Ignored Build Step)

Without this, every push to master rebuilds both projects even when only one changed. Add an Ignored Build Step to each project.

**For `benchline-web`:**

1. Settings → Git → **Ignored Build Step**
2. Paste:
   ```bash
   git diff HEAD^ HEAD --quiet -- apps/web/ ; if [ $? -eq 1 ]; then exit 1; else exit 0; fi
   ```
   (exits 1 = build; exits 0 = skip)

**For `benchline-marketing`:**

```bash
git diff HEAD^ HEAD --quiet -- apps/marketing/ ; if [ $? -eq 1 ]; then exit 1; else exit 0; fi
```

---

## Step 5 — Deploy `benchline-web` and add domain

1. Trigger a deploy (push or **Redeploy** button)
2. Watch the build log for missing env vars or migration errors
3. After first successful deploy, **Settings → Domains** → add `app.benchline.co`:
   - At GoDaddy, add a `CNAME` record: `app` → `cname.vercel-dns.com`

---

## Step 6 — Configure Stripe webhook + Vercel Cron secret

1. **Stripe Dashboard → Developers → Webhooks → Add endpoint**
   - URL: `https://app.benchline.co/api/stripe/webhook`
   - Copy the signing secret → paste into `STRIPE_WEBHOOK_SECRET` in Vercel
2. The cron jobs in `apps/web/vercel.json` run automatically every:
   - 15 min: `/api/cron/auto-release` (release payment after 24h)
   - daily 6:17 UTC: `/api/cron/insurance-expiry`
   - hourly 11–15 UTC: `/api/cron/day-of-reminders`
   - These hit your `CRON_SECRET`-protected routes automatically.

---

## Checklist — go-live order

1. ☐ Create `benchline-marketing` project (Root: `apps/marketing`)
2. ☐ Verify marketing deploys at `*.vercel.app` preview URL
3. ☐ Attach `benchline.co` + `www` to marketing
4. ☐ Create Supabase production project, run all migrations in `apps/web/supabase/migrations/`
5. ☐ Create Stripe Connect platform account, enable Express accounts + Instant Payouts
6. ☐ Create Resend, Twilio, Upstash, Sentry, AWS Bedrock accounts
7. ☐ Create `benchline-web` project (Root: `apps/web`) with all env vars
8. ☐ Deploy `benchline-web`, attach `app.benchline.co`
9. ☐ Add Stripe webhook endpoint, paste signing secret back into Vercel, redeploy
10. ☐ Add Supabase auth redirect URLs
11. ☐ Smoke test: sign up, complete onboarding wizard, post one appearance, claim, capture report, release payment

---

## Notes

- **Both projects share the same repo, but each only sees its own subtree** thanks to Root Directory. A push that only changes `apps/web/` will skip the marketing build (and vice versa) once the Ignored Build Step is in place.
- **Local dev:** run `cd apps/web && npm run dev` or `cd apps/marketing && npm run dev`. Each has its own `package.json` and `node_modules`.
- **Shared packages later:** when you need shared code (brand tokens, legal copy, types), add a `packages/legal-docs` or `packages/brand` directory and reference it from both apps via npm workspaces.
