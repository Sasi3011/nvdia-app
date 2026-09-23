"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PROBLEM_BANK_MIN_LEVEL } from "@ai-digital-passport/shared-types";
import { StudentShell } from "../../components/shell/StudentShell";
import { Spinner } from "../../components/ui/Spinner";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { problemsApi, uploadsApi, type FileAttachment, type ProblemResponse } from "../../lib/api";
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
} from "lucide-react";
import Link from "next/link";

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.includes(",") ? result.slice(result.indexOf(",") + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProblemsPage() {
  const me = useMe(true);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeModalProblem, setActiveModalProblem] = useState<ProblemResponse | null>(null);
  const [fileProblem, setFileProblem] = useState<ProblemResponse | null>(null);
  const [summary, setSummary] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const problemsQuery = useQuery({
    queryKey: ["problems"],
    queryFn: () => problemsApi.list({ page: 1, pageSize: 50 }),
    enabled: !!me.data && me.data.level.levelId >= PROBLEM_BANK_MIN_LEVEL,
  });

  const submitMutation = useMutation({
    mutationFn: async (problemId: string) => {
      let fileKey: string | undefined;
      if (file) {
        const uploaded = await uploadsApi.uploadPdf({
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          base64Data: await fileToBase64(file),
          entityType: "problem_submission",
        });
        fileKey = uploaded.fileKey;
      }
      return problemsApi.submit(problemId, { summary, fileKey });
    },
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
    setFile(null);
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
                Real problem statements published by admin-onboarded industry partners. Submit your solution write-up (and optional proof file) directly against a challenge for mentor review.
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
                {filteredProblems.map((prob) => (
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
                        onClick={() => setActiveModalProblem(prob)}
                        className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white transition-all hover:bg-slate-800 active:scale-95"
                      >
                        Submit Solution
                        <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
                      </button>
                    </div>
                  </div>
                ))}
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

                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Supporting File (optional PDF)</label>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-bold"
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
