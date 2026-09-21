import type { ReactNode } from "react";

export function ConsolePageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h1 className="break-words text-xl font-bold tracking-tight text-ink sm:text-[26px]">{title}</h1>
        {description ? <p className="mt-1 text-xs text-text-muted sm:text-[14px]">{description}</p> : null}
      </div>
      {actions ? <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">{actions}</div> : null}
    </div>
  );
}
