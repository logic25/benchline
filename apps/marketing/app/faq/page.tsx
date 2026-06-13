import {
  Rocket,
  CreditCard,
  BadgeCheck,
  Sparkles,
  Gavel,
  ShieldCheck,
} from "lucide-react";
import { Eyebrow } from "@/components/ui";
import { CtaBand } from "@/components/shared-sections";
import { FaqList } from "@/components/faq-list";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "FAQ",
  path: "/faq",
  description:
    "Answers about getting started, payments, verification, AI outcome reports, disputes, and security on Benchline — the NYC per diem attorney marketplace.",
});

const categories = [
  {
    icon: Rocket,
    title: "Getting started",
    items: [
      {
        q: "What is Benchline?",
        a: "Benchline is a New York City marketplace for per diem court coverage. NY-barred litigators post appearances they need covered; NY-verified per diem attorneys claim them, appear, and file a structured outcome report.",
      },
      {
        q: "Who can join?",
        a: "Attorneys admitted to and in good standing with the New York State bar. Litigators post appearances; per diems cover them. Many members do both.",
      },
      {
        q: "When does Benchline launch?",
        a: "We're onboarding pilot firms and per diem attorneys across NYC now. Join the waitlist and we'll reach out as we open access in your borough and practice area.",
      },
      {
        q: "Is there a cost to sign up?",
        a: "No. Creating an account and joining the waitlist are free. You only pay the flat platform fee when an appearance is actually covered.",
      },
    ],
  },
  {
    icon: CreditCard,
    title: "Payments",
    items: [
      {
        q: "How much does Benchline charge?",
        a: "A flat technology fee per appearance: $25 virtual, $35 in-person, $50 specialty. We never take a percentage of the legal fee.",
      },
      {
        q: "How fast do per diems get paid?",
        a: "After an outcome report is approved, Stripe Instant Payouts typically delivers funds within about 30 minutes. Standard next-business-day payouts are free; instant carries a 1.5% Stripe fee.",
      },
      {
        q: "Who pays the platform fee?",
        a: "The litigator who posts the appearance. The per diem sets and keeps their own rate; the platform fee is charged on top, not deducted from per diem pay.",
      },
      {
        q: "Is sales tax applied?",
        a: "An 8.875% NYC combined sales tax may apply to the technology fee where required by law. It's itemized clearly on every invoice.",
      },
    ],
  },
  {
    icon: BadgeCheck,
    title: "Verification",
    items: [
      {
        q: "How do you verify attorneys?",
        a: "We confirm active NY bar admission against public records (not self-reporting), require current malpractice insurance, and run an identity check before an account can transact.",
      },
      {
        q: "Do you check for conflicts of interest?",
        a: "Yes. An automated conflict-of-interest check runs against the posted matter before a per diem is allowed to claim it.",
      },
      {
        q: "What happens if my bar status or insurance lapses?",
        a: "Access is paused until it's resolved. Expiring insurance triggers advance reminders so coverage doesn't lapse unexpectedly.",
      },
    ],
  },
  {
    icon: Sparkles,
    title: "AI reports",
    items: [
      {
        q: "What is an AI outcome report?",
        a: "After an appearance, the per diem provides the facts and AI structures them into a clean, consistent report — what was heard, what was ordered, and next dates — for the litigator.",
      },
      {
        q: "What happens to my data in AI processing?",
        a: "Processing runs through AWS Bedrock under a zero data-retention configuration. Identifiers are redacted before transmission, content is not stored by the model provider, and it's not used for training.",
      },
      {
        q: "Can I opt out of AI processing?",
        a: "Yes. Per diems can opt out and submit a report without AI assistance. See our AI Data Processing Disclosure for details.",
      },
    ],
  },
  {
    icon: Gavel,
    title: "Disputes",
    items: [
      {
        q: "What if an appearance doesn't go as expected?",
        a: "Benchline provides an in-platform record of the posting, claim, and outcome report to help resolve questions. Our team can assist, but the professional relationship and any legal obligations remain between the attorneys.",
      },
      {
        q: "What if a per diem can no longer cover a claimed appearance?",
        a: "They should release the claim as early as possible so it returns to the pool for another verified attorney. Repeated last-minute drops affect standing on the platform.",
      },
      {
        q: "Does Benchline provide legal advice?",
        a: "No. Benchline is a technology platform, not a law firm, and does not provide legal advice. Attorneys remain responsible for their professional obligations.",
      },
    ],
  },
  {
    icon: ShieldCheck,
    title: "Security",
    items: [
      {
        q: "How is my data protected?",
        a: "TLS in transit, encryption at rest, row-level security on every table, and least-privilege internal access. See our Security page for the full picture.",
      },
      {
        q: "Who are your subprocessors?",
        a: "Stripe (payments), Supabase (database/auth/storage), AWS Bedrock (AI, zero retention), Resend (email), and Twilio (SMS). The current list lives on our Security page.",
      },
      {
        q: "Are you SOC 2 or HIPAA certified?",
        a: "We've architected for SOC 2 and HIPAA-aligned controls; formal certification is on our roadmap. We publish honest status rather than unearned badges.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <section className="bg-cream">
        <div className="container-bl py-20 text-center md:py-24">
          <div className="mx-auto max-w-2xl">
            <Eyebrow>Help center</Eyebrow>
            <h1 className="mt-5 font-serif text-4xl leading-[1.06] text-navy md:text-6xl">
              Frequently asked questions
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate md:text-xl">
              Everything about getting started, payments, verification, AI reports,
              disputes, and security.
            </p>
          </div>
        </div>
      </section>

      <div className="container-bl py-16 md:py-20">
        <div className="mx-auto max-w-3xl space-y-14">
          {categories.map((cat) => (
            <div key={cat.title} id={cat.title.toLowerCase().replace(/\s+/g, "-")}>
              <div className="mb-6 flex items-center gap-3">
                <span className="inline-flex rounded-xl bg-gold/12 p-2.5">
                  <cat.icon className="h-5 w-5 text-gold-dark" strokeWidth={1.8} />
                </span>
                <h2 className="font-serif text-2xl text-navy">{cat.title}</h2>
              </div>
              <FaqList items={cat.items} />
            </div>
          ))}
        </div>
      </div>

      <CtaBand
        title="Still have a question?"
        body="Email hello@benchline.com — a real person (a NY-barred one) will answer. Or join the waitlist to get started."
      />
    </>
  );
}
