import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ComponentProps, ReactNode } from "react";

/* ---------- Button ---------- */
type Variant = "primary" | "outline" | "ghost" | "gold";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2";

const variants: Record<Variant, string> = {
  primary:
    "bg-navy text-cream hover:bg-navy-700 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.5)] hover:shadow-[0_12px_28px_-10px_rgba(15,23,42,0.55)]",
  gold: "bg-gold text-navy hover:bg-gold-dark hover:text-cream",
  outline: "border border-navy/20 text-navy hover:border-navy/50 hover:bg-cream",
  ghost: "text-navy hover:bg-cream",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-[0.95rem]",
  lg: "h-13 px-8 text-base py-3.5",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: { variant?: Variant; size?: Size } & ComponentProps<"button">) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props} />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  href,
  external,
  children,
  ...props
}: {
  variant?: Variant;
  size?: Size;
  href: string;
  external?: boolean;
  children: ReactNode;
} & Omit<ComponentProps<typeof Link>, "href">) {
  const cls = cn(base, variants[variant], sizes[size], className);
  if (external) {
    return (
      <a href={href} className={cls} {...(props as ComponentProps<"a">)}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...props}>
      {children}
    </Link>
  );
}

/* ---------- Section + Eyebrow ---------- */
export function Section({
  className,
  children,
  id,
}: {
  className?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className={cn("py-20 md:py-28", className)}>
      <div className="container-bl">{children}</div>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="eyebrow">
      <span className="inline-block h-px w-6 bg-gold-dark/60" />
      {children}
    </span>
  );
}

/* ---------- Card ---------- */
export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-white p-7 shadow-[var(--shadow-soft)]",
        className
      )}
    >
      {children}
    </div>
  );
}
