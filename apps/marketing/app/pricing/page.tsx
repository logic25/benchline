import { Check, Video, Building2, Scale, Info, ArrowRight } from "lucide-react";
import { Section, Eyebrow, ButtonLink, Card } from "@/components/ui";
import { CtaBand, SectionHeader } from "@/components/shared-sections";
import { FaqList } from "@/components/faq-list";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Pricing",
  path: "/pricing",
  description:
    "Transparent flat platform fees: $25 virtual, $35 in-person, $50 specialty. We don't share legal fees — our fee is for technology, per RPC 5.4 and NYSBA Opinion 1113.",
});

const tiers = [
  {
    icon: Video,
    name: "Virtual appearance",
    price: "$25",
    desc: "Telephonic and Microsoft Teams / Skype court conferences.",
    examples: ["Status conferences", "Compliance conferences", "Telephonic calendar calls"],
  },
  {
    icon: Building2,
    name: "In-person appearance",
    price: "$35",
    featured: true,
    desc: "Standard in-person coverage at NYC courthouses.",
    examples: ["Calendar calls", "Routine motions", "Preliminary conferences"],
  },
  {
    icon: Scale,
    name: "Specialty / complex",
    price: "$50",
    desc: "Appearances requiring added expertise or extended time.",
    examples: ["Argued motions", "Evidentiary hearings", "Specialized parts"],
  },
];

const included = [
  "Verified NY-barred per diem attorney",
  "Conflict-of-interest auto-check before claim",
  "Malpractice insurance verified on both sides",
  "AI-structured outcome report (AWS Bedrock, zero retention)",
  "Secure document handling (TLS, encryption at rest)",
  "In-platform messaging and audit trail",
];

const faqs = [
  {
    q: "Why a flat fee instead of a percentage?",
    a: "Because Benchline is a technology platform, not a law firm or a fee-sharing arrangement. Charging a flat fee for technology — rather than a percentage of the legal fee — keeps us aligned with New York Rule of Professional Conduct 5.4 and NYSBA Ethics Opinion 1113.",
  },
  {
    q: "Who pays the platform fee?",
    a: "The litigator who posts the appearance pays the flat platform fee. The per diem attorney sets and keeps their own rate; the platform fee is charged on top, not deducted from the per diem's pay.",
  },
  {
    q: "Is sales tax added?",
    a: "Yes. New York imposes sales tax on certain software/technology services. An 8.875% New York City combined sales tax may be applied to the platform fee where required. Your invoice will itemize it clearly.",
  },
  {
    q: "What's the instant payout fee?",
    a: "Per diems who choose Stripe Instant Payouts pay a 1.5% fee on the payout amount (a Stripe charge, passed through at cost). Standard next-business-day payouts are free.",
  },
  {
    q: "Are there subscription or signup fees?",
    a: "No. There's no monthly subscription, no membership fee, and no charge to join the waitlist or create an account. You pay the flat fee only when an appearance is covered.",
  },
];

export default function PricingPage() {
  return (
    <>
      <section className="bg-cream">
        <div className="container-bl py-20 text-center md:py-28">
          <div className="mx-auto max-w-2xl">
            <Eyebrow>Pricing</Eyebrow>
            <h1 className="mt-5 font-serif text-4xl leading-[1.06] text-navy md:text-6xl">
              Flat fees. Nothing hidden.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate md:text-xl">
              One transparent technology fee per appearance — never a percentage of
              your legal fee. Here&rsquo;s the whole picture.
            </p>
          </div>
        </div>
      </section>

      <Section className="-mt-10 pt-0 md:-mt-14">
        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative rounded-2xl border p-8 ${
                t.featured
                  ? "border-gold bg-white shadow-[var(--shadow-card)]"
                  : "border-line bg-white shadow-[var(--shadow-soft)]"
              }`}
            >
              {t.featured && (
                <span className="absolute -top-3 left-8 rounded-full bg-gold px-3 py-1 text-xs font-semibold uppercase tracking-wider text-navy">
                  Most common
                </span>
              )}
              <div className="inline-flex rounded-xl bg-navy/5 p-3">
                <t.icon className="h-6 w-6 text-navy" strokeWidth={1.6} />
              </div>
              <h3 className="mt-5 text-lg text-navy">{t.name}</h3>
              <p className="mt-3 font-serif text-5xl text-navy">
                {t.price}
                <span className="ml-1 align-middle text-sm font-sans font-normal text-slate-light">
                  / appearance
                </span>
              </p>
              <p className="mt-3 text-sm text-slate">{t.desc}</p>
              <ul className="mt-5 space-y-2 border-t border-line pt-5">
                {t.examples.map((ex) => (
                  <li key={ex} className="flex items-center gap-2 text-sm text-slate">
                    <Check className="h-4 w-4 text-gold-dark" strokeWidth={2} />
                    {ex}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* RPC 5.4 footnote */}
        <div className="mx-auto mt-10 flex max-w-3xl items-start gap-3 rounded-2xl border border-line bg-cream-deep/40 p-6">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" strokeWidth={1.8} />
          <p className="text-sm leading-relaxed text-slate">
            <strong className="text-navy">We don&rsquo;t share legal fees.</strong> Our
            fee is for technology — connecting, verifying, processing reports, and
            handling payments — not a cut of the legal work. This flat-fee structure is
            designed to stay consistent with New York Rule of Professional Conduct 5.4
            and NYSBA Ethics Opinion 1113.
          </p>
        </div>
      </Section>

      {/* ADDITIONAL DISCLOSURES */}
      <Section className="bg-cream pt-0">
        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
          <Card>
            <h3 className="text-base text-navy">New York sales tax</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              An 8.875% NYC combined sales tax may apply to the technology platform fee
              where required by law. It&rsquo;s itemized separately on every invoice —
              never buried.
            </p>
          </Card>
          <Card>
            <h3 className="text-base text-navy">Instant payout fee</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              Per diems who opt into Stripe Instant Payouts pay a 1.5% fee on the payout
              (passed through at Stripe&rsquo;s cost). Standard next-day payouts are
              free.
            </p>
          </Card>
        </div>
      </Section>

      {/* WHAT YOU GET */}
      <Section>
        <SectionHeader
          eyebrow="What's included"
          title="Every fee buys the same foundation of trust."
        />
        <div className="mx-auto mt-12 grid max-w-3xl gap-3 sm:grid-cols-2">
          {included.map((item) => (
            <div
              key={item}
              className="flex items-start gap-3 rounded-xl border border-line bg-white px-5 py-4"
            >
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" strokeWidth={2} />
              <span className="text-[0.95rem] text-slate">{item}</span>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <ButtonLink href="/waitlist" size="lg">
            Join the waitlist <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </Section>

      <Section className="bg-cream">
        <SectionHeader eyebrow="Questions" title="Pricing FAQ" />
        <div className="mx-auto mt-10 max-w-3xl">
          <FaqList items={faqs} />
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
