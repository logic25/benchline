# Benchline — Marketing Site

The public marketing website for **Benchline**, the NYC per diem attorney
marketplace. This is a **separate project** from the main application:

- **Marketing site (this repo):** `benchline.com` — public pages, waitlist
- **App (separate repo, `../benchline`):** `app.benchline.com` — the product

Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, a
small set of hand-rolled UI primitives (shadcn-style), `react-markdown` for legal
pages, and **server actions** for the waitlist (Supabase + Resend, with a console
fallback so it works with zero configuration).

---

## Quick start (dev)

```bash
npm install
cp .env.example .env.local   # optional — site runs without it
npm run dev                  # http://localhost:3000
```

The site is fully functional with **no environment variables**. The waitlist
form will log signups to the server console instead of writing to Supabase or
sending email — handy for local development and previews.

### Other scripts

```bash
npm run build   # production build (also type-checks)
npm run start   # serve the production build
npm run lint    # Next.js / ESLint
```

---

## Project structure

```
app/
  layout.tsx              Root layout: fonts (Inter + Playfair), header/footer, cookie banner, base metadata
  page.tsx                / — landing page
  for-litigators/         / — hiring-attorney audience page
  for-per-diems/          / — covering-attorney page (+ earnings calculator)
  pricing/                / — flat-fee table + disclosures + FAQ
  about/                  / — founders, story, compliance posture, contact
  security/               / — trust & compliance, subprocessors, vuln disclosure
  faq/                    / — categorized FAQ
  waitlist/
    page.tsx              / — email capture
    actions.ts            server action: validate → Supabase insert → Resend confirmation
  legal/[slug]/page.tsx   /legal/terms, /legal/privacy, /legal/ai-disclosure (renders content/legal/*.md)
  blog/page.tsx           / — scaffold with 3 placeholder posts
  sitemap.ts              /sitemap.xml
  robots.ts               /robots.txt
  not-found.tsx           404
  globals.css             Tailwind v4 theme + Benchline brand tokens

components/                Header, Footer, Logo, UI primitives (Button/Card/Section),
                           shared sections (TrustStrip/CtaBand), FAQ accordion,
                           earnings calculator, waitlist form, markdown renderer, cookie banner
content/legal/*.md         Legal drafts (copied from ../benchline-launch/legal/)
lib/                        utils (cn, SITE_URL, APP_URL), seo (buildMetadata)
public/                     og.png, favicon.svg, apple-touch-icon.png
supabase-waitlist.sql       Waitlist table migration
```

---

## Environment variables

All optional. See `.env.example`. Set the same names in Vercel for production.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Public origin, no trailing slash. Used for canonical/OG/sitemap URLs. |
| `NEXT_PUBLIC_APP_URL` | The app subdomain for "Sign in" links (default `https://app.benchline.com`). |
| `SUPABASE_URL` | Supabase project URL for the waitlist table. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only** key used to insert waitlist rows (bypasses RLS). Never expose to the browser. |
| `RESEND_API_KEY` | Resend key for the waitlist confirmation email. |
| `RESEND_FROM_EMAIL` | Verified sender, e.g. `Benchline <hello@benchline.com>`. |

**If Supabase is unset:** signups are logged to the server console.
**If Resend is unset:** the confirmation email is skipped (logged instead).
Neither failure blocks the signup success screen.

### Supabase setup (recommended: share the main app's project)

1. In the Supabase project (the same one the app uses), run
   [`supabase-waitlist.sql`](./supabase-waitlist.sql) to create the `waitlist`
   table with RLS enabled.
2. Copy the project URL and the **service role** key into
   `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`.
3. The service role key bypasses RLS, so no public insert policy is needed —
   and anon/public clients still can't read the table.

---

## Deploying to Vercel

1. Import this directory as a **new Vercel project** (separate from the app).
2. Set the Production environment variables (table above).
3. `vercel.json` pins the Next.js framework and redirects `/login` to
   `app.benchline.com/login`. No other config is required.
4. Point `benchline.com` (and `www`) at the project; keep `app.benchline.com`
   pointed at the main application project.
5. Set `NEXT_PUBLIC_SITE_URL=https://benchline.com` in Production so canonical,
   Open Graph, and sitemap URLs are correct.

Every page is statically prerendered; the only dynamic surface is the waitlist
server action.

---

## Updating content

- **Marketing copy:** edit the relevant page in `app/<route>/page.tsx`. Section
  content lives in plain arrays at the top of each file.
- **Legal documents:** these render from `content/legal/{terms,privacy,ai-disclosure}.md`.
  To update, replace those markdown files (the source of truth lives in
  `../benchline-launch/legal/`). The renderer automatically strips the leading
  `#` title and the draft NOTICE blockquote and shows its own styled
  "Draft — pending attorney review" banner. Remove that banner in
  `app/legal/[slug]/page.tsx` once documents are attorney-approved.
- **FAQ:** edit the `categories` array in `app/faq/page.tsx` (and the page-level
  `faqs` arrays in the audience pages).
- **Pricing:** edit the `tiers` / `included` / `faqs` arrays in `app/pricing/page.tsx`.
- **Blog:** posts are placeholders in `app/blog/page.tsx`. To ship a real blog,
  add an MDX or markdown loader and per-post routes under `app/blog/[slug]/`.
- **Nav / footer links:** `components/header.tsx` and `components/footer.tsx`.
- **Brand assets:** `public/og.png`, `public/favicon.svg`,
  `public/apple-touch-icon.png`. Brand tokens (navy/gold/slate/cream) live in
  `app/globals.css` under `@theme`.

---

## Design system

- **Colors:** navy `#0F172A`, gold `#C9A66B`, slate `#475569`, cream `#FAF8F2`,
  white background. Accent (gold) is used sparingly.
- **Type:** Playfair Display (serif) for headlines, Inter for body — both via
  `next/font/google`.
- **Motion:** subtle reveal-on-load and hover transitions; respects
  `prefers-reduced-motion`.
- **A11y/SEO:** semantic landmarks, focus-visible styles, per-page metadata +
  Open Graph, `sitemap.xml`, `robots.txt`. Static-first for performance
  (Lighthouse-oriented: next/font, next/image-ready, no client JS on most pages).

---

## Notes & decisions

- This is intentionally a **fresh Next.js project**, not the SPA template — the
  brief requires App Router, server actions, react-markdown legal pages, and a
  Vercel deployment, which are all Next.js-native.
- `lucide-react` is pinned to a current stable `0.x` release (the main app's
  `1.7.0` is not a published version on npm).
- Founder names, bar numbers, phone, and address are **placeholders** — replace
  before launch (see `app/about/page.tsx` and `components/footer.tsx`).
- Legal pages are **drafts pending attorney review** and display a banner saying
  so.
