"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PROBLEM_BANK_MIN_LEVEL } from "@ai-digital-passport/shared-types";
import { StudentShell } from "../../components/shell/StudentShell";
import { Spinner } from "../../components/ui/Spinner";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { problemsApi, type FileAttachment, type ProblemResponse } from "../../lib/api";
import { AttachmentViewer } from "../../components/shared/AttachmentViewer";
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
  Link as LinkIcon,
  Eye,
  FileText,
} from "lucide-react";
import Link from "next/link";

export default function ProblemsPage() {
  const me = useMe(true);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeModalProblem, setActiveModalProblem] = useState<ProblemResponse | null>(null);
  const [fileProblem, setFileProblem] = useState<ProblemResponse | null>(null);
  const [viewingSubmissionProblem, setViewingSubmissionProblem] = useState<ProblemResponse | null>(null);
  const [summary, setSummary] = useState("");
  const [solutionLink, setSolutionLink] = useState("");

  const problemsQuery = useQuery({
    queryKey: ["problems"],
    queryFn: () => problemsApi.list({ page: 1, pageSize: 50 }),
    enabled: !!me.data && me.data.level.levelId >= PROBLEM_BANK_MIN_LEVEL,
  });

  const submitMutation = useMutation({
    mutationFn: async (problemId: string) =>
      problemsApi.submit(problemId, { summary: `Solution link: ${solutionLink}\n\n${summary}` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["problems"] });
    },
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

  function closeModal() {
    setActiveModalProblem(null);
    setSummary("");
    setSolutionLink("");
    submitMutation.reset();
  }

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
                Real problem statements published by admin-onboarded industry partners. Submit your solution write-up with a link (GitHub, Google Drive, or any other) directly against a challenge for mentor review.
              </p>
            </div>
          </div>
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
            <div className="absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#1755A7] via-[#2563EB] to-[#38BDF8]" />
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Active Problems</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1755A7]/15 to-[#2563EB]/10 text-[#1755A7]">
                <Lightbulb className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">{isLocked ? "—" : allProblems.length}</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
                Published
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
              <span>Managed by Admin:</span>
              <span className="font-bold text-slate-800">Yes</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-amber-400/40 hover:shadow-md transition-all">
            <div className="absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#F8C401] via-[#F59E0B] to-[#EA580C]" />
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Partner Organizations</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#F8C401]/25 to-[#EA580C]/15 text-amber-600">
                <Building2 className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="bg-gradient-to-r from-[#1755A7] to-[#2563EB] bg-clip-text text-3xl font-black tracking-tight text-transparent">{isLocked ? "—" : organizationCount}</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-slate-500">
                Enterprises
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
              <span>Sponsor Count:</span>
              <span className="font-bold text-[#1755A7]">{isLocked ? "-" : organizationCount}</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-emerald-400/40 hover:shadow-md transition-all">
            <div className="absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600" />
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Access Tier</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-400/15 text-emerald-600">
                {isLocked ? <Lock className="h-4.5 w-4.5" /> : <Shield className="h-4.5 w-4.5" />}
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-2xl font-black tracking-tight ${isLocked ? "text-slate-400" : "text-emerald-600"}`}>{isLocked ? "Locked" : "Unlocked"}</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
              <span>Required Level:</span>
              <span className="font-bold text-slate-800">Level {PROBLEM_BANK_MIN_LEVEL}</span>
            </div>
          </div>
        </div>

        {/* Level Locked State */}
        {isLocked ? (
          <div className="relative overflow-hidden rounded-2xl border border-[#F8C401]/30 bg-gradient-to-b from-white to-amber-50/30 p-8 shadow-sm text-center max-w-2xl mx-auto space-y-4">
            <div className="absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#F8C401] to-[#F59E0B]" />
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8C401]/10 text-amber-600 border border-[#F8C401]/20">
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
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner">
                <div className="h-full rounded-full bg-gradient-to-r from-[#1755A7] to-[#2563EB] transition-all duration-500" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="block text-[11px] text-slate-500 font-mono">{(requiredPoints - currentPoints).toLocaleString()} points needed to unlock</span>
            </div>

            <div className="pt-3">
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1755A7] px-6 py-3 text-xs font-bold text-white hover:bg-[#134486] transition-all shadow-md hover:shadow-lg active:scale-95"
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
              /* Problem Table */
              <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-3.5">Problem Statement & Scope</th>
                      <th className="px-6 py-3.5">Organization / Sponsor</th>
                      <th className="px-6 py-3.5">Level Req.</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProblems.map((prob) => (
                      <tr key={prob.problemId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3.5 max-w-md">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
                              <Lightbulb className="h-5 w-5" />
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 text-[13px]">{prob.title}</span>
                              <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{prob.description}</p>
                              {prob.attachment && (
                                <button
                                  type="button"
                                  onClick={() => setFileProblem(prob)}
                                  className="mt-2 text-[11px] font-bold text-slate-600 hover:text-[#1755A7] flex items-center gap-1 transition-colors"
                                >
                                  <FileText className="h-3.5 w-3.5" /> View original attachment
                                </button>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 font-bold text-slate-800 text-xs bg-slate-100 px-3 py-1 rounded-xl">
                            <Building2 className="h-3.5 w-3.5 text-[#1755A7]" />
                            {prob.organization || "Sri Eshwar Partner"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {prob.levelRequirement ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                              <Shield className="h-3 w-3" /> Level {prob.levelRequirement}+
                            </span>
                          ) : (
                            <span className="text-slate-400">None</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {prob.submission ? (
                              <button
                                type="button"
                                onClick={() => setViewingSubmissionProblem(prob)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-[11px] font-bold text-emerald-700 transition-all hover:bg-emerald-100"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View Submission
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setActiveModalProblem(prob)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-[11px] font-bold text-white transition-all hover:bg-slate-800 active:scale-95"
                              >
                                Submit Solution
                                <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* View Submission Modal */}
        {viewingSubmissionProblem && viewingSubmissionProblem.submission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200" onClick={() => setViewingSubmissionProblem(null)}>
            <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="truncate text-sm font-black text-slate-900">Your Submitted Solution</h3>
                    <p className="text-xs font-semibold text-slate-500">
                      Submitted on {new Date(viewingSubmissionProblem.submission.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => setViewingSubmissionProblem(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="overflow-y-auto p-6 space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Solution Summary</h4>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {viewingSubmissionProblem.submission.summary}
                  </div>
                </div>
                {viewingSubmissionProblem.submission.fileKey && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Attached Document</h4>
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      <AttachmentViewer attachment={{
                        fileKey: viewingSubmissionProblem.submission.fileKey,
                        fileName: "Solution Attachment",
                        mimeType: viewingSubmissionProblem.submission.fileKey.endsWith(".pdf") ? "application/pdf" : "image/jpeg",
                        sizeBytes: 0,
                      }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
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

        {/* Real Submission Modal — calls problemsApi.submit, persists to ProblemSubmission */}
        {activeModalProblem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
                    <Lightbulb className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Submit Solution</h3>
                    <p className="text-[11px] text-slate-500 truncate max-w-[280px]">{activeModalProblem.title}</p>
                  </div>
                </div>
                <button type="button" onClick={closeModal} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {submitMutation.isSuccess ? (
                <div className="p-6 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="text-base font-black text-slate-900">Submission Recorded</h4>
                  <p className="text-xs text-slate-600">
                    Your solution write-up has been saved against this problem statement for mentor review.
                  </p>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#1755A7] px-4 py-2 text-xs font-bold text-white hover:bg-[#134486] transition-all"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitMutation.mutate(activeModalProblem.problemId);
                  }}
                  className="space-y-4 text-xs font-medium text-slate-700"
                >
                  {submitMutation.isError && <ErrorBanner error={submitMutation.error} />}

                  <div>
                    <label className="block font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                      <LinkIcon className="h-3.5 w-3.5 text-[#1755A7]" /> Solution Link
                    </label>
                    <input
                      type="url"
                      required
                      value={solutionLink}
                      onChange={(e) => setSolutionLink(e.target.value)}
                      placeholder="https://github.com/... or https://drive.google.com/..."
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-[#1755A7] focus:outline-none"
                    />
                    <span className="block text-[11px] text-slate-400 mt-1">Any public link — GitHub repo, Google Drive, or a direct link to your solution.</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Solution Summary</label>
                    <textarea
                      required
                      rows={4}
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="Describe your technical approach, models used, and results…"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-[#1755A7] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitMutation.isPending}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#1755A7] px-4 py-2 font-bold text-white hover:bg-[#134486] transition-all shadow-xs disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {submitMutation.isPending ? "Submitting…" : "Submit Solution"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </StudentShell>
  );
}
