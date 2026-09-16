import clsx from "clsx";
import type { HTMLAttributes } from "react";

export function ConsoleCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={clsx("rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-[#1755A7]/40", className)} 
      {...props} 
    />
  );
}
