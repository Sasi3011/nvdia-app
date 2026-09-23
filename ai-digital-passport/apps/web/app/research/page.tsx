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

        {/* Top Header Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 lg:p-8 shadow-xs">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-gradient-to-br from-[#1755A7]/10 to-[#F8C401]/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-3xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1755A7]/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#1755A7]">
                  <Sparkles className="h-3.5 w-3.5 text-[#F8C401]" />
                  Research & Patents
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900">Research Papers & Patent Filings</h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Publish a research paper or file an AI patent, then submit your proof of publication or filing for mentor review. Approved submissions credit points directly to your AI Passport.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/claims/new?category=research_patent"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1755A7] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#134486] hover:shadow-md hover:shadow-[#1755A7]/20 active:scale-95"
              >
                Submit Paper / Patent Evidence
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
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
