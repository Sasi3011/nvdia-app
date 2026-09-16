"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { Spinner } from "../../../components/ui/Spinner";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { mentorProctoringApi } from "../../../lib/api";
import { 
  Lock, 
  Sparkles, 
  Unlock, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  ShieldCheck, 
  Clock, 
  User, 
  BookOpen,
  Calendar,
  AlertCircle
} from "lucide-react";

export default function ProctoringLocksPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const locks = useQuery({ queryKey: ["mentor", "proctoring", "locks"], queryFn: mentorProctoringApi.listLocked });

  const grant = useMutation({
    mutationFn: (sessionId: string) => mentorProctoringApi.grantAccess(sessionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mentor", "proctoring", "locks"] }),
  });

  const rawLocks = locks.data ?? [];
  const filteredLocks = rawLocks.filter((s) => {
    const matchesSearch = s.student.fullName.toLowerCase().includes(search.toLowerCase()) || s.student.department.toLowerCase().includes(search.toLowerCase()) || s.task.title.toLowerCase().includes(search.toLowerCase()) || s.course.title.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <ConsoleShell role="MENTOR">
      <div className="space-y-6">
        
        {/* Top Header Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 lg:p-8 shadow-xs">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-gradient-to-br from-[#1755A7]/10 to-[#F8C401]/15 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-3xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-rose-700 border border-rose-200/60">
                  <Lock className="h-3.5 w-3.5 text-rose-600" />
                  Live Proctoring Security
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                  BR-16 Enforcement
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900">Proctoring Locks & Session Management</h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Students locked out of live-proctored coding assessments after 4 automated integrity strikes. Faculty mentors can inspect violation reasons, audit telemetry, and grant explicit retry access.
              </p>
            </div>
          </div>
        </div>

        {/* 4 KPI Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Locked Sessions</div>
            <div className="mt-2 text-2xl font-black text-rose-600">{rawLocks.length} Locked</div>
            <div className="mt-1 text-xs text-slate-500">Require mentor override</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Violation Threshold</div>
            <div className="mt-2 text-2xl font-black text-slate-900">4 Strikes</div>
            <div className="mt-1 text-xs text-slate-500">Tab switch / secondary monitor</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Security Audit Log</div>
            <div className="mt-2 text-2xl font-black text-emerald-600">Active (BR-17)</div>
            <div className="mt-1 text-xs text-slate-500">Every unlock is timestamped</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Reset Behavior</div>
            <div className="mt-2 text-2xl font-black text-[#1755A7]">Full Reset</div>
            <div className="mt-1 text-xs text-slate-500">Strikes reset on grant</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search student, course, or assessment task…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <span className="text-xs font-bold text-slate-500">
            Showing {filteredLocks.length} of {rawLocks.length} locked assessments
          </span>
        </div>

        {/* Locks Content List */}
        {locks.isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Spinner label="Loading locked assessment sessions…" />
          </div>
        ) : locks.isError ? (
          <ErrorBanner error={locks.error} />
        ) : filteredLocks.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center shadow-xs space-y-3 max-w-md mx-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="text-base font-black text-slate-900">No Locked Sessions</h3>
            <p className="text-xs text-slate-500">
              All students are currently in good academic standing with no active proctoring lockouts.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredLocks.map((s) => (
              <div
                key={s.sessionId}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50/20 p-5 shadow-xs transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700 font-bold text-xs">
                    <AlertTriangle className="h-5 w-5" />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900">
                        {s.student.fullName}
                      </h4>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {s.student.department}
                      </span>
                      <span className="rounded-full bg-rose-100 border border-rose-200 px-2 py-0.5 text-[10px] font-black text-rose-800 uppercase">
                        {s.violationCount} Violations Recorded
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-800">
                      Assessment: <span className="text-[#1755A7]">{s.task.title}</span> ({s.course.title})
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-medium">
                      {s.lockedAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          Locked on {new Date(s.lockedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-rose-100">
                  <button
                    type="button"
                    disabled={grant.isPending}
                    onClick={() => grant.mutate(s.sessionId)}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-700 disabled:opacity-50 active:scale-95"
                  >
                    <Unlock className="h-4 w-4" />
                    {grant.isPending ? "Unlocking…" : "Grant Access & Reset Strikes"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Proctoring Protocol Guidelines */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Proctoring Security Rules & Governance</h3>
              <p className="text-[11px] text-slate-500">Standard operating guidelines for faculty overrides</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 space-y-1">
              <strong className="text-slate-900 block font-bold">1. Strike Causes:</strong>
              <p>Tab switching, fullscreen exit, multi-window detection, and clipboard paste trigger automated strikes.</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 space-y-1">
              <strong className="text-slate-900 block font-bold">2. Audit Logging:</strong>
              <p>All unlock events are written to the immutable institutional security audit log with mentor credentials.</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 space-y-1">
              <strong className="text-slate-900 block font-bold">3. Re-entry Protocol:</strong>
              <p>Unlocking resets student strike count to 0, allowing an immediate fresh retry in fullscreen mode.</p>
            </div>
          </div>
        </div>

      </div>
    </ConsoleShell>
  );
}
