"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { STARTUP_STAGES } from "@ai-digital-passport/shared-types";
import { StudentShell } from "../../components/shell/StudentShell";
import { Spinner } from "../../components/ui/Spinner";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { startupApi } from "../../lib/api";
import { 
  Rocket, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowUpRight, 
  Cpu, 
  ShieldCheck, 
  Layers, 
  X, 
  Send,
  Plus,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Building
} from "lucide-react";
import Link from "next/link";

export default function StartupPage() {
  return (
    <StudentShell>
      <StartupContent />
    </StudentShell>
  );
}

function StartupContent() {
  const queryClient = useQueryClient();
  const projects = useQuery({ queryKey: ["startup", "projects"], queryFn: startupApi.list });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [proposalNotes, setProposalNotes] = useState("");

  const createProject = useMutation({
    mutationFn: () => startupApi.create(newTitle),
    onSuccess: () => {
      setNewTitle("");
      setCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["startup", "projects"] });
    },
  });

  if (projects.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner label="Loading startup venture data…" />
      </div>
    );
  }

  if (projects.isError) {
    return <ErrorBanner error={projects.error} />;
  }

  const project = projects.data?.[0];
  const currentStage = project?.currentStage ?? 1;
  const nextStage = currentStage + 1;
  const hasPendingMilestone = project?.milestones.some((m) => m.status === "PENDING") ?? false;
  const atFinalStage = currentStage >= 6;

  return (
    <div className="space-y-6">
      
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 lg:p-8 shadow-xs">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-gradient-to-br from-[#1755A7]/10 to-[#F8C401]/15 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-3xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1755A7]/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#1755A7]">
                <Sparkles className="h-3.5 w-3.5 text-[#F8C401]" />
                AI Startup Launchpad
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Venture Track
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900">
              {project ? project.title : "AI Venture Incubation Pipeline"}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Transform your AI research and capstones into investable deep-tech startups. Progress through 6 incubation stages with seed grants, GPU compute clusters, and mentor advisory.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {!project ? (
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1755A7] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#134486] hover:shadow-md hover:shadow-[#1755A7]/20 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Incorporate AI Startup
              </button>
            ) : (
              !atFinalStage && (
                <button
                  type="button"
                  disabled={hasPendingMilestone}
                  onClick={() => setAdvanceModalOpen(true)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all active:scale-95 ${
                    hasPendingMilestone
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-[#1755A7] hover:bg-[#134486] hover:shadow-md hover:shadow-[#1755A7]/20"
                  }`}
                >
                  <Send className="h-3.5 w-3.5" />
                  {hasPendingMilestone ? "Milestone Under Review" : `Request Stage ${nextStage} Advancement`}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* 4 KPI Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Pipeline Stage</div>
          <div className="mt-2 text-2xl font-black text-[#1755A7]">
            {project ? `Stage ${project.currentStage} / 6` : "Stage 0"}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {project ? STARTUP_STAGES[project.currentStage - 1]?.name : "Not Incorporated"}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Seed Grant Eligibility</div>
          <div className="mt-2 text-2xl font-black text-amber-600">₹10,00,000</div>
          <div className="mt-1 text-xs text-slate-500">Upon reaching Stage 4 (Traction)</div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">GPU Acceleration</div>
          <div className="mt-2 text-2xl font-black text-emerald-600">
            {project?.gpuValidated ? "Verified Validated" : "Standard Tier"}
          </div>
          <div className="mt-1 text-xs text-slate-500">Dedicated DGX compute nodes</div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Accreditation Bounty</div>
          <div className="mt-2 text-2xl font-black text-slate-900">+500 pts</div>
          <div className="mt-1 text-xs text-slate-500">Credited at Stage 6 scale</div>
        </div>
      </div>

      {/* Empty State when no project */}
      {!project ? (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center shadow-xs max-w-xl mx-auto space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1755A7]/10 text-[#1755A7]">
            <Rocket className="h-8 w-8 text-[#1755A7]" />
          </div>
          <h2 className="text-xl font-black text-slate-900">No AI Startup Project Created Yet</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Incorporate your venture to begin Stage 1: Idea. You will be assigned a faculty mentor and access to the Sri Eshwar AI Incubation Fund.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1755A7] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#134486] transition-all"
            >
              <Plus className="h-4 w-4" />
              Incorporate Venture Now
            </button>
          </div>
        </div>
      ) : (
        /* Active Startup Pipeline UI */
        <div className="space-y-6">
          {/* 6-Stage Pipeline Graphic */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">6-Stage Venture Acceleration Roadmap</h3>
                <p className="text-xs text-slate-500">Sequential milestone progression validated by faculty incubator mentors</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {currentStage} of 6 Complete
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {STARTUP_STAGES.map((s) => {
                const isPassed = s.stage < currentStage;
                const isCurrent = s.stage === currentStage;
                const isLocked = s.stage > currentStage;

                return (
                  <div
                    key={s.stage}
                    className={`relative flex flex-col justify-between rounded-xl p-4 border transition-all ${
                      isCurrent
                        ? "border-[#1755A7] bg-[#1755A7]/5 shadow-xs"
                        : isPassed
                        ? "border-emerald-200 bg-emerald-50/40"
                        : "border-slate-200 bg-slate-50/50 opacity-60"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black ${
                            isCurrent
                              ? "bg-[#1755A7] text-white"
                              : isPassed
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {isPassed ? <CheckCircle2 className="h-4 w-4" /> : s.stage}
                        </span>
                        {isCurrent && (
                          <span className="rounded-full bg-[#1755A7]/10 px-2 py-0.5 text-[9px] font-black text-[#1755A7] uppercase">
                            Current
                          </span>
                        )}
                      </div>

                      <div className="font-bold text-xs text-slate-900 leading-snug">
                        Stage {s.stage}
                      </div>
                      <div className="text-[11px] font-medium text-slate-600">
                        {s.name}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] font-bold text-slate-400">
                      {isPassed ? "Verified" : isCurrent ? "Active Work" : "Locked"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending Review Notice if applicable */}
          {hasPendingMilestone && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-amber-900">Milestone Review in Progress: </span>
                <span className="text-amber-800">
                  Your advancement request for Stage {nextStage} is currently being evaluated by the startup mentor panel.
                </span>
              </div>
            </div>
          )}

          {/* Milestone Submission History Table */}
          <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs space-y-0">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Milestone History & Mentor Audits</h3>
                <p className="text-xs text-slate-500">Formal stage approvals and recorded evidence documents</p>
              </div>
            </div>

            {project.milestones.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No milestone submissions recorded yet. Click &quot;Request Stage Advancement&quot; above to submit stage deliverables.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3">Target Stage</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Submitted Evidence</th>
                      <th className="px-5 py-3">Mentor Feedback</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {project.milestones.map((m) => (
                      <tr key={m.milestoneId} className="hover:bg-slate-50/60">
                        <td className="px-5 py-3 font-bold text-slate-900">
                          Stage {m.targetStage}: {STARTUP_STAGES[m.targetStage - 1]?.name}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
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
                        <td className="px-5 py-3 font-mono text-slate-600">
                          {new Date(m.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {m.feedback || <span className="text-slate-400 italic">No feedback remarks</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Incorporate Startup Modal Popup */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
                  <Rocket className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Incorporate AI Startup Venture</h3>
                  <p className="text-[11px] text-slate-500">Initiate Stage 1: Idea Incubation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createProject.mutate();
              }}
              className="space-y-4 text-xs font-medium text-slate-700"
            >
              {createProject.isError && <ErrorBanner error={createProject.error} />}

              <div>
                <label className="block font-bold text-slate-900 mb-1">Venture / Startup Name</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. NeuroSync Robotics"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-[#1755A7] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">AI Domain & Problem Overview</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the target customer problem and the foundational AI technology solution…"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-[#1755A7] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProject.isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#1755A7] px-4 py-2 font-bold text-white hover:bg-[#134486] transition-all shadow-xs"
                >
                  <Rocket className="h-3.5 w-3.5" />
                  {createProject.isPending ? "Creating…" : "Register Startup"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Stage Advancement Modal */}
      {advanceModalOpen && project && (
        <AdvancementModal
          project={project}
          targetStage={nextStage}
          onClose={() => setAdvanceModalOpen(false)}
        />
      )}

    </div>
  );
}

function AdvancementModal({
  project,
  targetStage,
  onClose,
}: {
  project: { projectId: string; title: string };
  targetStage: number;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [evidenceUrl, setEvidenceUrl] = useState("");

  const submit = useMutation({
    mutationFn: () => startupApi.submitMilestone(project.projectId, { targetStage, evidenceUrl: evidenceUrl || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startup", "projects"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
              <Send className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Request Stage {targetStage} Advancement
              </h3>
              <p className="text-[11px] text-slate-500">{STARTUP_STAGES[targetStage - 1]?.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit.mutate();
          }}
          className="space-y-4 text-xs font-medium text-slate-700"
        >
          {submit.isError && <ErrorBanner error={submit.error} />}

          <div>
            <label className="block font-bold text-slate-900 mb-1">Target Stage</label>
            <input
              type="text"
              disabled
              value={`Stage ${targetStage}: ${STARTUP_STAGES[targetStage - 1]?.name}`}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-600 font-semibold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-900 mb-1">Evidence Deliverable URL (Pitch Deck, Demo Video, GitHub)</label>
            <input
              type="url"
              required
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-[#1755A7] focus:outline-none"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600 space-y-1">
            <strong className="text-slate-800">Review Criteria:</strong>
            <p>Your faculty mentor will review customer validation metrics, technical MVP architecture, and pitch slides before advancing your stage.</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submit.isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1755A7] px-4 py-2 font-bold text-white hover:bg-[#134486] transition-all shadow-xs"
            >
              <Send className="h-3.5 w-3.5" />
              {submit.isPending ? "Submitting…" : "Submit Advancement Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
