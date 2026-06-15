import Link from "next/link";
import { MapPin, Phone, Mail, ShieldCheck, ArrowRight } from "lucide-react";
import { Section, Eyebrow, ButtonLink, Card } from "@/components/ui";
import { CtaBand, SectionHeader } from "@/components/shared-sections";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About",
  path: "/about",
  description:
    "Benchline is built by two NYC operators — with a real phone number, a real address, and a compliance-first posture. Founder-funded.",
});

const founders = [
  {
    name: "Manny Russell",
    role: "Co-founder · Engineering & product",
    bio: "Software engineer based in New York. Builds the product, infrastructure, and security. Partners with a NY attorney on every legal and compliance decision so the platform reflects how NYC litigation actually works.",
    initials: "M",
  },
  {
    name: "[Co-founder Name]",
    role: "Co-founder · Legal & compliance",
    bio: "NYC litigator leading legal, compliance, and attorney experience. Believes per diem coverage should be verifiable, fast, and fair to both sides.",
    initials: "C",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-cream">
        <div className="container-bl py-20 md:py-28">
          <div className="max-w-3xl">
            <Eyebrow>About Benchline</Eyebrow>
            <h1 className="mt-5 font-serif text-4xl leading-[1.06] text-navy md:text-6xl">
              Real founders. Real New York.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate md:text-xl">
              Benchline is built by two NYC founders — a software engineer and a New
              York attorney — who&rsquo;ve seen the per diem scramble up close. Our
              names, our phone number, and our address are all on this site, because
              trust starts with knowing exactly who you&rsquo;re dealing with.
            </p>
          </div>
        </div>
      </section>

      {/* WHY WE BUILT THIS */}
      <Section>
        <div className="mx-auto max-w-3xl">
          <Eyebrow>Why we built this</Eyebrow>
          <div className="mt-6 space-y-5 text-lg leading-relaxed text-slate">
            <p>
              Every NYC litigator knows the feeling: two matters, two courthouses, one
              morning. The usual fixes are an email blast to a few colleagues, a
              last-minute call to an agency that takes a big cut, or a per diem you
              found off-platform and can&rsquo;t fully vet.
            </p>
            <p>
              We thought coverage deserved better infrastructure — verified attorneys on
              both sides, transparent flat fees instead of fee-splitting, structured
              reports instead of &ldquo;it went fine,&rdquo; and payouts that land in
              minutes instead of weeks.
            </p>
            <p>
              So we built Benchline in New York, for New York, with the local rules and
              the real courthouses in mind. No placeholder phone number. No anonymous
              founders. An engineer and an attorney building the tool we wished
              existed.
            </p>
          </div>
        </div>
      </Section>

      {/* FOUNDERS */}
      <Section className="bg-cream pt-0">
        <SectionHeader eyebrow="The founders" title="The people behind Benchline" />
        <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
          {founders.map((f) => (
            <Card key={f.name}>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy font-serif text-xl text-cream">
                {f.initials}
              </div>
              <h3 className="mt-5 text-lg text-navy">{f.name}</h3>
              <p className="text-sm font-medium text-gold-dark">{f.role}</p>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-slate">{f.bio}</p>
            </Card>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-3xl text-center text-xs text-slate-light">
          Founder bios are placeholders pending final copy and headshots.
        </p>
      </Section>

      {/* COMPLIANCE POSTURE */}
      <Section>
        <div className="grid items-start gap-10 md:grid-cols-2">
          <SectionHeader
            align="left"
            eyebrow="Our compliance posture"
            title="Compliance-first, not compliance-eventually."
            body="We architected Benchline around the rules that govern attorney conduct and data — not as an afterthought."
          />
          <div className="space-y-3">
            {[
              "Flat technology fees designed around RPC 5.4 and NYSBA Opinion 1113",
              "Verified NY bar status and malpractice insurance on both sides",
              "AI processing with zero data retention and pre-transmission redaction",
              "Conflict-of-interest auto-check before every claim",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-xl border border-line bg-white px-5 py-4"
              >
                <ShieldCheck
                  className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark"
                  strokeWidth={1.8}
                />
                <span className="text-[0.95rem] text-slate">{item}</span>
              </div>
            ))}
            <Link
              href="/security"
              className="inline-flex items-center gap-1.5 pt-2 text-sm font-medium text-navy hover:text-gold-dark"
            >
              Read our full security &amp; compliance disclosures{" "}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Section>

      {/* CONTACT + INVESTORS */}
      <Section className="bg-navy">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <span className="eyebrow text-gold">
              <span className="inline-block h-px w-6 bg-gold/60" />
              Find us
            </span>
            <h2 className="mt-4 font-serif text-3xl text-cream">
              We&rsquo;re reachable. On purpose.
            </h2>
            <div className="mt-6 space-y-4 text-cream/80">
              <p className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gold" strokeWidth={1.8} />
                Benchline LLC · New York, NY{" "}
                <span className="text-cream/40">(address at launch)</span>
              </p>
              <p className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gold" strokeWidth={1.8} />
                <a href="tel:+12125550100" className="hover:text-gold">
                  (212) 555-0100
                </a>
                <span className="text-cream/40">— placeholder</span>
              </p>
              <p className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gold" strokeWidth={1.8} />
                <a href="mailto:hello@benchline.com" className="hover:text-gold">
                  hello@benchline.com
                </a>
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-cream/10 bg-navy-700/40 p-8">
            <span className="eyebrow text-gold">
              <span className="inline-block h-px w-6 bg-gold/60" />
              Backing
            </span>
            <h3 className="mt-4 font-serif text-2xl text-cream">Founder-funded.</h3>
            <p className="mt-3 text-cream/70">
              Benchline has no outside investors today — it&rsquo;s funded by its
              founders. That keeps our incentives simple: build something attorneys
              trust, and earn a fair flat fee for it.
            </p>
          </div>
        </div>
      </Section>

      <CtaBand
        title="Build the network with us."
        body="We're onboarding NYC pilot firms and per diem attorneys now. Put your name on the list."
      />
    </>
  );
}
