import {
  CalendarClock,
  PhoneOff,
  UserX,
  ShieldCheck,
  FileText,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Section, Eyebrow, ButtonLink, Card } from "@/components/ui";
import { CtaBand, SectionHeader, TrustStrip } from "@/components/shared-sections";
import { FaqList } from "@/components/faq-list";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "For litigators",
  path: "/for-litigators",
  description:
    "Cover any NYC court appearance in minutes. Post a part, get a verified per diem attorney, receive an AI-structured outcome report. Built for NY litigators.",
});

const pains = [
  {
    icon: CalendarClock,
    pain: "Two appearances, one you.",
    solve:
      "Post the conflict in under two minutes. A verified per diem claims it almost immediately — no email threads, no calendar Tetris.",
  },
  {
    icon: PhoneOff,
    pain: "Last-minute coverage at 8 PM the night before.",
    solve:
      "Benchline runs on a live pool of NY-barred per diems. Urgent posts surface instantly, and you see the claim the moment it happens.",
  },
  {
    icon: UserX,
    pain: "Off-platform per diems you can't fully vet.",
    solve:
      "Every per diem on Benchline has verified active NY bar status and current malpractice insurance. We auto-check conflicts before they can claim.",
  },
  {
    icon: FileText,
    pain: "Vague 'it went fine' reports after the appearance.",
    solve:
      "You get a structured outcome report — what was heard, what was ordered, next dates — generated with AI through AWS Bedrock with zero data retention.",
  },
];

const workflow = [
  {
    title: "Post the appearance",
    desc: "Court, part, judge, date, case caption, and what needs to happen. Add notes or upload context.",
  },
  {
    title: "Get matched & confirmed",
    desc: "A verified per diem claims it first-come. You see their bar number, insurance status, and conflict-clear confirmation.",
  },
  {
    title: "Receive the outcome report",
    desc: "After the appearance, a clean structured report lands in your dashboard — ready to forward to the client or file away.",
  },
];

const faqs = [
  {
    q: "Who actually shows up to court?",
    a: "A New York-barred attorney whose active bar status and malpractice insurance Benchline has verified, and who has passed an automated conflict-of-interest check against the matter you posted.",
  },
  {
    q: "How fast can I get coverage?",
    a: "Posts go live instantly to the per diem pool. For routine NYC appearances during business hours, claims often happen within minutes. Same-day and next-morning coverage is the core use case.",
  },
  {
    q: "Is Benchline splitting my legal fee?",
    a: "No. Benchline charges a flat technology fee ($25–$50 depending on appearance type). We never take a percentage of your legal fee — consistent with RPC 5.4 and NYSBA Opinion 1113.",
  },
  {
    q: "What about confidentiality and conflicts?",
    a: "Per diems agree to confidentiality obligations, and our conflict-of-interest auto-check screens before a claim is allowed. Outcome-report AI processing redacts identifiers before transmission and retains no data.",
  },
  {
    q: "Which courts do you cover?",
    a: "We're launching across New York City — Supreme, Civil, Criminal, Family, and Housing parts in Manhattan, Brooklyn, Queens, the Bronx, and Staten Island, plus virtual appearances.",
  },
];

export default function ForLitigatorsPage() {
  return (
    <>
      <section className="bg-cream">
        <div className="container-bl py-20 md:py-28">
          <div className="max-w-3xl">
            <Eyebrow>For litigators</Eyebrow>
            <h1 className="mt-5 font-serif text-4xl leading-[1.06] text-navy md:text-6xl">
              Never miss a part again.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate md:text-xl">
              When two matters land on the same morning, Benchline gets a verified NY
              per diem to the courthouse — and gets you a clean report back. No
              agencies, no off-platform risk.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/waitlist" size="lg">
                Join the waitlist <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/pricing" variant="outline" size="lg">
                See pricing
              </ButtonLink>
            </div>
          </div>
          <div className="mt-12 border-t border-line pt-8">
            <TrustStrip className="justify-start" />
          </div>
        </div>
      </section>

      {/* PAIN -> SOLVE */}
      <Section>
        <SectionHeader
          eyebrow="The reality of coverage"
          title="The headaches you know — and how we end them."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {pains.map((p) => (
            <Card key={p.pain}>
              <div className="inline-flex rounded-xl bg-navy/5 p-3">
                <p.icon className="h-6 w-6 text-navy" strokeWidth={1.6} />
              </div>
              <h3 className="mt-5 text-lg text-navy">{p.pain}</h3>
              <div className="mt-3 flex gap-2.5">
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark"
                  strokeWidth={1.8}
                />
                <p className="text-[0.97rem] leading-relaxed text-slate">{p.solve}</p>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* WORKFLOW with screenshot placeholders */}
      <Section className="bg-navy">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow text-gold">
            <span className="inline-block h-px w-6 bg-gold/60" />
            The workflow
          </span>
          <h2 className="mt-4 font-serif text-3xl text-cream md:text-[2.6rem]">
            Post in the morning. Reported by lunch.
          </h2>
        </div>
        <div className="mt-14 space-y-6">
          {workflow.map((step, i) => (
            <div
              key={step.title}
              className="grid items-center gap-6 rounded-2xl border border-cream/10 bg-navy-700/40 p-6 md:grid-cols-2 md:p-8"
            >
              <div className={i % 2 ? "md:order-2" : ""}>
                <span className="font-serif text-sm font-semibold text-gold">
                  Step 0{i + 1}
                </span>
                <h3 className="mt-2 text-xl text-cream">{step.title}</h3>
                <p className="mt-2 text-cream/70">{step.desc}</p>
              </div>
              <div
                className={`flex aspect-[16/10] items-center justify-center rounded-xl border border-dashed border-cream/15 bg-navy/40 ${
                  i % 2 ? "md:order-1" : ""
                }`}
              >
                <span className="text-xs uppercase tracking-widest text-cream/35">
                  Product screenshot
                </span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader eyebrow="Questions" title="Litigator FAQ" />
        <div className="mx-auto mt-10 max-w-3xl">
          <FaqList items={faqs} />
        </div>
      </Section>

      <CtaBand
        title="Get coverage you can vouch for."
        body="Join the waitlist and we'll bring your firm online as we open NYC access."
      />
    </>
  );
}
