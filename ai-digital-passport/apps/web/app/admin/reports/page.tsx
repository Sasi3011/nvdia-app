"use client";

import { useQuery } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { adminReportsApi } from "../../../lib/api";
import { Download, Award, ShieldCheck, Rocket, Code2, TrendingUp, BarChart3, PieChart, CheckCircle2 } from "lucide-react";

export default function AdminReportsPage() {
  const summary = useQuery({ queryKey: ["admin", "reports", "summary"], queryFn: adminReportsApi.summary });

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader
        title="Institutional Analytics & Reports"
        description="Comprehensive cohort distributions, points breakdown, startup stages, and accreditation metrics."
        actions={
          <a
            href={adminReportsApi.claimsExportUrl()}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] via-[#1A5EB7] to-[#2563EB] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1D4ED8] transition-all active:scale-95"
          >
            <Download className="h-4 w-4" />
            <span>Export Claims CSV</span>
          </a>
        }
      />

      {summary.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner label="Generating analytics report..." />
        </div>
      ) : summary.isError ? (
        <ErrorBanner error={summary.error} />
      ) : summary.data ? (
        <div className="flex flex-col gap-6">

          {/* Quick Metric Tiles */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Problem Bank Submissions</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
                  <Code2 className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {summary.data.problemBank.submissionCount.toLocaleString()}
                </span>
                <span className="text-[11px] font-bold text-emerald-600 inline-flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" /> Active
                </span>
              </div>
              <div className="mt-3 text-[11px] text-slate-500 border-t border-slate-100 pt-2.5 flex items-center justify-between">
                <span>Distinct Submitters:</span>
                <span className="font-bold text-slate-800">{summary.data.problemBank.distinctSubmitters.toLocaleString()}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Startups & Incubations</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8C401]/20 text-slate-900">
                  <Rocket className="h-4.5 w-4.5 text-amber-700" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {summary.data.startupStageDistribution.reduce((acc, s) => acc + s.count, 0)}
                </span>
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Venture Pipeline
                </span>
              </div>
              <div className="mt-3 text-[11px] text-slate-500 border-t border-slate-100 pt-2.5 flex items-center justify-between">
                <span>Stage 4-5 Active:</span>
                <span className="font-bold text-[#1755A7]">
                  {summary.data.startupStageDistribution.filter(s => s.stage >= 4).reduce((acc, s) => acc + s.count, 0)} Ventures
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Points Awarded</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
                  <Award className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#1755A7]">
                  {summary.data.pointsByCategory.reduce((acc, c) => acc + c.totalPointsAwarded, 0).toLocaleString()}
                </span>
                <span className="text-[11px] font-bold text-slate-500">pts</span>
              </div>
              <div className="mt-3 text-[11px] text-slate-500 border-t border-slate-100 pt-2.5 flex items-center justify-between">
                <span>Approved Claims:</span>
                <span className="font-bold text-slate-800">
                  {summary.data.pointsByCategory.reduce((acc, c) => acc + c.approvedCount, 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Accredited Cohort</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8C401]/20 text-slate-900">
                  <ShieldCheck className="h-4.5 w-4.5 text-amber-700" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {summary.data.levelDistribution.reduce((acc, l) => acc + l.count, 0).toLocaleString()}
                </span>
                <span className="text-[11px] font-bold text-emerald-600">Students</span>
              </div>
              <div className="mt-3 text-[11px] text-slate-500 border-t border-slate-100 pt-2.5 flex items-center justify-between">
                <span>Verified Level 3+:</span>
                <span className="font-bold text-[#1755A7]">
                  {summary.data.levelDistribution.filter(l => l.levelId >= 3).reduce((acc, l) => acc + l.count, 0)} Students
                </span>
              </div>
            </div>
          </div>

          {/* 2-Column Analytics Visual Grids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Visual 1: Points By Category Breakdown */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="h-4.5 w-4.5 text-[#1755A7]" />
                    Points Awarded by Category
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Distribution of accredited points across learning pillars
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {summary.data.pointsByCategory.map((cat, i) => {
                  const maxPoints = Math.max(...summary.data.pointsByCategory.map(c => c.totalPointsAwarded), 1);
                  const pct = Math.round((cat.totalPointsAwarded / maxPoints) * 100);
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="capitalize text-slate-800">{cat.category.replace(/_/g, " ")}</span>
                        <div className="flex items-center gap-3 font-mono">
                          <span className="text-slate-400 text-[11px]">{cat.approvedCount} approved</span>
                          <span className="font-bold text-[#1755A7]">{cat.totalPointsAwarded.toLocaleString()} pts</span>
                        </div>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div 
                          className="h-full rounded-full bg-[#1755A7] transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Visual 2: Level Progression Breakdown */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <PieChart className="h-4.5 w-4.5 text-[#F8C401]" />
                    Student Competency Level Distribution
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live distribution across Tier 1 through Tier 6
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {summary.data.levelDistribution
                  .sort((a, b) => a.levelId - b.levelId)
                  .map((lvl) => {
                    const totalStudents = summary.data.levelDistribution.reduce((acc, l) => acc + l.count, 0) || 1;
                    const pct = Math.round((lvl.count / totalStudents) * 100);
                    return (
                      <div key={lvl.levelId} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-800 flex items-center gap-1.5">
                            <span className="font-bold text-[#1755A7]">Level {lvl.levelId}</span>
                          </span>
                          <span className="font-mono text-slate-600 font-bold">
                            {lvl.count.toLocaleString()} students <span className="text-[11px] font-normal text-slate-400">({pct}%)</span>
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              lvl.levelId >= 5 ? "bg-[#F8C401]" : "bg-[#1755A7]"
                            }`}
                            style={{ width: `${pct * 2}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Visual 3: Startup Stage Pipeline */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Rocket className="h-4.5 w-4.5 text-[#1755A7]" />
                    Startup Stage Pipeline
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Student ventures in ideation, MVP, revenue, and scaling
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {summary.data.startupStageDistribution
                  .sort((a, b) => a.stage - b.stage)
                  .map((stg) => {
                    const stageNames = ["Idea Validation", "Prototype / MVP", "Alpha Testing", "Revenue / Grants", "Incorporation & Scale"];
                    return (
                      <div key={stg.stage} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1755A7]/10 font-mono text-xs font-bold text-[#1755A7]">
                            S{stg.stage}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-slate-900">
                              {stageNames[stg.stage - 1] ?? `Stage ${stg.stage}`}
                            </span>
                          </div>
                        </div>
                        <span className="font-mono text-xs font-black text-slate-900">
                          {stg.count} ventures
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Visual 4: Claims Status Breakdown */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                    Verification Claims Status
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live tally of approved, pending, and audited claims
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {summary.data.claimsByStatus.map((claim, i) => (
                  <div key={i} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-slate-50">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                      claim.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                      claim.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {claim.status}
                    </span>
                    <span className="font-mono text-sm font-black text-slate-900">
                      {claim.count.toLocaleString()} claims
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      ) : null}
    </ConsoleShell>
  );
}
