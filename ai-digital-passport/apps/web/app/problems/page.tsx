"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PROBLEM_BANK_MIN_LEVEL, PROBLEM_STAGES } from "@ai-digital-passport/shared-types";
import { StudentShell } from "../../components/shell/StudentShell";
import { Spinner } from "../../components/ui/Spinner";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { problemsApi, type FileAttachment, type ProblemResponse } from "../../lib/api";
import { AttachmentViewer } from "../../components/shared/AttachmentViewer";
import { PROBLEM_STAGE_FORMS } from "../../lib/problem-stages";
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
  Shield,
  Clock,
  AlertCircle,
  FileText,
} from "lucide-react";
import Link from "next/link";

export default function ProblemsPage() {
  const me = useMe(true);
  const [search, setSearch] = useState("");
  const [openProblem, setOpenProblem] = useState<ProblemResponse | null>(null);
  const [fileProblem, setFileProblem] = useState<ProblemResponse | null>(null);

  const problemsQuery = useQuery({
    queryKey: ["problems"],
    queryFn: () => problemsApi.list({ page: 1, pageSize: 50 }),
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
  const organizationCount = new Set(allProblems.map((p) => p.organization).filter(Boolean)).size;
  const filteredProblems = allProblems.filter((p) => {
    const q = search.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || (p.organization ?? "").toLowerCase().includes(q);
  });

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
                  Industry Problem Bank
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                  Level {PROBLEM_BANK_MIN_LEVEL}+ Exclusive
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900">Industry Problem Statements & Challenges</h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Real problem statements published by admin-onboarded industry partners. Work each solution through 6 mentor-approved stages — same staged pipeline as the Startup Launchpad.
              </p>
            </div>
          </div>
        </div>

        {/* KPI Metrics — real counts only */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Active Problems</div>
            <div className="mt-2 text-2xl font-black text-slate-900">{isLocked ? "—" : allProblems.length}</div>
            <div className="mt-1 text-xs text-slate-500">Published by admin</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Partner Organizations</div>
            <div className="mt-2 text-2xl font-black text-[#1755A7]">{isLocked ? "—" : organizationCount}</div>
            <div className="mt-1 text-xs text-slate-500">Distinct sponsors listed</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Access Tier</div>
            <div className="mt-2 text-2xl font-black text-emerald-600">{isLocked ? "Level Locked" : "Unlocked"}</div>
            <div className="mt-1 text-xs text-slate-500">Requires Level {PROBLEM_BANK_MIN_LEVEL}</div>
          </div>
        </div>

        {/* Level Locked State */}
        {isLocked ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-8 shadow-xs text-center max-w-2xl mx-auto space-y-4">
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
              <span className="block text-[11px] text-slate-500 font-mono">{(requiredPoints - currentPoints).toLocaleString()} points needed to unlock</span>
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
          /* Unlocked Content */
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search challenges, partners, keywords…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            {problemsQuery.isLoading ? (
              <div className="flex min-h-[30vh] items-center justify-center"><Spinner label="Loading problems…" /></div>
            ) : problemsQuery.isError ? (
              <ErrorBanner error={problemsQuery.error} />
            ) : filteredProblems.length === 0 ? (
              <div className="rounded-2xl border border-slate-200/90 bg-white p-10 text-center text-sm text-slate-500">
                {allProblems.length === 0
                  ? "No industry problem statements have been published yet. Check back soon."
                  : "No problems match your search."}
              </div>
            ) : (
              /* Problem Cards Grid */
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredProblems.map((prob) => {
                  const project = prob.project;
                  return (
                    <div
                      key={prob.problemId}
                      className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-[#1755A7]/40 hover:shadow-md"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1755A7]/10 px-2.5 py-0.5 text-xs font-bold text-[#1755A7]">
                            <Building2 className="h-3 w-3 text-[#1755A7]" />
                            {prob.organization || "Sri Eshwar Industry Partner"}
                          </span>
                          {prob.levelRequirement != null && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                              <Shield className="h-3 w-3" /> Level {prob.levelRequirement}+
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-black text-slate-900 leading-snug">{prob.title}</h3>
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{prob.description}</p>

                        {project && (
                          <div className="flex items-center gap-2 pt-1">
                            <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full rounded-full bg-[#1755A7]" style={{ width: `${(project.verifiedStage / 6) * 100}%` }} />
                            </div>
                            <span className="text-[11px] font-bold text-slate-600 shrink-0">{project.verifiedStage} / 6 stages</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                        {prob.attachment && (
                          <button
                            type="button"
                            onClick={() => setFileProblem(prob)}
                            className="text-xs font-bold text-slate-700 hover:underline"
                          >
                            View attached file
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setOpenProblem(prob)}
                          className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white transition-all hover:bg-slate-800 active:scale-95"
                        >
                          {project ? "View Solution Progress" : "Start Solution"}
                          <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {fileProblem?.attachment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setFileProblem(null)}>
            <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <h3 className="truncate text-sm font-black text-slate-900">{fileProblem.title}</h3>
                <button type="button" onClick={() => setFileProblem(null)} className="rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100">
                  Close
                </button>
              </div>
              <div className="overflow-y-auto p-6">
                <AttachmentViewer attachment={fileProblem.attachment as FileAttachment} />
              </div>
            </div>
          </div>
        )}

        {openProblem && <ProblemSolutionPanel problem={openProblem} onClose={() => setOpenProblem(null)} />}

      </div>
    </StudentShell>
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
                Begin Stage 1: Problem Understanding. Every stage after this needs your faculty mentor's approval before the next one unlocks.
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
                    <span className="text-amber-800">Your Stage {nextStage} submission is being evaluated by your mentor.</span>
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
                  <h4 className="text-xs font-black text-slate-900">Stage History & Mentor Feedback</h4>
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
                                <a href={m.details.fields.documentLink} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 font-sans font-semibold text-[#1755A7] hover:underline">
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["problems"] });
      onClose();
    },
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
            {submit.isError && <ErrorBanner error={submit.error} />}

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
              <strong className="text-slate-800">Mentor approval required:</strong> your mentor will review this stage submission.
              The next stage unlocks only after approval.
            </div>
          </div>

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
              {submit.isPending ? "Submitting…" : "Submit for Mentor Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
