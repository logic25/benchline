import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Hand,
  ClipboardCheck,
  Sparkles,
  Zap,
  MapPin,
  ShieldCheck,
  Check,
  Minus,
} from "lucide-react";
import { ButtonLink, Section, Eyebrow, Card } from "@/components/ui";
import { TrustStrip, CtaBand, SectionHeader } from "@/components/shared-sections";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Benchline",
  path: "/",
  description:
    "Per diem coverage, done right. Benchline connects NYC litigators with NY-verified per diem attorneys — AI outcome reports, Stripe instant payouts, and flat platform fees.",
});

const steps = [
  {
    icon: FileText,
    title: "Post",
    desc: "A litigator posts a court appearance — court, part, date, and case details — in under two minutes.",
  },
  {
    icon: Hand,
    title: "Claim",
    desc: "A verified per diem attorney claims it first-come, first-served. No bidding, no waiting on a callback.",
  },
  {
    icon: ClipboardCheck,
    title: "Report",
    desc: "After the appearance, the per diem files an outcome report. AI structures it; payout lands in ~30 minutes.",
  },
];

const why = [
  {
    icon: Sparkles,
    title: "AI-structured outcome reports",
    desc: "Every appearance comes back as a clean, consistent report — processed through AWS Bedrock with zero data retention and redaction before transmission. No competitor offers this.",
  },
  {
    icon: Zap,
    title: "Instant payouts",
    desc: "Per diems get paid via Stripe Instant Payouts — typically within 30 minutes of an approved report, not weeks later.",
  },
  {
    icon: MapPin,
    title: "NY-native, for real",
    desc: "Founded in NYC by named operators with a real New York phone number and address. We know the parts, the clerks, and the local rules.",
  },
  {
    icon: ShieldCheck,
    title: "Real verification, both sides",
    desc: "Active NY bar status and malpractice insurance are verified on litigators and per diems alike. Plus an automatic conflict-of-interest check before every claim.",
  },
];

const comparison = [
  { feature: "Verified founders, real NY phone & address", us: true, them: false },
  { feature: "AI-structured outcome reports (zero retention)", us: true, them: false },
  { feature: "First-to-claim coverage (no bidding delay)", us: true, them: "Bid model" },
  { feature: "Stripe Instant Payouts (~30 min)", us: true, them: false },
  { feature: "Flat platform fee ($25–$50)", us: true, them: "% of fee" },
  { feature: "Conflict-of-interest auto-check", us: true, them: false },
  { feature: "Malpractice insurance enforced both sides", us: true, them: "Partial" },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true)
    return (
      <span className="inline-flex items-center justify-center rounded-full bg-gold/15 p-1">
        <Check className="h-4 w-4 text-gold-dark" strokeWidth={2.5} />
      </span>
    );
  if (value === false)
    return <Minus className="mx-auto h-4 w-4 text-slate-light/50" />;
  return <span className="text-sm text-slate-light">{value}</span>;
}

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, #faf8f2 0%, #ffffff 60%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] opacity-[0.5]"
          style={{
            backgroundImage:
              "linear-gradient(#eef0f3 1px, transparent 1px), linear-gradient(90deg, #eef0f3 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "linear-gradient(to bottom, black, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
          }}
        />
        <div className="container-bl pb-16 pt-20 text-center md:pt-28">
          <div className="reveal mx-auto flex max-w-3xl flex-col items-center">
            <Eyebrow>NYC per diem attorney marketplace</Eyebrow>
            <h1 className="mt-6 font-serif text-5xl leading-[1.05] text-navy md:text-7xl md:leading-[1.02]">
              Per diem coverage,
              <br />
              <span className="italic text-gold-dark">done right.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-slate md:text-xl">
              Benchline connects New York litigators who need a court appearance
              covered with NY-verified per diem attorneys who can be there. Claim in
              seconds, get an AI-structured outcome report, and pay out instantly.
            </p>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
              <ButtonLink href="/waitlist" size="lg">
                Join the waitlist <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/for-per-diems" variant="outline" size="lg">
                Earn as a per diem
              </ButtonLink>
            </div>
          </div>

          <div className="reveal mt-14 border-t border-line pt-8" style={{ animationDelay: "120ms" }}>
            <TrustStrip />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <Section className="bg-cream">
        <SectionHeader
          eyebrow="How it works"
          title="Three steps, start to payout."
          body="No agency middleman, no off-platform handshakes, no chasing invoices."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <Card key={s.title} className="relative bg-white">
              <span className="font-serif text-sm font-semibold text-gold-dark">
                0{i + 1}
              </span>
              <div className="mt-4 inline-flex rounded-xl bg-navy/5 p-3">
                <s.icon className="h-6 w-6 text-navy" strokeWidth={1.6} />
              </div>
              <h3 className="mt-5 text-xl text-navy">{s.title}</h3>
              <p className="mt-2 text-[0.97rem] leading-relaxed text-slate">{s.desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* WHY BENCHLINE */}
      <Section>
        <SectionHeader
          eyebrow="Why Benchline"
          title="Built for trust, on both sides of the bench."
          body="Every differentiator points the same direction: a coverage network attorneys can actually rely on."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {why.map((w) => (
            <div
              key={w.title}
              className="group flex gap-5 rounded-2xl border border-line bg-white p-7 transition-colors hover:border-gold/40"
            >
              <div className="shrink-0">
                <div className="inline-flex rounded-xl bg-gold/12 p-3">
                  <w.icon className="h-6 w-6 text-gold-dark" strokeWidth={1.6} />
                </div>
              </div>
              <div>
                <h3 className="text-lg text-navy">{w.title}</h3>
                <p className="mt-2 text-[0.97rem] leading-relaxed text-slate">
                  {w.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* COMPARISON */}
      <Section className="bg-navy">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow text-gold">
            <span className="inline-block h-px w-6 bg-gold/60" />
            How we compare
          </span>
          <h2 className="mt-4 font-serif text-3xl text-cream md:text-[2.6rem] md:leading-[1.1]">
            The honest version of per diem coverage.
          </h2>
          <p className="mt-4 text-lg text-cream/70">
            What you should expect from a modern platform — and what most still
            don&rsquo;t offer.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-2xl border border-cream/10 bg-navy-700/40">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-cream/10 text-xs uppercase tracking-wider text-cream/50">
                <th className="px-5 py-4 font-medium">Capability</th>
                <th className="px-4 py-4 text-center font-semibold text-gold">
                  Benchline
                </th>
                <th className="px-4 py-4 text-center font-medium">Typical platform</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row, i) => (
                <tr
                  key={row.feature}
                  className={i % 2 ? "bg-cream/[0.02]" : ""}
                >
                  <td className="px-5 py-4 text-sm text-cream/85">{row.feature}</td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center justify-center rounded-full bg-gold/20 p-1">
                      <Check className="h-4 w-4 text-gold" strokeWidth={2.5} />
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {row.them === false ? (
                      <Minus className="mx-auto h-4 w-4 text-cream/30" />
                    ) : (
                      <span className="text-xs text-cream/55">{row.them}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-5 text-center text-xs text-cream/40">
          Comparison reflects publicly available competitor information as of 2026. We
          don&rsquo;t name names — we just do the work.
        </p>
      </Section>

      {/* TESTIMONIAL PLACEHOLDER */}
      <Section className="bg-cream">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>From our pilot firms</Eyebrow>
          <blockquote className="mt-6 font-serif text-2xl leading-snug text-navy/70 md:text-3xl">
            &ldquo;Real attorney testimonials are coming soon as we onboard our pilot
            firms across Manhattan, Brooklyn, and Queens.&rdquo;
          </blockquote>
          <p className="mt-6 text-sm text-slate-light">
            We&rsquo;d rather show you nothing than fabricate a review. Want to be one
            of the firms we feature?{" "}
            <Link href="/waitlist" className="font-medium text-navy underline">
              Join the pilot.
            </Link>
          </p>
        </div>
      </Section>

      {/* PRICING SNIPPET */}
      <Section>
        <div className="grid items-center gap-10 rounded-3xl border border-line bg-cream-deep/40 p-8 md:grid-cols-2 md:p-12">
          <div>
            <Eyebrow>Pricing</Eyebrow>
            <h2 className="mt-4 font-serif text-3xl text-navy md:text-4xl">
              Flat fees. No percentage of your legal fee.
            </h2>
            <p className="mt-4 text-slate">
              Benchline charges a flat technology fee — $25 for virtual appearances,
              $35 in-person, $50 specialty. We never take a cut of the legal fee, in
              keeping with RPC 5.4 and NYSBA Opinion 1113.
            </p>
            <ButtonLink href="/pricing" variant="outline" className="mt-7">
              See full pricing <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
          <div className="grid gap-3">
            {[
              ["Virtual appearance", "$25"],
              ["In-person appearance", "$35"],
              ["Specialty / complex", "$50"],
            ].map(([label, price]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-xl border border-line bg-white px-5 py-4"
              >
                <span className="font-medium text-navy">{label}</span>
                <span className="font-serif text-2xl text-gold-dark">{price}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
