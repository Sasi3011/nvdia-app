import type { ReactNode } from "react";

// Design system 18.6/18.9: icon + one direct sentence naming the exact
// next action — never a bare blank area.
export function EmptyState({ icon, message, action }: { icon?: ReactNode; message: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border py-12 text-center">
      {icon ? <div className="text-text-muted">{icon}</div> : null}
      <p className="max-w-sm text-body text-text-muted">{message}</p>
      {action}
    </div>
  );
}
