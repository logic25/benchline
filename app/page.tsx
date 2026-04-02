import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Gavel, Shield, Clock, DollarSign, ArrowRight, CheckCircle, Scale } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero — dark, editorial (Harvey-adjacent: confident, minimal chrome) */}
      <header className="relative overflow-hidden bg-[oklch(0.14_0.035_268)] text-[oklch(0.96_0.01_85)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage: `
              linear-gradient(160deg, oklch(0.18 0.04 268) 0%, transparent 45%),
              radial-gradient(ellipse 100% 80% at 50% -30%, oklch(0.42 0.12 268 / 0.35), transparent 55%),
              linear-gradient(to bottom, transparent 0%, oklch(0.12 0.03 268) 100%)
            `,
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `linear-gradient(oklch(1 0 0 / 0.05) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.05) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
        <nav className="relative z-10 border-b border-white/[0.08] backdrop-blur-md bg-[oklch(0.14_0.035_268/0.65)]">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                <Gavel className="h-5 w-5 text-[oklch(0.95_0.02_85)]" />
              </div>
              <span className="font-heading text-2xl leading-none tracking-[-0.02em] text-[oklch(0.98_0.01_85)] sm:text-[1.75rem]">
                Benchline
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button size="sm" variant="ghost" className="text-[oklch(0.92_0.01_85)] hover:bg-white/10 hover:text-white">
                  Sign in
                </Button>
              </Link>
              <Link href="/signup">
                <Button
                  size="sm"
                  className="border-0 bg-[oklch(0.95_0.02_85)] text-[oklch(0.2_0.03_268)] shadow-none hover:bg-white"
                >
                  Get started
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        <div className="relative z-10 mx-auto max-w-6xl px-4 py-24 md:px-6 md:py-32">
          <div className="max-w-3xl">
            <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.22em] text-[oklch(0.72_0.04_85)]">
              NYC court coverage
            </p>
            <h1 className="font-heading text-4xl font-normal leading-[1.08] tracking-[-0.02em] text-[oklch(0.99_0.008_85)] md:text-6xl md:leading-[1.05]">
              Coverage you can brief.&nbsp;
              <span className="text-[oklch(0.78_0.06_85)]">Reports you can file.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[oklch(0.78_0.02_85)] md:text-lg">
              Benchline pairs litigators with vetted per diem attorneys for New York appearances—clear instructions in,
              structured outcomes out.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="h-11 border-0 bg-[oklch(0.95_0.02_85)] px-7 text-base font-medium text-[oklch(0.2_0.03_268)] shadow-none hover:bg-white"
                >
                  Post an appearance
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 border-white/25 bg-transparent px-7 text-base text-[oklch(0.95_0.01_85)] hover:bg-white/10 hover:text-white"
                >
                  Join as per diem
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="border-b border-border/80 bg-muted/40 px-4 py-20 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 max-w-2xl">
            <h2 className="font-heading text-3xl font-normal tracking-tight text-foreground md:text-4xl">How it works</h2>
            <p className="mt-3 text-muted-foreground">Three steps from docket anxiety to a closed loop.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { num: '01', title: 'Post', desc: 'Court, date, caption, and pay—plus instructions your coverage attorney can execute without guesswork.' },
              { num: '02', title: 'Cover', desc: 'A qualified per diem claims the appearance and checks in. You stay focused on the strategy, not the calendar.' },
              { num: '03', title: 'Report', desc: 'Structured outcome notes and an AI brief you can drop into your file or forward to clients.' },
            ].map((step) => (
              <div
                key={step.num}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-8 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.08)] ring-1 ring-foreground/[0.04] transition-shadow hover:shadow-[0_12px_40px_-12px_rgba(15,23,42,0.12)]"
              >
                <span className="font-heading text-4xl tabular-nums text-primary/15 transition-colors group-hover:text-primary/25">
                  {step.num}
                </span>
                <h3 className="font-heading mt-4 text-xl font-normal tracking-tight">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-heading text-3xl font-normal tracking-tight md:text-4xl">Built for practice</h2>
              <p className="mt-3 max-w-lg text-muted-foreground">Operational detail, without the startup gimmicks.</p>
            </div>
            <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
              <Scale className="h-4 w-4 text-primary/70" />
              <span>Designed for NYC state courts</span>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Shield, title: 'Verified bar', desc: 'NY bar on profile; reviews from litigators you trust over time.' },
              { icon: Clock, title: 'Same-day velocity', desc: 'Post and match quickly when the part gets moved.' },
              { icon: DollarSign, title: 'Clear economics', desc: 'Transparent pay, platform fee, and release on confirmation.' },
              { icon: CheckCircle, title: 'AI-structured brief', desc: 'Raw notes become a concise brief: risks, next steps, tone.' },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm ring-1 ring-foreground/[0.04] backdrop-blur-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-5 font-medium tracking-tight">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-border/80 bg-primary px-4 py-20 text-primary-foreground md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-3xl font-normal tracking-tight md:text-4xl">Stop chasing coverage.</h2>
          <p className="mt-4 text-base leading-relaxed opacity-90 md:text-lg">
            Open an account and post your first appearance in minutes.
          </p>
          <Link href="/signup" className="mt-10 inline-block">
            <Button
              size="lg"
              variant="secondary"
              className="h-11 border-0 bg-[oklch(0.96_0.015_85)] px-8 text-base font-medium text-primary shadow-sm hover:bg-white"
            >
              Create your account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border bg-card px-4 py-10 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5 font-heading text-xl tracking-[-0.02em] sm:text-2xl">
            <Gavel className="h-6 w-6 shrink-0 text-primary" />
            Benchline
          </div>
          <p className="text-sm text-muted-foreground">2026 Benchline. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
