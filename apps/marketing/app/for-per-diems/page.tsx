import { Zap, Banknote, Eye, BadgeCheck, ArrowRight, Check } from "lucide-react";
import { Section, Eyebrow, ButtonLink, Card } from "@/components/ui";
import { CtaBand, SectionHeader, TrustStrip } from "@/components/shared-sections";
import { EarningsCalculator } from "@/components/earnings-calculator";
import { FaqList } from "@/components/faq-list";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "For per diem attorneys",
  path: "/for-per-diems",
  description:
    "Claim NYC court appearances, set your own rate, and get paid in ~30 minutes via Stripe Instant Payouts. No agency middleman, transparent flat fees, real verification.",
});

const betterThanAgencies = [
  {
    icon: Banknote,
    title: "No middleman markup",
    desc: "Agencies take 20–40% off the top. On Benchline you set your rate and keep it — the platform fee is paid separately by the litigator.",
  },
  {
    icon: Eye,
    title: "Total transparency",
    desc: "You see the court, the part, the matter type, and the rate before you claim. No mystery assignments dispatched by a coordinator.",
  },
  {
    icon: Zap,
    title: "Get paid in ~30 minutes",
    desc: "Once your outcome report is approved, Stripe Instant Payouts moves your money — not net-30, not 'end of the month.'",
  },
];

const verification = [
  "Active New York State bar admission (verified, not self-reported)",
  "Current malpractice insurance on file",
  "Government ID and identity confirmation",
  "Agreement to confidentiality and conflict-of-interest screening",
];

const faqs = [
  {
    q: "How and when do I get paid?",
    a: "After you file an outcome report and it's approved, payout runs through Stripe Instant Payouts — typically arriving in your bank within about 30 minutes. A 1.5% Stripe instant-payout fee applies if you choose instant; standard payouts are free.",
  },
  {
    q: "Do you take a cut of my rate?",
    a: "No. You set your rate and keep it. Benchline's flat technology fee ($25–$50) is paid by the litigator on top of your fee — we never skim a percentage from you.",
  },
  {
    q: "What do I need to get verified?",
    a: "Active NY bar admission, current malpractice insurance, and a quick identity check. We verify bar status directly rather than taking your word for it — which is exactly why litigators trust the network.",
  },
  {
    q: "How do I find appearances?",
    a: "Open appearances surface in your dashboard filtered to your boroughs and practice areas. Claiming is first-come, first-served — no bidding wars, no waiting to hear back.",
  },
  {
    q: "What's an outcome report?",
    a: "A short structured summary of what happened at the appearance. You provide the facts; AI (via AWS Bedrock, zero retention) structures it into a clean report for the litigator. You can opt out of AI processing.",
  },
];

export default function ForPerDiemsPage() {
  return (
    <>
      <section className="bg-cream">
        <div className="container-bl py-20 md:py-28">
          <div className="max-w-3xl">
            <Eyebrow>For per diem attorneys</Eyebrow>
            <h1 className="mt-5 font-serif text-4xl leading-[1.06] text-navy md:text-6xl">
              Your bar card.
              <br />
              <span className="italic text-gold-dark">Your rate. Your payout.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate md:text-xl">
              Claim NYC court appearances on your terms, set what you charge, and get
              paid in about thirty minutes. No agency taking a cut, no opaque
              dispatcher — just verified work and instant pay.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/waitlist" size="lg">
                Join the waitlist <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/pricing" variant="outline" size="lg">
                See the fee structure
              </ButtonLink>
            </div>
          </div>
          <div className="mt-12 border-t border-line pt-8">
            <TrustStrip className="justify-start" />
          </div>
        </div>
      </section>

      {/* CALCULATOR */}
      <Section>
        <SectionHeader
          eyebrow="Earnings calculator"
          title="See what a month could look like."
          body="Drag to estimate. These are projections, not guarantees — but they assume you keep 100% of your rate, because you do."
        />
        <div className="mt-12">
          <EarningsCalculator />
        </div>
      </Section>

      {/* INSTANT PAYOUT HIGHLIGHT */}
      <Section className="bg-navy">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <span className="eyebrow text-gold">
              <span className="inline-block h-px w-6 bg-gold/60" />
              Instant payouts
            </span>
            <h2 className="mt-4 font-serif text-3xl text-cream md:text-4xl">
              Walk out of court. Watch the deposit land.
            </h2>
            <p className="mt-4 text-cream/70">
              Most platforms and agencies pay on a delay — net-30, net-45, or
              &ldquo;next billing cycle.&rdquo; Benchline uses Stripe Instant Payouts so
              your money moves the same day your report is approved, usually within
              about thirty minutes.
            </p>
            <p className="mt-3 text-sm text-cream/50">
              Instant payout carries a 1.5% Stripe fee. Standard next-day payouts are
              free.
            </p>
          </div>
          <div className="rounded-2xl border border-cream/10 bg-navy-700/40 p-8">
            <div className="space-y-4">
              {[
                ["Report approved", "10:42 AM"],
                ["Instant payout initiated", "10:43 AM"],
                ["Funds in your account", "~11:11 AM"],
              ].map(([label, time], i) => (
                <div key={label} className="flex items-center gap-4">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      i === 2 ? "bg-gold text-navy" : "bg-cream/10 text-gold"
                    }`}
                  >
                    {i === 2 ? <Check className="h-5 w-5" strokeWidth={2.5} /> : <Zap className="h-4 w-4" />}
                  </div>
                  <div className="flex flex-1 items-baseline justify-between border-b border-cream/10 pb-3">
                    <span className="text-cream/85">{label}</span>
                    <span className="font-mono text-sm text-cream/55">{time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* BETTER THAN AGENCIES */}
      <Section>
        <SectionHeader
          eyebrow="Why not an agency"
          title="Better than the agency model, by design."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {betterThanAgencies.map((b) => (
            <Card key={b.title}>
              <div className="inline-flex rounded-xl bg-gold/12 p-3">
                <b.icon className="h-6 w-6 text-gold-dark" strokeWidth={1.6} />
              </div>
              <h3 className="mt-5 text-lg text-navy">{b.title}</h3>
              <p className="mt-2 text-[0.97rem] leading-relaxed text-slate">{b.desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* VERIFICATION TRANSPARENCY */}
      <Section className="bg-cream">
        <div className="grid items-start gap-10 md:grid-cols-2">
          <SectionHeader
            align="left"
            eyebrow="What we verify"
            title="Verification keeps the work — and the rates — high."
            body="We verify everyone, because litigators pay for certainty. Here's exactly what we check before you can claim:"
          />
          <ul className="space-y-3">
            {verification.map((v) => (
              <li
                key={v}
                className="flex items-start gap-3 rounded-xl border border-line bg-white px-5 py-4"
              >
                <BadgeCheck
                  className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark"
                  strokeWidth={1.8}
                />
                <span className="text-[0.97rem] text-slate">{v}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section>
        <SectionHeader eyebrow="Questions" title="Per diem FAQ" />
        <div className="mx-auto mt-10 max-w-3xl">
          <FaqList items={faqs} />
        </div>
      </Section>

      <CtaBand
        title="Turn your bar card into instant income."
        body="Join the waitlist and we'll onboard you as we open per diem access across NYC."
      />
    </>
  );
}
