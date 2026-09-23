"use client";

import Link from "next/link";
import { StudentShell } from "../../components/shell/StudentShell";
import { useScoringPoints } from "../../lib/use-scoring-points";
import {
  Sparkles,
  BookOpen,
  ArrowUpRight,
  Award,
} from "lucide-react";

export default function ResearchPage() {
  const researchPoints = useScoringPoints("research_patent");

  return (
    <StudentShell>
      <div className="space-y-6">

        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Research Papers & Patent Filings
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Submit proof of published research or AI patents to earn points directly to your AI Passport.
            </p>
          </div>
          <Link
            href="/claims/new?category=research_patent"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] via-[#1A5EB7] to-[#2563EB] px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1D4ED8] transition-all active:scale-95 shrink-0"
          >
            <Sparkles className="h-4 w-4 text-[#F8C401]" />
            <span>Submit Paper / Patent Evidence</span>
          </Link>
        </div>

        {/* Real KPI — the only fact this feature actually has: the live scoring-matrix point value */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs max-w-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Points Awarded on Approval</div>
          <div className="mt-2 text-2xl font-black text-[#1755A7]">{researchPoints != null ? `+${researchPoints} pts` : "—"}</div>
          <div className="mt-1 text-xs text-slate-500">Set by admin in the scoring matrix</div>
        </div>

        {/* How it works */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">How Research & Patent Points Work</h3>
              <p className="text-[11px] text-slate-500">Same evidence pipeline as every other module — no separate approval process</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 text-xs text-slate-600">
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 space-y-1">
              <strong className="text-slate-900 block font-bold flex items-center gap-1.5"><Award className="h-3.5 w-3.5 text-[#1755A7]" />1. Publish or file</strong>
              <p>Get your paper accepted at a journal/conference, or file a patent application.</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 space-y-1">
              <strong className="text-slate-900 block font-bold flex items-center gap-1.5"><Award className="h-3.5 w-3.5 text-[#1755A7]" />2. Submit proof</strong>
              <p>Upload the DOI link, acceptance letter, or patent filing number as evidence.</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 space-y-1">
              <strong className="text-slate-900 block font-bold flex items-center gap-1.5"><Award className="h-3.5 w-3.5 text-[#1755A7]" />3. Mentor review</strong>
              <p>A faculty mentor verifies the claim, and points credit instantly to your AI Passport on approval.</p>
            </div>
          </div>
        </div>

      </div>
    </StudentShell>
  );
}
