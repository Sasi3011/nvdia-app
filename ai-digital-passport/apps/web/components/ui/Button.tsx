import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "tertiary" | "destructive";

// Design system 18.6: one primary style (filled accent) per screen;
// everything else secondary (outline) or tertiary (text link).
const VARIANTS: Record<Variant, string> = {
  primary: "border border-accent bg-accent text-white shadow-sm hover:bg-accent-deep hover:border-accent-deep disabled:bg-accent/40 disabled:shadow-none font-semibold transition-all",
  secondary: "border border-border bg-white text-ink shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:border-text-muted hover:bg-surface-muted disabled:bg-white disabled:text-text-muted disabled:border-border font-medium",
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
