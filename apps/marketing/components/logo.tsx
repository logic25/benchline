import { cn } from "@/lib/utils";

/**
 * Benchline mark — a stylized "B" formed by a vertical column (the bench/bar)
 * and two balanced beams (scales of justice), rendered with currentColor.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("h-7 w-7", className)}
    >
      <rect x="2" y="2" width="28" height="28" rx="7" fill="currentColor" />
      <path
        d="M11 9.5h5.4c2.1 0 3.6 1.2 3.6 3.1 0 1.4-.8 2.4-2 2.8 1.5.3 2.6 1.5 2.6 3.2 0 2.1-1.6 3.4-4 3.4H11V9.5Z"
        fill="none"
        stroke="var(--logo-fg, #faf8f2)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="22.5" cy="11" r="1.4" fill="#c9a66b" />
    </svg>
  );
}

export function Logo({
  className,
  textClassName,
}: {
  className?: string;
  textClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="text-navy">
        <LogoMark />
      </span>
      <span
        className={cn(
          "font-serif text-[1.35rem] font-semibold tracking-tight text-navy",
          textClassName
        )}
      >
        Benchline
      </span>
    </span>
  );
}
