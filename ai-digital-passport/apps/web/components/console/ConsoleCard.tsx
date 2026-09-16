import clsx from "clsx";
import type { HTMLAttributes } from "react";

export function ConsoleCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={clsx("rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm transition-all hover:border-[#1A56DB]/30", className)} 
      {...props} 
    />
  );
}
