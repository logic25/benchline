import Link from "next/link";
import {
  Cpu,
  Lock,
  ShieldCheck,
  BadgeCheck,
  FileLock2,
  ArrowRight,
  Mail,
} from "lucide-react";
import { Section, Eyebrow, Card } from "@/components/ui";
import { CtaBand, SectionHeader } from "@/components/shared-sections";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Security & Trust",
  path: "/security",
  description:
    "How Benchline protects data: AWS Bedrock zero data retention, TLS + encryption at rest, row-level security, verified bar status, and malpractice enforcement.",
});

const dataProtections = [
  {
    icon: Lock,
    title: "Encryption everywhere",
    desc: "TLS 1.2+ for all data in transit and encryption at rest for data we store. Secrets are managed, never hard-coded.",
  },
  {
    icon: FileLock2,
    title: "Row-level security",
    desc: "Every table enforces row-level security (RLS). Users can only ever reach the records they're authorized to see — enforced at the database, not just the app.",
  },
  {
    icon: ShieldCheck,
    title: "Least-privilege access",
    desc: "Internal access follows least-privilege principles, with auditable trails for sensitive actions across the platform.",
  },
];

export default function SecurityPage() {
  return (
    <>
      <section className="bg-cream">
        <div className="container-bl py-20 md:py-28">
          <div className="max-w-3xl">
            <Eyebrow>Security &amp; Trust</Eyebrow>
            <h1 className="mt-5 font-serif text-4xl leading-[1.06] text-navy md:text-6xl">
              Built for the data attorneys handle.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate md:text-xl">
              Court appearances touch sensitive matters. We designed Benchline so that
              the AI never keeps your data, the database never leaks across users, and
              the people on the platform are exactly who they say they are.
            </p>
          </div>
        </div>
      </section>

      {/* AI PROCESSING — flagship */}
      <Section>
        <div className="overflow-hidden rounded-3xl border border-line bg-navy p-8 text-cream md:p-12">
          <div className="grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
            <div>
              <span className="eyebrow text-gold">
                <span className="inline-block h-px w-6 bg-gold/60" />
                AI processing
              </span>
              <h2 className="mt-4 font-serif text-3xl text-cream md:text-4xl">
                Zero data retention. By design.
              </h2>
              <p className="mt-4 text-cream/75">
                Outcome reports are structured using AWS Bedrock under a zero
                data-retention configuration — your content is not stored or used to
                train any model. Before anything is transmitted, we redact identifiers
                so the model sees only what it needs to structure the report.
              </p>
              <p className="mt-3 text-cream/75">
                The structured output returns to your Benchline account, where it lives
                under the same encryption and access controls as the rest of your data.
                Per diems can opt out of AI processing entirely.
              </p>
              <Link
                href="/legal/ai-disclosure"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-gold hover:text-gold-soft"
              >
                Read the full AI Data Processing Disclosure{" "}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="rounded-2xl border border-cream/10 bg-navy-700/40 p-7">
              <Cpu className="h-8 w-8 text-gold" strokeWidth={1.5} />
              <ul className="mt-5 space-y-3 text-sm">
                {[
                  "Redaction before transmission",
                  "No retention by the model provider",
                  "Not used for model training",
                  "Opt out at any time",
                ].map((p) => (
                  <li key={p} className="flex items-center gap-2.5 text-cream/85">
                    <BadgeCheck className="h-4 w-4 text-gold" strokeWidth={2} />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* DATA PROTECTION */}
      <Section className="bg-cream pt-0">
        <SectionHeader eyebrow="Data protection" title="Defense in depth." />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {dataProtections.map((d) => (
            <Card key={d.title}>
              <div className="inline-flex rounded-xl bg-navy/5 p-3">
                <d.icon className="h-6 w-6 text-navy" strokeWidth={1.6} />
              </div>
              <h3 className="mt-5 text-lg text-navy">{d.title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-slate">{d.desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* SOC2 / HIPAA + VERIFICATION + INSURANCE */}
      <Section>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <h3 className="text-lg text-navy">Compliance roadmap</h3>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-slate">
              We&rsquo;ve architected Benchline for SOC 2 and HIPAA-aligned controls.
              Formal certification is on our roadmap — we&rsquo;ll publish status here
              rather than claim a badge we haven&rsquo;t earned yet.
            </p>
          </Card>
          <Card>
            <h3 className="text-lg text-navy">Bar verification</h3>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-slate">
              Every attorney&rsquo;s active New York bar admission is verified against
              public records — not self-reported. Status is re-checked, and lapses
              suspend access until resolved.
            </p>
          </Card>
          <Card>
            <h3 className="text-lg text-navy">Insurance enforcement</h3>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-slate">
              Current malpractice insurance is required and tracked on both litigators
              and per diems. Expiring policies trigger reminders; lapsed coverage pauses
              the account.
            </p>
          </Card>
        </div>
      </Section>

      {/* VULN DISCLOSURE */}
      <Section className="bg-cream">
        <div className="mx-auto flex max-w-3xl flex-col items-start gap-4 rounded-2xl border border-line bg-cream-deep/40 p-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-6 w-6 shrink-0 text-gold-dark" strokeWidth={1.8} />
            <div>
              <h3 className="text-base text-navy">Found a vulnerability?</h3>
              <p className="mt-1 text-sm text-slate">
                We welcome responsible disclosure. Email us and we&rsquo;ll respond
                promptly.
              </p>
            </div>
          </div>
          <a
            href="mailto:security@benchline.com"
            className="shrink-0 font-medium text-navy underline hover:text-gold-dark"
          >
            security@benchline.com
          </a>
        </div>
      </Section>

      <CtaBand
        title="Trust, then verify — we built for both."
        body="Join the waitlist to put a security-first per diem network to work for your practice."
      />
    </>
  );
}
