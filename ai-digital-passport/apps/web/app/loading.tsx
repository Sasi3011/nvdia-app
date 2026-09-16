import { GraduationCap, Loader2, Sparkles } from "lucide-react";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="flex w-full max-w-md flex-col items-center rounded-[27px] border border-white/70 bg-white/85 p-10 text-center shadow-[0_28px_80px_rgba(11,18,32,0.14)] backdrop-blur-xl">
        <span className="relative flex h-20 w-20 items-center justify-center rounded-card bg-accent text-white shadow-[0_10px_28px_rgba(118,185,0,0.30)]">
          <Sparkles className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white p-1 text-accent shadow-sm" />
          <GraduationCap className="h-9 w-9" />
        </span>
        <h1 className="mt-6 text-h1 text-ink">AI Digital Passport</h1>
        <p className="mt-2 text-body text-text-muted">Preparing your AI power journey.</p>
        <Loader2 className="mt-6 h-6 w-6 animate-spin text-accent" />
      </section>
    </main>
  );
}
