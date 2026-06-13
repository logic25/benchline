import { ShieldCheck, Zap, BadgeCheck } from "lucide-react";
import { Eyebrow } from "@/components/ui";
import { WaitlistForm } from "@/components/waitlist-form";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Join the waitlist",
  path: "/waitlist",
  description:
    "Join the Benchline waitlist. NY litigators and per diem attorneys — be first in line as we open access to NYC's modern per diem coverage marketplace.",
});

const points = [
  { icon: BadgeCheck, text: "Priority onboarding as we open your borough" },
  { icon: Zap, text: "First look at instant payouts and AI outcome reports" },
  { icon: ShieldCheck, text: "No spam — only Benchline updates, ever" },
];

export default function WaitlistPage() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: "radial-gradient(70% 60% at 50% 0%, #faf8f2 0%, #ffffff 55%)",
        }}
      />
      <div className="container-bl py-16 md:py-24">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <div className="lg:pt-6">
            <Eyebrow>Join the waitlist</Eyebrow>
            <h1 className="mt-5 font-serif text-4xl leading-[1.06] text-navy md:text-5xl">
              Be first in line when Benchline opens.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate">
              We&rsquo;re onboarding pilot firms and per diem attorneys across the five
              boroughs. Tell us a little about you and we&rsquo;ll reach out as we open
              access.
            </p>
            <ul className="mt-8 space-y-4">
              {points.map((p) => (
                <li key={p.text} className="flex items-center gap-3">
                  <span className="inline-flex rounded-lg bg-gold/12 p-2">
                    <p.icon className="h-5 w-5 text-gold-dark" strokeWidth={1.8} />
                  </span>
                  <span className="text-slate">{p.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <WaitlistForm />
          </div>
        </div>
      </div>
    </section>
  );
}
