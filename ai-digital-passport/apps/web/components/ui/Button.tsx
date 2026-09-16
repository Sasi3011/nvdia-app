import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "tertiary" | "destructive";

// Design system 18.6: one primary style (filled accent) per screen;
// everything else secondary (outline) or tertiary (text link).
const VARIANTS: Record<Variant, string> = {
  primary: "border border-[#76B900] bg-accent text-[#FCFCFC] shadow-[inset_0_1px_4px_rgba(255,255,255,0.25),0_6px_18px_rgba(118,185,0,0.30)] hover:bg-accent-deep hover:border-accent-deep disabled:bg-accent/40 disabled:shadow-none font-semibold",
  secondary: "border border-[#EFEFEF] bg-[#FAFAFA] text-ink shadow-[inset_0_1px_4px_rgba(255,255,255,0.05)] hover:border-accent hover:text-accent disabled:opacity-40 disabled:shadow-none",
  tertiary: "text-accent underline-offset-2 hover:underline hover:text-accent-deep disabled:opacity-40",
  destructive: "border border-rejected text-rejected hover:bg-rejected/10 hover:shadow-[0_0_10px_#B3261E/20] disabled:opacity-40",
};

export function Button({
  variant = "secondary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={clsx(
        "inline-flex min-h-14 items-center justify-center gap-2 rounded-card px-5 py-3 text-body font-semibold transition-fast disabled:cursor-not-allowed",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
