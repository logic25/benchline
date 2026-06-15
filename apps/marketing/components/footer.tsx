import Link from "next/link";
import { LogoMark } from "./logo";
import { APP_URL } from "@/lib/utils";
import { Linkedin, Twitter } from "lucide-react";

const columns = [
  {
    title: "Product",
    links: [
      { label: "For litigators", href: "/for-litigators" },
      { label: "For per diems", href: "/for-per-diems" },
      { label: "Pricing", href: "/pricing" },
      { label: "Security", href: "/security" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Join the waitlist", href: "/waitlist" },
      { label: "Sign in", href: `${APP_URL}/login`, external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "/legal/terms" },
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "AI Data Disclosure", href: "/legal/ai-disclosure" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-navy text-cream">
      <div className="container-bl py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <span style={{ ["--logo-fg" as string]: "#0f172a" }} className="text-cream">
              <span className="inline-flex items-center gap-2.5">
                <LogoMark />
                <span className="font-serif text-[1.35rem] font-semibold tracking-tight text-cream">
                  Benchline
                </span>
              </span>
            </span>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/65">
              Per diem court coverage for New York litigators and the attorneys who
              cover for them. Built in NYC, by named operators.
            </p>
            <div className="mt-5 space-y-1 text-sm text-cream/65">
              <p>
                <a href="mailto:hello@benchline.com" className="hover:text-gold">
                  hello@benchline.com
                </a>
              </p>
              <p>
                <a href="tel:+12125550100" className="hover:text-gold">
                  (212) 555-0100
                </a>{" "}
                <span className="text-cream/40">· placeholder</span>
              </p>
              <p className="text-cream/50">
                Benchline LLC · New York, NY
                <br />
                <span className="text-cream/40">Address coming with launch</span>
              </p>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-gold">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        className="text-sm text-cream/70 hover:text-cream"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-cream/70 hover:text-cream"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-cream/10 pt-8 sm:flex-row sm:items-center">
          <p className="text-xs text-cream/50">
            © {new Date().getFullYear()} Benchline LLC. All rights reserved. Not a law
            firm; Benchline does not provide legal advice.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://www.linkedin.com"
              aria-label="Benchline on LinkedIn"
              className="text-cream/50 hover:text-gold"
            >
              <Linkedin className="h-5 w-5" />
            </a>
            <a
              href="https://twitter.com"
              aria-label="Benchline on X"
              className="text-cream/50 hover:text-gold"
            >
              <Twitter className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
