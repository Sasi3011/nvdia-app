"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PROBLEM_BANK_MIN_LEVEL } from "@ai-digital-passport/shared-types";
import { StudentShell } from "../../components/shell/StudentShell";
import { ConsolePageHeader } from "../../components/console/ConsolePageHeader";
import { CustomSelect } from "../../components/ui/CustomSelect";
import { Spinner } from "../../components/ui/Spinner";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { problemsApi, type FileAttachment, type ProblemResponse } from "../../lib/api";
import { AttachmentViewer } from "../../components/shared/AttachmentViewer";
import { PROBLEM_STAGE_FORMS, PROBLEM_STAGES } from "../../lib/problem-stages";
import { useMe } from "../../lib/session";
import {
  Lightbulb,
  Search,
  Sparkles,
  Building2,
  ArrowUpRight,
  Lock,
  CheckCircle2,
  X,
  Send,
  Eye,
  Clock,
  AlertCircle,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { safeUrl } from "../../lib/safe-url";

// Same layout as the admin Industry Problem Bank page (header, KPI cards,
// search, table, view modal); students get Start/Continue Solution instead
// of the admin's edit/publish/delete actions.
export default function ProblemsPage() {
  const me = useMe(true);
  const [search, setSearch] = useState("");
  const [selectedOrg, setSelectedOrg] = useState("ALL");
  const [openProblem, setOpenProblem] = useState<ProblemResponse | null>(null);
  const [viewing, setViewing] = useState<ProblemResponse | null>(null);

  const problemsQuery = useQuery({
    queryKey: ["problems"],
    queryFn: () => problemsApi.list({ page: 1, pageSize: 100 }),
    enabled: !!me.data && me.data.level.levelId >= PROBLEM_BANK_MIN_LEVEL,
  });

  if (me.isLoading) {
    return (
      <StudentShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner label="Loading industry challenges…" />
        </div>
      </StudentShell>
    );
  }

  const isLocked = !me.data || me.data.level.levelId < PROBLEM_BANK_MIN_LEVEL;
  const currentLevel = me.data?.level.levelId ?? 1;
  const currentPoints = me.data?.totalPoints ?? 0;
  const requiredPoints = 2000;
  const progressPct = Math.min(100, Math.round((currentPoints / requiredPoints) * 100));

  const allProblems: ProblemResponse[] = problemsQuery.data?.items ?? [];
  const orgs = ["ALL", ...Array.from(new Set(allProblems.map((p) => p.organization).filter(Boolean) as string[]))];
  const orgCounts = allProblems.reduce<Record<string, number>>(
    (acc, p) => (p.organization ? { ...acc, [p.organization]: (acc[p.organization] ?? 0) + 1 } : acc),
    {},
  );
  const topOrg = Object.entries(orgCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  const started = allProblems.filter((p) => p.project);
  const completed = started.filter((p) => (p.project?.verifiedStage ?? 0) >= 6).length;
  const underReview = started.filter((p) => p.project?.milestones.some((m) => m.status === "PENDING")).length;

  const q = search.toLowerCase();
  const filteredProblems = allProblems.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || (p.organization ?? "").toLowerCase().includes(q);
    const matchesOrg = selectedOrg === "ALL" || p.organization === selectedOrg;
    return matchesSearch && matchesOrg;
  });
  const show = (n: number) => (isLocked ? "—" : n);

  return (
    <StudentShell>
      <ConsolePageHeader
        title="Industry Problem Bank & Grand Challenges"
        description="Real problem statements from industry partners. Work each solution through 6 faculty-approved stages."
      />

      {viewing && (
        <ProblemViewModal
          problem={viewing}
          onClose={() => setViewing(null)}
          onOpenSolution={() => {
            setOpenProblem(viewing);
            setViewing(null);
          }}
        />
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
          <div className="absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#1755A7] via-[#2563EB] to-[#38BDF8]" />
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Statements</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1755A7]/15 to-[#2563EB]/10 text-[#1755A7]">
              <Lightbulb className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{show(allProblems.length)}</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
              {isLocked ? "Level Locked" : "Open Challenges"}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
            <span>Access:</span>
            <span className="font-bold text-slate-800">Level {PROBLEM_BANK_MIN_LEVEL}+</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
          <div className="absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#1755A7] via-[#F8C401] to-[#EA580C]" />
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Corporate Partners</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#F8C401]/25 to-[#EA580C]/15 text-amber-600">
              <Building2 className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="bg-gradient-to-r from-[#1755A7] to-[#2563EB] bg-clip-text text-3xl font-black tracking-tight text-transparent">{show(orgs.length - 1)}</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-slate-500">Enterprises</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
            <span>Most problems:</span>
            <span className="font-bold text-[#1755A7]">{!isLocked && topOrg ? `${topOrg[0]} (${topOrg[1]})` : "-"}</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-amber-400/40 hover:shadow-md transition-all">
          <div className="absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#38BDF8] via-[#F59E0B] to-[#EA580C]" />
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">My Solutions</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-400/15 text-amber-600">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-slate-900">{show(started.length)}</span>
            {underReview > 0 && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">{underReview} In Review</span>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
            <span>Completed (6/6):</span>
            <span className="font-bold text-slate-800">{show(completed)}</span>
          </div>
        </div>
      </div>

      {isLocked ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/50 p-8 shadow-xs text-center max-w-2xl mx-auto space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8C401]/20 text-[#1755A7] border border-[#F8C401]/40">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Reach Level {PROBLEM_BANK_MIN_LEVEL} to Unlock Problem Bank</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            The Industry Problem Bank gives direct access to confidential enterprise challenges. Complete foundational courses and GPU build labs to reach the required level.
          </p>
          <div className="max-w-md mx-auto space-y-2 pt-2">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Current: {currentPoints.toLocaleString()} pts (Level {currentLevel})</span>
              <span>Target: {requiredPoints.toLocaleString()} pts</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-[#1755A7] transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="block text-[11px] text-slate-500 font-mono">{Math.max(0, requiredPoints - currentPoints).toLocaleString()} points needed to unlock</span>
          </div>
          <div className="pt-3">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-xl bg-[#1755A7] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#134486] transition-all shadow-xs"
            >
              Earn Points in Courses
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Filter and Search Bar */}
          <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search problems by title, description or enterprise..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7]"
              />
            </div>
            {orgs.length > 2 && (
              <div className="w-full md:w-56">
                <CustomSelect
                  value={selectedOrg}
                  onChange={setSelectedOrg}
                  options={orgs.map((o) => ({ label: o === "ALL" ? "All organizations" : o, value: o }))}
                />
              </div>
            )}
          </div>

          {/* Main Problems Table */}
          {problemsQuery.isLoading ? (
            <div className="mt-8 flex h-64 items-center justify-center">
              <Spinner label="Loading industry problem bank..." />
            </div>
          ) : problemsQuery.isError ? (
            <div className="mt-6">
              <ErrorBanner error={problemsQuery.error} />
            </div>
          ) : filteredProblems.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <Lightbulb className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-bold text-slate-700">
                {allProblems.length === 0 ? "No problem statements published yet." : "No problems match your search."}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {allProblems.length === 0 ? "New industry challenges will appear here once they are published." : "Try a different keyword or organization."}
              </p>
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-3.5">Problem Statement & Scope</th>
                    <th className="px-6 py-3.5">Organization / Sponsor</th>
                    <th className="px-6 py-3.5 text-center">My Progress</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProblems.map((p) => (
                    <tr key={p.problemId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3.5 max-w-md">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
                            <Lightbulb className="h-5 w-5" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-[13px]">{p.title}</span>
                            <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{p.description}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 font-bold text-slate-800 text-xs bg-slate-100 px-3 py-1 rounded-xl">
                          <Building2 className="h-3.5 w-3.5 text-[#1755A7]" />
                          {p.organization || "-"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <ProgressBadge problem={p} />
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewing(p)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border transition-all active:scale-95 border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                            title="View details"
                            aria-label="View details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setOpenProblem(p)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[#1755A7] bg-white px-3 py-1.5 text-[11px] font-bold text-[#1755A7] transition-all hover:bg-blue-50 active:scale-95"
                          >
                            {p.project ? "Continue" : "Start Solution"}
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {openProblem && (
        <ProblemSolutionPanel
          // Re-read from the query so progress updates live after starting or submitting a stage.
          problem={allProblems.find((p) => p.problemId === openProblem.problemId) ?? openProblem}
          onClose={() => setOpenProblem(null)}
        />
      )}
    </StudentShell>
  );
}

function ProgressBadge({ problem }: { problem: ProblemResponse }) {
  const project = problem.project;
  if (!project) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
        Not started
      </span>
    );
  }
  if (project.verifiedStage >= 6) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
        <CheckCircle2 className="h-3 w-3" /> Completed
      </span>
    );
  }
  const pending = project.milestones.some((m) => m.status === "PENDING");
  return (
    <div className="inline-flex flex-col items-center gap-1">
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
          pending ? "border-amber-200 bg-amber-50 text-amber-700" : "border-[#1755A7]/20 bg-[#1755A7]/10 text-[#1755A7]"
        }`}
      >
        {pending && <Clock className="h-3 w-3" />}
        {project.verifiedStage} / 6 stages{pending ? " · In review" : ""}
      </span>
      <div className="h-1 w-24 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-[#1755A7]" style={{ width: `${(project.verifiedStage / 6) * 100}%` }} />
      </div>
    </div>
  );
}

// Same detail modal as the admin page, plus a shortcut into the solution pipeline.
function ProblemViewModal({ problem, onClose, onOpenSolution }: { problem: ProblemResponse; onClose: () => void; onOpenSolution: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div
        className={`flex max-h-[88vh] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ${problem.attachment ? "max-w-4xl" : "max-w-2xl"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-[#1755A7] via-[#1E40AF] to-[#2563EB] px-6 py-4 text-white">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#F8C401]">
              <Lightbulb className="h-5 w-5" />
            </div>
            <h3 className="truncate text-sm font-bold">{problem.title}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 overflow-y-auto p-4 text-xs sm:p-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Industry</div>
              <div className="mt-1 font-bold text-slate-900">{problem.organization || "-"}</div>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">My Progress</div>
              <div className="mt-1"><ProgressBadge problem={problem} /></div>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Level Requirement</div>
              <div className="mt-1 font-bold text-slate-900">Level {problem.levelRequirement ?? PROBLEM_BANK_MIN_LEVEL}+</div>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stages</div>
              <div className="mt-1 font-bold text-slate-900">6 faculty-approved</div>
            </div>
          </div>
          {problem.description && (
            <div className="rounded-xl border border-slate-200/80 bg-white p-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Problem Description</h4>
              <p className="mt-2 whitespace-pre-wrap leading-relaxed text-slate-700">{problem.description}</p>
            </div>
          )}
          {problem.attachment && <AttachmentViewer attachment={problem.attachment as FileAttachment} />}
          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onOpenSolution}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] via-[#1A5EB7] to-[#2563EB] px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1D4ED8] transition-all active:scale-95"
            >
              {problem.project ? "Continue Solution" : "Start Solution"}
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Full 6-stage solution pipeline for one problem — mirrors the Startup
// Launchpad's stage grid, milestone history and stage-submission modal.
function ProblemSolutionPanel({ problem, onClose }: { problem: ProblemResponse; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [stageModalOpen, setStageModalOpen] = useState(false);

  const startProject = useMutation({
    mutationFn: () => problemsApi.startProject(problem.problemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["problems"] }),
  });

  const project = problem.project;
  const verifiedStage = project?.verifiedStage ?? 0;
  const nextStage = verifiedStage + 1;
  const hasPendingMilestone = project?.milestones.some((m) => m.status === "PENDING") ?? false;
  const atFinalStage = verifiedStage >= 6;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-6 pb-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
              <Lightbulb className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-slate-900 truncate">{problem.title}</h3>
              <p className="text-[11px] text-slate-500">{problem.organization || "Sri Eshwar Industry Partner"}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6 space-y-6">
          {!project ? (
            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-10 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1755A7]/10 text-[#1755A7]">
                <Lightbulb className="h-6 w-6" />
              </div>
              <h4 className="text-base font-black text-slate-900">Start Your Solution</h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Begin Stage 1: Problem Understanding. Every stage after this needs your faculty's approval before the next one unlocks.
              </p>
              {startProject.isError && <ErrorBanner error={startProject.error} />}
              <button
                type="button"
                onClick={() => startProject.mutate()}
                disabled={startProject.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1755A7] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#134486] transition-all disabled:opacity-60"
              >
                {startProject.isPending ? "Starting…" : "Start Solution"}
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              {/* 6-Stage Pipeline Graphic */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900">6-Stage Solution Pipeline</h4>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {verifiedStage} of 6 Approved
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {PROBLEM_STAGES.map((s) => {
                    const isPassed = s.stage <= verifiedStage;
                    const isCurrent = !atFinalStage && s.stage === nextStage;
                    return (
                      <div
                        key={s.stage}
                        className={`relative flex flex-col justify-between rounded-xl p-3 border transition-all ${
                          isCurrent
                            ? "border-[#1755A7] bg-[#1755A7]/5 shadow-xs"
                            : isPassed
                            ? "border-emerald-200 bg-emerald-50/40"
                            : "border-slate-200 bg-slate-50/50 opacity-60"
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-black ${
                                isCurrent ? "bg-[#1755A7] text-white" : isPassed ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {isPassed ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.stage}
                            </span>
                          </div>
                          <div className="text-[11px] font-medium text-slate-600 leading-snug">{s.name}</div>
                        </div>
                        <div className="mt-2 pt-1.5 border-t border-slate-200/60 text-[9px] font-bold text-slate-400">
                          {isPassed ? "Approved" : isCurrent ? (hasPendingMilestone ? "Under Review" : "Submit Now") : "Locked"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {hasPendingMilestone && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs flex items-center gap-3">
                  <Clock className="h-5 w-5 text-amber-600 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-amber-900">Stage Review in Progress: </span>
                    <span className="text-amber-800">Your Stage {nextStage} submission is being evaluated by your faculty.</span>
                  </div>
                </div>
              )}

              {!atFinalStage && !hasPendingMilestone && (
                <button
                  type="button"
                  onClick={() => setStageModalOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] via-[#1A5EB7] to-[#2563EB] py-3 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1D4ED8] transition-all active:scale-95"
                >
                  <Send className="h-4 w-4" />
                  Submit Stage {nextStage}: {PROBLEM_STAGES[nextStage - 1]?.name}
                </button>
              )}

              {atFinalStage && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-center text-xs font-bold text-emerald-800">
                  All 6 stages approved — solution complete! Submit hackathon/problem win evidence from Evidence & Claims to credit points.
                </div>
              )}

              {/* Milestone History */}
              <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-100">
                  <h4 className="text-xs font-black text-slate-900">Stage History & Faculty Feedback</h4>
                </div>
                {project.milestones.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">No stages submitted yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-2.5">Stage</th>
                          <th className="px-4 py-2.5">Status</th>
                          <th className="px-4 py-2.5">Submitted / Link</th>
                          <th className="px-4 py-2.5">Feedback</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {project.milestones.map((m) => (
                          <tr key={m.milestoneId} className="hover:bg-slate-50/60">
                            <td className="px-4 py-2.5 font-bold text-slate-900">
                              Stage {m.targetStage}: {PROBLEM_STAGES[m.targetStage - 1]?.name}
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  m.status === "APPROVED"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                    : m.status === "PENDING"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                                    : "bg-rose-50 text-rose-700 border border-rose-200/60"
                                }`}
                              >
                                {m.status === "APPROVED" && <CheckCircle2 className="h-3 w-3" />}
                                {m.status === "PENDING" && <Clock className="h-3 w-3" />}
                                {m.status === "REJECTED" && <AlertCircle className="h-3 w-3" />}
                                {m.status}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-mono text-slate-600">
                              {new Date(m.createdAt).toLocaleDateString()}
                              {m.details?.fields?.documentLink && (
                                <a href={safeUrl(m.details.fields.documentLink)} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 font-sans font-semibold text-[#1755A7] hover:underline">
                                  <FileText className="h-3 w-3" /> Link
                                </a>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-slate-600">
                              {m.feedback || <span className="text-slate-400 italic">No feedback yet</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {stageModalOpen && project && (
        <ProblemStageModal
          projectId={project.projectId}
          targetStage={nextStage}
          onClose={() => setStageModalOpen(false)}
        />
      )}
    </div>
  );
}

function ProblemStageModal({ projectId, targetStage, onClose }: { projectId: string; targetStage: number; onClose: () => void }) {
  const queryClient = useQueryClient();
  const form = PROBLEM_STAGE_FORMS[targetStage - 1] ?? PROBLEM_STAGE_FORMS[0]!;
  const [values, setValues] = useState<Record<string, string>>({});

  const submit = useMutation({
    mutationFn: () => problemsApi.submitMilestone(projectId, { targetStage, details: values }),
    onSuccess: () => onClose(),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["problems"] }),
  });

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/70 p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-6 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
              <Send className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Stage {targetStage}: {PROBLEM_STAGES[targetStage - 1]?.name}
              </h3>
              <p className="text-[11px] text-slate-500">{form.intro}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit.mutate();
          }}
          className="flex min-h-0 flex-1 flex-col text-xs font-medium text-slate-700"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">

            {form.fields.map((f) => {
              const common = {
                required: f.required,
                value: values[f.key] ?? "",
                placeholder: f.placeholder,
                className: "w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-[#1755A7] focus:outline-none",
              };
              const set = (v: string) => setValues((prev) => ({ ...prev, [f.key]: v }));
              return (
                <div key={f.key}>
                  <label className="mb-1 block font-bold text-slate-900">
                    {f.label} {f.required && <span className="text-rose-500">*</span>}
                  </label>
                  {f.type === "textarea" ? (
                    <textarea rows={3} {...common} onChange={(e) => set(e.target.value)} />
                  ) : (
                    <input type={f.type === "url" ? "url" : "text"} {...common} onChange={(e) => set(e.target.value)} />
                  )}
                </div>
              );
            })}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600">
              <strong className="text-slate-800">Faculty approval required:</strong> your faculty will review this stage submission.
              The next stage unlocks only after approval.
            </div>
          </div>

          {submit.isError && (
            <div className="shrink-0 border-t border-slate-100 px-6 pt-3">
              <ErrorBanner error={submit.error} />
            </div>
          )}
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 p-4 px-6">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submit.isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1755A7] px-4 py-2 font-bold text-white shadow-xs hover:bg-[#134486] disabled:opacity-60"
            >
              <Send className="h-3.5 w-3.5" />
              {submit.isPending ? "Submitting…" : "Submit for Faculty Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
