import clsx from "clsx";

export type Status = "PENDING" | "APPROVED" | "REJECTED";

const LABELS: Record<Status, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const STYLES: Record<Status, string> = {
  PENDING: "bg-pending/10 text-pending",
  APPROVED: "bg-accent/10 text-accent-deep",
  REJECTED: "bg-rejected/10 text-rejected",
};

// Design system 18.6: pill shape, status color at 12% opacity with
// full-strength text, plus the word — status is never color-only.
export function StatusChip({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-3 py-1 text-caption font-medium",
        STYLES[status],
        className,
      )}
    >
      {LABELS[status]}
    </span>
  );
}
