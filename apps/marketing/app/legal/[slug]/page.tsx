import { notFound } from "next/navigation";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { AlertTriangle } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { buildMetadata } from "@/lib/seo";

type LegalDoc = {
  file: string;
  title: string;
  eyebrow: string;
  description: string;
  updated: string;
};

const DOCS: Record<string, LegalDoc> = {
  terms: {
    file: "terms.md",
    title: "Terms of Service",
    eyebrow: "Legal",
    description: "The terms that govern use of the Benchline platform.",
    updated: "June 13, 2026",
  },
  privacy: {
    file: "privacy.md",
    title: "Privacy Policy",
    eyebrow: "Legal",
    description: "How Benchline collects, uses, and protects your information.",
    updated: "June 13, 2026",
  },
  "ai-disclosure": {
    file: "ai-disclosure.md",
    title: "AI Data Processing Disclosure",
    eyebrow: "Legal",
    description:
      "How Benchline uses AI to process outcome reports — and the zero data-retention guarantee.",
    updated: "June 13, 2026",
  },
};

export function generateStaticParams() {
  return Object.keys(DOCS).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = DOCS[slug];
  if (!doc) return {};
  return buildMetadata({
    title: doc.title,
    path: `/legal/${slug}`,
    description: doc.description,
  });
}

/** Strip the leading H1 + the draft NOTICE blockquote (we render our own). */
function cleanMarkdown(raw: string): string {
  const lines = raw.split("\n");
  const out: string[] = [];
  let removedH1 = false;
  let skippingNotice = false;
  for (const line of lines) {
    if (!removedH1 && /^#\s+/.test(line)) {
      removedH1 = true;
      continue;
    }
    // Drop the "Last Updated" line (shown in the header instead)
    if (/^\*\*Last Updated/i.test(line.trim())) continue;
    if (/^>\s*\*\*NOTICE/i.test(line)) {
      skippingNotice = true;
      continue;
    }
    if (skippingNotice) {
      if (line.trim().startsWith(">") || line.trim() === "") {
        if (line.trim() === "") skippingNotice = false;
        continue;
      }
      skippingNotice = false;
    }
    out.push(line);
  }
  return out.join("\n").replace(/^\s*-{3,}\s*$/m, "").trimStart();
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = DOCS[slug];
  if (!doc) notFound();

  const raw = await readFile(
    path.join(process.cwd(), "content", "legal", doc.file),
    "utf8"
  );
  const body = cleanMarkdown(raw);

  return (
    <article>
      <section className="border-b border-line bg-cream">
        <div className="container-bl py-16 md:py-20">
          <div className="mx-auto max-w-3xl">
            <span className="eyebrow">
              <span className="inline-block h-px w-6 bg-gold-dark/60" />
              {doc.eyebrow}
            </span>
            <h1 className="mt-4 font-serif text-4xl text-navy md:text-5xl">
              {doc.title}
            </h1>
            <p className="mt-3 text-sm text-slate-light">Last updated: {doc.updated}</p>
          </div>
        </div>
      </section>

      <div className="container-bl py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          {/* Draft banner */}
          <div
            role="note"
            className="flex items-start gap-3 rounded-2xl border border-gold/40 bg-gold/[0.08] p-5"
          >
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark"
              strokeWidth={1.8}
            />
            <p className="text-sm leading-relaxed text-navy">
              <strong className="font-semibold">Draft — pending attorney review.</strong>{" "}
              This document is a first draft prepared for review and has not been
              finalized by a licensed attorney. It is not legal advice and should not be
              relied upon as a final legal document.
            </p>
          </div>

          <div className="mt-2">
            <Markdown>{body}</Markdown>
          </div>
        </div>
      </div>
    </article>
  );
}
