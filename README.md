# Benchline

NYC per diem attorney marketplace — connecting solo litigators with NY-barred attorneys for court appearances.

## Monorepo Structure

```
benchline/
├── apps/
│   ├── web/          Main app (Next.js + Supabase + Stripe Connect)
│   └── marketing/    Marketing site (benchline.co) — Next.js static export
└── packages/         (reserved for shared brand tokens, legal copy, etc.)
```

## Development

Each app is independent. Install dependencies per workspace:

```bash
# Main app
cd apps/web
npm install
npm run dev          # http://localhost:3000

# Marketing site
cd apps/marketing
npm install
npm run dev          # http://localhost:3000
```

Or use root workspace scripts:

```bash
npm run dev:web
npm run dev:marketing
npm run build:web
npm run build:marketing
```

## Deployment

Both apps deploy to Vercel as two separate projects from this single repo:

| App           | Vercel Project        | Root Directory       | Domain                     |
| ------------- | --------------------- | -------------------- | -------------------------- |
| Main app      | `benchline-web`       | `apps/web`           | `app.benchline.co`         |
| Marketing     | `benchline-marketing` | `apps/marketing`     | `benchline.co` / `www`     |

Each project is connected to this repo with a different **Root Directory** set in Vercel's project settings, so pushes to `master` trigger both deploys independently.

## Phase Summaries

See `PHASE_1_SUMMARY.md`, `PHASE_2_SUMMARY.md`, `PHASE_3_SUMMARY.md` for shipped work history.

See `PRODUCT.md` for product vision and `AGENTS.md` for working agreements.
