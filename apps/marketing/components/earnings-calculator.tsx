"use client";

import { useState } from "react";
import { Zap } from "lucide-react";

export function EarningsCalculator() {
  const [appearances, setAppearances] = useState(12);
  const [rate, setRate] = useState(150);

  const gross = appearances * rate;
  const fee = appearances * 35; // assume in-person flat platform fee, paid by litigator
  const annual = gross * 12;
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-[var(--shadow-card)]">
      <div className="grid md:grid-cols-2">
        {/* Controls */}
        <div className="p-8 md:p-10">
          <div className="space-y-8">
            <div>
              <div className="flex items-baseline justify-between">
                <label
                  htmlFor="appearances"
                  className="text-sm font-medium text-navy"
                >
                  Appearances per month
                </label>
                <span className="font-serif text-2xl text-gold-dark">
                  {appearances}
                </span>
              </div>
              <input
                id="appearances"
                type="range"
                min={1}
                max={40}
                value={appearances}
                onChange={(e) => setAppearances(Number(e.target.value))}
                className="mt-4 w-full accent-[#a8853f]"
                aria-valuetext={`${appearances} appearances`}
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <label htmlFor="rate" className="text-sm font-medium text-navy">
                  Your average rate per appearance
                </label>
                <span className="font-serif text-2xl text-gold-dark">
                  {fmt(rate)}
                </span>
              </div>
              <input
                id="rate"
                type="range"
                min={75}
                max={500}
                step={25}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="mt-4 w-full accent-[#a8853f]"
                aria-valuetext={`${rate} dollars`}
              />
            </div>

            <p className="text-xs leading-relaxed text-slate-light">
              You set your own rate — Benchline never marks it down. The flat platform
              fee is paid on top by the litigator, not skimmed from your fee.
            </p>
          </div>
        </div>

        {/* Result */}
        <div className="flex flex-col justify-center bg-navy p-8 text-cream md:p-10">
          <span className="text-xs uppercase tracking-widest text-cream/50">
            Projected monthly earnings
          </span>
          <p className="mt-2 font-serif text-5xl text-cream md:text-6xl">
            {fmt(gross)}
          </p>
          <div className="mt-6 space-y-2 border-t border-cream/10 pt-5 text-sm">
            <div className="flex justify-between text-cream/70">
              <span>Per year (at this pace)</span>
              <span className="font-medium text-cream">{fmt(annual)}</span>
            </div>
            <div className="flex justify-between text-cream/70">
              <span>What agencies might skim (~20%)</span>
              <span className="font-medium text-gold">+{fmt(gross * 0.2)}/mo kept</span>
            </div>
          </div>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold/15 px-3 py-1.5 text-xs font-medium text-gold">
            <Zap className="h-3.5 w-3.5" /> Paid out in ~30 min via Stripe
          </div>
        </div>
      </div>
    </div>
  );
}
