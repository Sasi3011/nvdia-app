import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "tertiary" | "destructive" | "success";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-[#1755A7] via-[#1A5EB7] to-[#2563EB] text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:via-[#1755A7] hover:to-[#1D4ED8] active:scale-95 disabled:opacity-50 disabled:pointer-events-none font-bold",
  secondary:
    "border border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 active:scale-95 disabled:bg-slate-50 disabled:text-slate-400 font-bold",
  tertiary:
    "text-[#1755A7] hover:text-[#124282] hover:underline underline-offset-4 active:scale-95 disabled:opacity-40 font-semibold",
  destructive:
    "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300 active:scale-95 disabled:opacity-40 font-bold",
  success:
    "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 active:scale-95 disabled:opacity-40 font-bold",
};

export function Button({
  variant = "secondary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs transition-all duration-150 cursor-pointer disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#1755A7]/30",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}

