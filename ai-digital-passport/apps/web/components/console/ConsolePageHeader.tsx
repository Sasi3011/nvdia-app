import type { ReactNode } from "react";

export function ConsolePageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-1 text-[14px] text-text-muted">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}
