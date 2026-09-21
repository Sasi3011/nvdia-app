import { Loader2 } from "lucide-react";

export function Spinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12" role="status">
      <div className="relative flex h-16 w-16 items-center justify-center">
        {/* Background pulsing glow */}
        <div className="absolute inset-0 animate-ping rounded-full bg-[#1755A7] opacity-10" />
        {/* Gradient spinner ring */}
        <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#1755A7] border-r-[#38BDF8]" />
        {/* Inner icon */}
        <Loader2 className="h-6 w-6 animate-spin text-[#1755A7]" />
      </div>
      <span className="text-sm font-bold text-slate-500 animate-pulse">{label}</span>
    </div>
  );
}
