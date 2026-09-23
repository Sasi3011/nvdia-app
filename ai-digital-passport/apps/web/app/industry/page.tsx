"use client";

import Link from "next/link";
import { StudentShell } from "../../components/shell/StudentShell";
import { Building2, ArrowUpRight } from "lucide-react";

export default function IndustryPage() {
  return (
    <StudentShell>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-300">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-6 border-4 border-white shadow-sm">
          <Building2 className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
          Industry Connect is Under Development
        </h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          A directory of verified partner internships and placements isn&apos;t live yet. In the meantime, the Industry Problem Bank has real, admin-published enterprise challenges you can submit solutions against.
        </p>
        <Link
          href="/problems"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1755A7] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#134486] transition-all shadow-xs"
        >
          Explore Problem Bank
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </StudentShell>
  );
}
