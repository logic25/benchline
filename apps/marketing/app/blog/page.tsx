import { Clock } from "lucide-react";
import { Eyebrow } from "@/components/ui";
import { CtaBand } from "@/components/shared-sections";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Blog",
  path: "/blog",
  description:
    "Notes on per diem coverage, court-appearance reporting, AI, and the ethics of legal-tech platform fees — from the Benchline team.",
});

const posts = [
  {
    title: "What NYC litigators get wrong about per diem coverage",
    category: "Practice",
    note: "Coming soon",
  },
  {
    title: "How AI is changing court appearance reports",
    category: "Product",
    note: "Coming soon",
  },
  {
    title: "RPC 5.4, technology platform fees, and why structure matters",
    category: "Compliance",
    note: "Coming soon",
  },
];

export default function BlogPage() {
  return (
    <>
      <section className="bg-cream">
        <div className="container-bl py-20 text-center md:py-24">
          <div className="mx-auto max-w-2xl">
            <Eyebrow>The Benchline blog</Eyebrow>
            <h1 className="mt-5 font-serif text-4xl leading-[1.06] text-navy md:text-6xl">
              Notes from the bench.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate md:text-xl">
              Writing on per diem coverage, court-appearance reporting, and the ethics
              of legal-tech. First posts publish as we launch.
            </p>
          </div>
        </div>
      </section>

      <div className="container-bl py-16 md:py-20">
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.title}
              className="flex flex-col rounded-2xl border border-line bg-white p-7 shadow-[var(--shadow-soft)]"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-gold-dark">
                {post.category}
              </span>
              <h2 className="mt-3 font-serif text-xl leading-snug text-navy">
                {post.title}
              </h2>
              <div className="mt-auto pt-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1 text-xs font-medium text-slate-light">
                  <Clock className="h-3.5 w-3.5" /> {post.note}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>

      <CtaBand
        title="Want these in your inbox?"
        body="Join the waitlist — we'll share new writing and product updates as Benchline opens."
      />
    </>
  );
}
