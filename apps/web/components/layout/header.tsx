'use client';

interface HeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function Header({ title, description, action }: HeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-border/70 pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl space-y-2">
      <h1 className="font-heading text-3xl font-normal tracking-[-0.02em] text-foreground md:text-[2rem] md:leading-tight">
        {title}
      </h1>
      {description && <p className="text-sm leading-relaxed text-muted-foreground md:text-base">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}
