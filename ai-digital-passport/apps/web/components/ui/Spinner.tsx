import { Loader2, Sparkles } from "lucide-react";

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-12 text-body font-medium text-text-muted" role="status">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent">
        <Sparkles className="absolute h-4 w-4 opacity-30" />
        <Loader2 className="h-5 w-5 animate-spin" />
      </span>
      <span>{label}</span>
    </div>
  );
}
