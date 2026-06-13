import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders legal markdown with brand-styled prose. The component-level overrides
 * keep typography on-brand without a Tailwind typography plugin dependency.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="legal-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h1 className="mt-12 font-serif text-3xl text-navy" {...p} />,
          h2: (p) => (
            <h2
              className="mt-12 border-t border-line pt-8 font-serif text-2xl text-navy"
              {...p}
            />
          ),
          h3: (p) => <h3 className="mt-8 text-lg font-semibold text-navy" {...p} />,
          h4: (p) => (
            <h4 className="mt-6 text-base font-semibold text-navy" {...p} />
          ),
          p: (p) => <p className="mt-4 leading-relaxed text-slate" {...p} />,
          ul: (p) => (
            <ul className="mt-4 list-disc space-y-2 pl-6 text-slate" {...p} />
          ),
          ol: (p) => (
            <ol className="mt-4 list-decimal space-y-2 pl-6 text-slate" {...p} />
          ),
          li: (p) => <li className="leading-relaxed" {...p} />,
          a: (p) => (
            <a className="font-medium text-navy underline hover:text-gold-dark" {...p} />
          ),
          strong: (p) => <strong className="font-semibold text-navy" {...p} />,
          blockquote: (p) => (
            <blockquote
              className="mt-5 border-l-2 border-gold/50 bg-cream/60 py-2 pl-4 text-slate italic"
              {...p}
            />
          ),
          hr: () => <hr className="my-10 border-line" />,
          table: (p) => (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full border-collapse text-sm" {...p} />
            </div>
          ),
          th: (p) => (
            <th
              className="border border-line bg-cream px-3 py-2 text-left font-semibold text-navy"
              {...p}
            />
          ),
          td: (p) => <td className="border border-line px-3 py-2 text-slate" {...p} />,
          code: (p) => (
            <code
              className="rounded bg-cream px-1.5 py-0.5 font-mono text-sm text-navy"
              {...p}
            />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
