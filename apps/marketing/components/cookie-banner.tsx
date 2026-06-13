"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "./ui";

const KEY = "bl_cookie_consent_v1";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true);
    } catch {
      /* storage blocked — stay hidden */
    }
  }, []);

  function dismiss(value: "accepted" | "essential") {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-2xl rounded-2xl border border-line bg-white/95 p-5 shadow-[var(--shadow-card)] backdrop-blur md:inset-x-auto md:left-1/2 md:-translate-x-1/2"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <p className="text-sm leading-relaxed text-slate">
          Benchline uses only essential cookies for authentication (via Supabase) and
          basic functionality. We don&rsquo;t run ad trackers. See our{" "}
          <Link href="/legal/privacy" className="font-medium text-navy underline">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => dismiss("essential")}>
            Essential only
          </Button>
          <Button size="sm" onClick={() => dismiss("accepted")}>
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}
