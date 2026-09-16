"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { Spinner } from "../../../components/ui/Spinner";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { mentorCoursesApi } from "../../../lib/api";
import { 
  FileCheck, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  GraduationCap, 
  BookOpen,
  Building2,
  Calendar
} from "lucide-react";

export default function MentorCoursesQueuePage() {
  const [search, setSearch] = useState("");
  const queue = useQuery({ queryKey: ["mentor", "courses", "queue"], queryFn: mentorCoursesApi.queue });

  const rawItems = queue.data ?? [];
  const filteredItems = rawItems.filter((item) => {
    const matchesSearch = item.student.fullName.toLowerCase().includes(search.toLowerCase()) || item.student.department.toLowerCase().includes(search.toLowerCase()) || item.courseTitle.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const totalPointsPending = rawItems.reduce((sum, item) => sum + (item.pointsValue || 0), 0);

  return (
    <ConsoleShell role="MENTOR">
      <div className="space-y-6">
        
        {/* Top Header Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 lg:p-8 shadow-xs">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-gradient-to-br from-[#1755A7]/10 to-[#F8C401]/15 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-3xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1755A7]/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#1755A7]">
                  <Sparkles className="h-3.5 w-3.5 text-[#F8C401]" />
                  Faculty Review Queue
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200/60">
                  <Clock className="h-3 w-3 text-amber-600" />
                  {rawItems.length} Submissions Pending
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900">Student Course Proof Submissions</h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Review and audit completion certificates submitted for NVIDIA DLI, institutional capstones, and assigned AI courses. Approved points are credited immediately to the scholar’s competence ledger.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/mentor/course-catalog"
                className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-all active:scale-95"
              >
                <BookOpen className="h-3.5 w-3.5" />
                View Course Catalog
              </Link>
            </div>
          </div>
        </div>

        {/* 4 KPI Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Submissions in Queue</div>
            <div className="mt-2 text-2xl font-black text-amber-600">{rawItems.length} Pending</div>
            <div className="mt-1 text-xs text-slate-500">Awaiting faculty evaluation</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Point Bounty</div>
            <div className="mt-2 text-2xl font-black text-[#1755A7]">+{totalPointsPending.toLocaleString()} pts</div>
            <div className="mt-1 text-xs text-slate-500">Total points requested</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Review Turnaround SLA</div>
            <div className="mt-2 text-2xl font-black text-emerald-600">&lt; 24 Hours</div>
            <div className="mt-1 text-xs text-slate-500">Fast-track student progress</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Accreditation Protocol</div>
            <div className="mt-2 text-2xl font-black text-slate-900">Strict Audit</div>
            <div className="mt-1 text-xs text-slate-500">Certificate hash verification</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search student, department, or course title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <span className="text-xs font-bold text-slate-500">
            Showing {filteredItems.length} of {rawItems.length} submissions
          </span>
        </div>

        {/* Queue Content List */}
        {queue.isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Spinner label="Loading course submissions queue…" />
          </div>
        ) : queue.isError ? (
          <ErrorBanner error={queue.error} />
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center shadow-xs space-y-3 max-w-md mx-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="text-base font-black text-slate-900">Queue is Clear!</h3>
            <p className="text-xs text-slate-500">
              All student course completion proofs have been audited and resolved.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {filteredItems.map((e) => (
              <div
                key={e.enrollmentId}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-[#1755A7]/40 hover:shadow-md"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1755A7] text-white font-bold text-xs">
                    {e.student.fullName.charAt(0)}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900">
                        {e.student.fullName}
                      </h4>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {e.student.department}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-[#1755A7]">
                      {e.courseTitle}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-medium">
                      {e.submittedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Submitted {new Date(e.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F8C401]/15 px-2.5 py-0.5 font-mono text-xs font-black text-amber-900 border border-[#F8C401]/30">
                    <Sparkles className="h-3 w-3 text-[#F8C401]" />
                    +{e.pointsValue} pts
                  </span>

                  <Link
                    href={`/mentor/courses/detail?id=${e.enrollmentId}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#1755A7] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#134486] active:scale-95"
                  >
                    Review Proof
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </ConsoleShell>
  );
}
