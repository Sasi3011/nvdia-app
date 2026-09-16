import clsx from "clsx";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("rounded-card border border-border bg-white p-6 shadow-[0_2px_2.7px_rgba(0,0,0,0.15)] transition-fast hover:border-accent/40 hover:shadow-[0_8px_22px_rgba(118,185,0,0.12)]", className)} {...props} />;
}
