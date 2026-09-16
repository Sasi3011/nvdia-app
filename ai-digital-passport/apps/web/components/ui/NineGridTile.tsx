import Link from "next/link";
import type { ReactNode } from "react";

// Design system 18.6: icon + label; locked state uses reduced opacity
// (~40%), a small lock glyph, and a caption "Requires Level N" rather than
// hiding the tile — motivates progression (spec 01 Section 4).
export function NineGridTile({
  href,
  label,
  icon,
  locked,
  requiredLevel,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  locked?: boolean;
  requiredLevel?: number;
}) {
  const content = (
    <div
      className={
        "flex h-full flex-col items-center justify-center gap-2 rounded-card border border-border bg-surface p-4 text-center transition-fast" +
        (locked ? " opacity-40" : " hover:border-navy-700 hover:shadow-sm")
      }
    >
      <div className="relative text-navy-700">
        {icon}
        {locked && (
          <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-surface" aria-hidden>
            <LockIcon />
          </span>
        )}
      </div>
      <span className="text-body font-medium text-ink">{label}</span>
      {locked && requiredLevel ? <span className="text-caption text-text-muted">Requires Level {requiredLevel}</span> : null}
    </div>
  );

  if (locked) {
    return (
      <div aria-disabled="true" className="block h-28">
        {content}
      </div>
    );
  }

  return (
    <Link href={href} className="block h-28">
      {content}
    </Link>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
