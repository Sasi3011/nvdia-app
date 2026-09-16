"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { adminAuditApi } from "../../../lib/api";
import { Award, Play, Calendar, Trophy, Users, ShieldCheck, ChevronRight } from "lucide-react";

export default function AdminAuditPage() {
  const queryClient = useQueryClient();
  const [academicYear, setAcademicYear] = useState("2025-2026");
  const [candidateCount, setCandidateCount] = useState(25);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const runs = useQuery({ queryKey: ["admin", "audit", "runs"], queryFn: adminAuditApi.listRuns });
  const runDetail = useQuery({
    queryKey: ["admin", "audit", "run", selectedRunId],
    queryFn: () => adminAuditApi.getRun(selectedRunId!),
    enabled: !!selectedRunId,
  });

  const trigger = useMutation({
    mutationFn: () => adminAuditApi.run(academicYear, candidateCount),
    onSuccess: (res) => {
      setSelectedRunId(res.auditRunId);
      queryClient.invalidateQueries({ queryKey: ["admin", "audit", "runs"] });
    },
  });

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader 
        title="Annual Supercomputing Audit & Awards Roster" 
        description="Execute annual institutional audits to evaluate top cohort performance and generate high-impact fellowship rosters." 
      />

      {/* Trigger Audit Card */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="h-4.5 w-4.5 text-[#F8C401]" />
              Trigger Fellowship Audit Run
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Processes cohort verifications, patents, problem scores, and ranks fellowship recipients
            </p>
          </div>
        </div>

        <form
          className="mt-4 flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            trigger.mutate();
          }}
        >
          {trigger.isError ? <div className="w-full"><ErrorBanner error={trigger.error} /></div> : null}
          
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-700">Academic Year</span>
            <input 
              required 
              placeholder="2025-2026" 
              value={academicYear} 
              onChange={(e) => setAcademicYear(e.target.value)} 
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7]" 
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-700">Candidate Count</span>
            <input
              type="number"
              min={1}
              max={100}
              value={candidateCount}
              onChange={(e) => setCandidateCount(Number(e.target.value))}
              className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7]"
            />
          </label>

          <button 
            type="submit" 
            disabled={trigger.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] via-[#1A5EB7] to-[#2563EB] px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1D4ED8] transition-all disabled:opacity-50 active:scale-95"
          >
            <Play className="h-3.5 w-3.5" />
            {trigger.isPending ? "Evaluating Cohort..." : "Execute Audit"}
          </button>
        </form>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 items-start">
        {/* Past Runs Column */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-[#1755A7]" />
              Historical Audit Runs
            </h2>
          </div>

          {runs.isLoading ? (
            <div className="py-8 flex justify-center"><Spinner label="Loading runs..." /></div>
          ) : runs.isError ? (
            <ErrorBanner error={runs.error} />
          ) : !runs.data || runs.data.length === 0 ? (
            <p className="mt-4 text-xs text-slate-500">No past audit runs yet.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {runs.data.map((r) => {
                const isSelected = r.auditRunId === selectedRunId;
                return (
                  <button
                    key={r.auditRunId}
                    type="button"
                    onClick={() => setSelectedRunId(r.auditRunId)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                      isSelected 
                        ? "border-[#1755A7] bg-[#1755A7]/5 shadow-xs" 
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs text-slate-900">{r.academicYear}</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {r.candidateCount} fellows shortlisted &bull; {new Date(r.runAt).toLocaleDateString()}
                      </p>
                    </div>
                    <ChevronRight className={`h-4 w-4 ${isSelected ? "text-[#1755A7]" : "text-slate-400"}`} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Roster Column */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="h-4.5 w-4.5 text-[#F8C401]" />
              Fellowship Award Roster
            </h2>
          </div>

          {!selectedRunId ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Select an audit run from the left to view the candidate roster and award ranks.
            </div>
          ) : runDetail.isLoading ? (
            <div className="py-8 flex justify-center"><Spinner label="Loading roster..." /></div>
          ) : runDetail.isError ? (
            <ErrorBanner error={runDetail.error} />
          ) : !runDetail.data?.candidates.length ? (
            <p className="mt-4 text-xs text-slate-500">No candidates found in this run.</p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {runDetail.data.candidates.map((c) => (
                <div key={c.candidateId} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg font-mono font-black text-xs ${
                      c.rank === 1 ? "bg-[#F8C401] text-slate-900" :
                      c.rank === 2 ? "bg-slate-200 text-slate-800" :
                      c.rank === 3 ? "bg-amber-100 text-amber-900" :
                      "bg-slate-100 text-slate-600"
                    }`}>
                      #{c.rank}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900">{c.user.fullName}</span>
                      <p className="text-[11px] text-slate-400">{c.user.email}</p>
                    </div>
                  </div>
                  <span className="font-mono font-black text-[#1755A7] text-xs">
                    {c.totalPoints.toLocaleString()} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ConsoleShell>
  );
}
