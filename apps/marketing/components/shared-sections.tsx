import Link from "next/link";
import { ShieldCheck, Lock, BadgeCheck, ArrowRight } from "lucide-react";
import { ButtonLink, Eyebrow } from "./ui";

/* Trust strip — used above the fold and on audience pages */
export function TrustStrip({ className = "" }: { className?: string }) {
  const items = [
    { icon: ShieldCheck, label: "Stripe-verified payouts" },
    { icon: Lock, label: "AWS Bedrock · zero data retention" },
    { icon: BadgeCheck, label: "NY-verified attorneys only" },
  ];
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-8 gap-y-3 ${className}`}
    >
      {items.map(({ icon: Icon, label }) => (
        <span
          key={label}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate"
        >
          <Icon className="h-[18px] w-[18px] text-gold-dark" strokeWidth={1.8} />
          {label}
        </span>
      ))}
    </div>
  );
}

/* Final CTA band — reused on most pages */
export function CtaBand({
  eyebrow = "Get on the list",
  title = "Be first in line when Benchline opens.",
  body = "We're onboarding pilot firms and per diem attorneys across the five boroughs. Join the waitlist and we'll reach out as we open access.",
}: {
  eyebrow?: string;
  title?: string;
  body?: string;
}) {
  return (
    <section className="py-20 md:py-28">
      <div className="container-bl">
        <div className="relative overflow-hidden rounded-3xl bg-navy px-7 py-16 text-center md:px-16 md:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(#c9a66b 1px, transparent 1px), linear-gradient(90deg, #c9a66b 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
          <div className="relative mx-auto max-w-2xl">
            <span className="eyebrow text-gold">
              <span className="inline-block h-px w-6 bg-gold/60" />
              {eyebrow}
            </span>
            <h2 className="mt-5 font-serif text-4xl text-cream md:text-5xl">{title}</h2>
            <p className="mx-auto mt-5 max-w-xl text-cream/70">{body}</p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href="/waitlist" variant="gold" size="lg">
                Join the waitlist <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <Link
                href="/pricing"
                className="text-sm font-medium text-cream/80 hover:text-gold"
              >
                See transparent pricing →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Reusable section header */
export function SectionHeader({
  eyebrow,
  title,
  body,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && (
        <div className={align === "center" ? "flex justify-center" : ""}>
          <Eyebrow>{eyebrow}</Eyebrow>
        </div>
      )}
      <h2 className="mt-4 font-serif text-3xl text-navy md:text-[2.6rem] md:leading-[1.1]">
        {title}
      </h2>
      {body && <p className="mt-4 text-lg leading-relaxed text-slate">{body}</p>}
    </div>
  );
}
