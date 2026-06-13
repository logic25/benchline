"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { ButtonLink } from "./ui";
import { APP_URL } from "@/lib/utils";

const nav = [
  { label: "For litigators", href: "/for-litigators" },
  { label: "For per diems", href: "/for-per-diems" },
  { label: "Pricing", href: "/pricing" },
  { label: "Security", href: "/security" },
  { label: "About", href: "/about" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-white transition-shadow duration-300 ${
        scrolled ? "border-line shadow-sm" : "border-line/50"
      }`}
    >
      <div className="container-bl flex h-16 items-center justify-between gap-6">
        <Link href="/" aria-label="Benchline home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="link-underline text-[0.92rem] font-medium text-slate hover:text-navy"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href={`${APP_URL}/login`}
            className="text-[0.92rem] font-medium text-slate hover:text-navy"
          >
            Sign in
          </a>
          <ButtonLink href="/waitlist" size="sm">
            Join the waitlist
          </ButtonLink>
        </div>

        <button
          className="lg:hidden text-navy"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-white lg:hidden">
          <div className="container-bl flex flex-col gap-1 py-4">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-base font-medium text-slate hover:bg-cream hover:text-navy"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-line pt-4">
              <a
                href={`${APP_URL}/login`}
                className="rounded-lg px-3 py-2.5 text-base font-medium text-slate"
              >
                Sign in
              </a>
              <ButtonLink href="/waitlist" onClick={() => setOpen(false)}>
                Join the waitlist
              </ButtonLink>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
