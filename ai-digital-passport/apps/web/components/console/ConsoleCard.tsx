import clsx from "clsx";
import type { HTMLAttributes } from "react";

// Console equivalent of components/ui/Card.tsx — tuned for dense admin
// and mentor screens while staying in the shared light theme.
export function ConsoleCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("rounded-card border border-border bg-white p-6 shadow-[0_2px_2.7px_rgba(0,0,0,0.15)] transition-fast hover:border-accent/30", className)} {...props} />;
}
