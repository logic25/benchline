# Benchline - Product Spec

## What It Is
Two-sided marketplace connecting litigators who need court coverage with per diem attorneys who handle appearances. NYC-only MVP.

## Tech Stack
- **Frontend**: Next.js (App Router, TypeScript) — see repo `package.json` for current major version
- **Database/Auth**: Supabase (Postgres, Auth, Realtime)
- **Payments**: Stripe Connect (escrow pattern)
- **AI**: Claude API (report structuring; orchestration opportunities below)
- **UI**: Tailwind CSS + shadcn/ui
- **Hosting**: Vercel

---

## Features (MVP)

### Authentication & Profiles
- Email/password signup and login
- Role selection: Litigator, Per Diem Attorney, or Both
- NY Bar number collection
- Profile management (name, phone, bio, practice areas, courts familiar, avatar)
- Bar verification (manual for MVP)

### Litigator Flow
1. **Post Appearance** (`/post`)
   - Select borough (Manhattan, Brooklyn, Bronx, Queens, Staten Island)
   - Select court (25 NYC courts pre-loaded)
   - Set date and time
   - Choose case type (civil, criminal, family, housing, commercial)
   - Choose appearance type (adjournment, conference, status call, motion, hearing)
   - Enter case caption and index number
   - Write instructions for the per diem
   - Set pay rate (with suggested ranges per appearance type)
   - See fee breakdown (per diem rate + 15% platform fee)
   - **Payment capture**: charge litigator total (pay + platform fee) and associate payment with appearance (held until release conditions)

2. **Track Appearances** (`/appearances`)
   - Tabbed view: Active, Completed, Posted, Claimed
   - Status badges: Open, Claimed, In Progress, Completed, Disputed, Cancelled

3. **Review Outcome Reports** (`/appearances/[id]`)
   - See per diem structured fields (outcome, dates, judge, notes, action items, red flags)
   - **See AI-generated structured report** (summary, takeaways, next steps, risk, tone) when present; optional copy/export for firm workflow
   - Confirm completion to trigger **payment release** (not only a status change)
   - **Rate and review** the per diem attorney after completion (one review per appearance, updates public rating)

4. **In-app notifications** (throughout)
   - Feed and/or bell: appearance claimed, per diem checked in, report submitted, payment released, review received
   - Read/unread state; deep links to relevant appearance

### Per Diem Flow
1. **Browse Appearances** (`/browse`)
   - Filter by borough, case type, appearance type, date
   - Card grid showing case caption, court, date/time, pay rate
   - Click to view full details

2. **Claim Appearance** (`/appearances/[id]`)
   - View full case details and instructions
   - One-click claim (server-side path so side effects are consistent)
   - **Check-in on day of appearance**: explicit “I’m at the courthouse” action; notifies posting attorney

3. **Submit Outcome Report** (`/report/[id]`)
   - Structured form:
     - Outcome (adjourned, settled, dismissed, granted, denied, default)
     - Next court date
     - Judge name and notes
     - Opposing counsel
     - Action items for posting attorney
     - Red flags or concerns
     - Free-text additional notes
   - AI auto-structures raw notes into professional report; structured output persisted and shown to litigator

4. **Track Earnings** (`/earnings`)
   - Total earned, pending payment (e.g. report submitted awaiting confirmation or payout in flight), appearance count
   - Payment history with dates and amounts tied to real payout state where possible

### Dashboard (`/dashboard`)
- Role-aware (shows different stats/CTAs for litigators vs per diems)
- Stats cards: Active, Completed, Total Spent/Earned, Open/Pending
- Upcoming appearances grid
- Quick-action buttons (Post Appearance / Browse)

### Settings (`/settings`)
- Edit profile (name, phone, role, bar number, bio, **practice areas**, **courts familiar**, **avatar**)
- Stripe Connect onboarding for per diems (**required before receiving payouts** once payments are live)
- Payment method / customer setup for litigators (saved card or Checkout) (**required before posting paid appearances** once payments are live)

---

## Near-term customer priorities (trust & operations)

These items close the gap between “demo flow” and **something litigators and per diems can rely on**:

- **Money path end-to-end**: post → authorized/captured funds → confirm (or timeout) → Connect transfer net of platform fee; webhooks update canonical payment state on the appearance.
- **Auto-release window**: if litigator does not act within **24 hours** after report submission, release per PRODUCT payment rules (exact policy TBD with counsel).
- **Disputes & cancellations**: documented rules for cancel while open, after claim, and no-show; `disputed` status wired to a minimal workflow (message thread or filing step — MVP can be email + admin).
- **Bar verification truthfulness**: internal checklist or admin toggle for `bar_verified`; marketing copy should match what is actually enforced.
- **Single source of truth for transitions**: claim, check-in, report submission, and completion should use one backend path so notifications and Stripe side effects always run together.

---

## Payment Flow
1. Litigator posts appearance and sets pay rate
2. Litigator pays total (per diem portion + platform fee); funds held via Stripe per chosen pattern (e.g. separate charge + transfer, or PaymentIntent with application fee — implementation detail)
3. Per diem completes appearance + submits outcome report (and check-in as required)
4. Litigator confirms completion **or** auto-release after agreed window
5. Funds transfer to per diem's Stripe Connect account (net to per diem = agreed pay rate; platform retains fee portion)
6. Platform keeps 15% fee (as shown at post time)

## Revenue Model
- 15% platform fee on every transaction (charged to litigator side)
- Future: Premium per diem profiles, litigator subscriptions, court intelligence reports

---

## User-facing agent orchestration (opportunity)

**Goal:** chained, reliable automation that **saves time and reduces anxiety** for litigators and per diems — not a single one-shot model call.

| Opportunity | User value | Notes |
|-------------|------------|--------|
| **Report pipeline** | Per diem submits once; product produces attorney-ready summary, risk flags, and next-step checklist; litigator sees it on the same appearance record | Today: structure endpoint exists; **orchestration** = validate inputs → call Claude → persist → notify litigator → optional “clarify” pass if fields missing |
| **Coverage assistant (litigator)** | Draft appearance post from minimal inputs (caption, court, date, rough notes); suggest pay band from appearance type | Reduces posting friction; guardrails so user always confirms before pay |
| **Day-of copilot (per diem)** | Morning-of checklist (court link, instructions recap), one-tap check-in, nudge if no check-in by threshold | Improves show-up confidence for posting attorney |
| **Match suggestions** | Rank open appearances by courts familiar, case type, past ratings (post-MVP depth) | Fits roadmap **AI matching**; orchestration = profile + embeddings or rules + explanation (“Why this match”) |
| **Post-appearance briefing** | After structured report exists, optional second step: “Firm memo” tone or client-safe paragraph | Second model call only when user asks; keeps costs bounded |

**Principles:** each agent step should be **observable** (user sees what ran), **recoverable** (retry, edit, dismiss), and **permissioned** (only parties on the appearance). Server-side orchestration should update `notifications` and appearance status in the same transactional story as money rules where relevant.

---

## Database Schema

### profiles
- id, email, full_name, phone, role, bar_number, bar_state, bar_verified
- practice_areas[], courts_familiar[], bio, avatar_url
- stripe_account_id, stripe_customer_id, rating_avg, rating_count

### appearances
- id, posted_by, claimed_by, status
- court_name, court_address, borough
- appearance_date, appearance_time
- case_type, case_caption, case_index_number, appearance_type
- instructions, pay_rate (cents), platform_fee (cents)
- stripe_payment_intent_id

### outcome_reports
- id, appearance_id, submitted_by
- outcome, next_date, judge_name, judge_notes
- opposing_counsel, action_items, red_flags, raw_notes
- ai_structured_report (JSON)

### reviews
- id, appearance_id, reviewer_id, reviewee_id, rating, comment
- Auto-updates profile rating_avg and rating_count

### notifications
- id, user_id, type, title, body, read, metadata

---

## API Routes
| Route | Purpose |
|---|---|
| POST /api/appearances/claim | Per diem claims an open appearance |
| POST /api/appearances/check-in | Per diem confirms courthouse arrival |
| POST /api/stripe/create-payment-intent | Create Stripe payment on posting |
| POST /api/stripe/connect-onboard | Stripe Connect onboarding for per diems |
| POST /api/stripe/release-payment | Transfer funds to per diem on completion |
| POST /api/stripe/webhook | Handle Stripe webhook events |
| POST /api/reports/structure | AI structures raw notes via Claude API |

*(Future orchestration may add routes such as `/api/reports/generate-memo` or `/api/appearances/suggest-match` without changing core tables.)*

---

## Pages
| Route | Description |
|---|---|
| / | Landing page |
| /login | Email/password login |
| /signup | Registration with role selection |
| /dashboard | Role-aware dashboard with stats |
| /post | Post new appearance form |
| /browse | Browse open appearances with filters |
| /appearances | Tabbed list of your appearances |
| /appearances/[id] | Full appearance detail + actions |
| /report/[id] | Outcome report submission form |
| /earnings | Per diem earnings dashboard |
| /settings | Profile management |

---

## AI Features
- **Report Structuring**: Per diem submits raw notes, Claude API generates:
  - Professional summary (2-3 sentences)
  - Key takeaways (3-5 bullet points)
  - Recommended next steps with deadlines
  - Risk assessment
  - Overall tone (positive/neutral/concerning)
- **Orchestration**: See *User-facing agent orchestration* for multi-step flows (notify litigator, optional follow-up generations, matching).

## Future Roadmap (Post-MVP)
- AI matching (per diem recommendations based on court familiarity, judge history) — fits orchestration layer
- Court intelligence database (judge behavior patterns, scheduling tips)
- Demand prediction (proactive coverage suggestions)
- Automated bar verification via API
- SMS notifications (Twilio) alongside in-app notifications
- Mobile app
- Multi-state expansion
- Dispute resolution workflow (escalate from `disputed` status)
- Subscription tiers for power users
