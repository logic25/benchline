import type { Metadata } from "next";
import { SITE_URL } from "./utils";

const DEFAULT_DESC =
  "Benchline is the New York per diem attorney marketplace. Litigators post court appearances; NY-verified per diem attorneys claim them. AI-structured outcome reports, Stripe instant payouts, flat fees.";

export function buildMetadata({
  title,
  description = DEFAULT_DESC,
  path = "/",
  noIndex = false,
}: {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
}): Metadata {
  const url = `${SITE_URL}${path}`;
  const fullTitle =
    title === "Benchline" ? "Benchline — Per diem coverage, done right." : `${title} · Benchline`;
  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: "Benchline",
      type: "website",
      locale: "en_US",
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "Benchline" }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: ["/og.png"],
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
  };
}
