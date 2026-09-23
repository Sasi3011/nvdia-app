"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { STARTUP_STAGES } from "@ai-digital-passport/shared-types";
import { StudentShell } from "../../components/shell/StudentShell";
import { Spinner } from "../../components/ui/Spinner";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { startupApi, API_BASE_URL } from "../../lib/api";
import { STARTUP_STAGE_FORMS, STARTUP_REGISTRATION_GUIDE } from "../../lib/startup-stages";
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
  const [submitModalOpen, setSubmitModalOpen] = useState(false);

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
  const verifiedStage = project?.verifiedStage ?? 0;
  const nextStage = verifiedStage + 1;
  const hasPendingMilestone = project?.milestones.some((m) => m.status === "PENDING") ?? false;
  const atFinalStage = verifiedStage >= 6;

  const NEXT_STAGE_NAME = STARTUP_STAGES.reduce((acc, s) => {
    acc[s.stage - 1] = `Stage ${s.stage}: ${s.name}`;
    return acc;
  }, {} as Record<number, string>);

  return (
    <div className="space-y-6">
      
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            {project ? project.title : "AI Venture Incubation Pipeline"}
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Transform your AI capstones into startups. Submit documents for mentor approval to unlock the next stage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {!project ? (
            <button
              type="button"
              onClick={() => setSubmitModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] via-[#1A5EB7] to-[#2563EB] px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1D4ED8] transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Submit Your Idea</span>
            </button>
          ) : (
            !atFinalStage && (
              <button
                type="button"
                disabled={hasPendingMilestone}
                onClick={() => setSubmitModalOpen(true)}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all active:scale-95 ${
                  hasPendingMilestone
                    ? "bg-slate-400 cursor-not-allowed shadow-none"
                    : "bg-gradient-to-r from-[#1755A7] via-[#1A5EB7] to-[#2563EB] shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1D4ED8]"
                }`}
              >
                <ArrowUpRight className="h-4 w-4" />
                <span>Submit {NEXT_STAGE_NAME[verifiedStage as keyof typeof NEXT_STAGE_NAME]}</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* 4 KPI Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Pipeline Stage</div>
          <div className="mt-2 text-2xl font-black text-[#1755A7]">
            {project ? `${verifiedStage} / 6 Approved` : "Stage 0"}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {!project ? "Not started" : atFinalStage ? "All stages approved" : `Next: ${STARTUP_STAGES[nextStage - 1]?.name}`}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Approved Milestones</div>
          <div className="mt-2 text-2xl font-black text-amber-600">{project?.milestones.filter((m) => m.status === "APPROVED").length ?? 0}</div>
          <div className="mt-1 text-xs text-slate-500">Verified by your mentor</div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">GPU Acceleration</div>
          <div className="mt-2 text-2xl font-black text-emerald-600">
            {project?.gpuValidated ? "Verified Validated" : "Standard Tier"}
          </div>
          <div className="mt-1 text-xs text-slate-500">Dedicated DGX compute nodes</div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Review</div>
          <div className="mt-2 text-2xl font-black text-slate-900">{hasPendingMilestone ? "1 Milestone" : "None"}</div>
          <div className="mt-1 text-xs text-slate-500">Awaiting mentor decision</div>
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
              onClick={() => setSubmitModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1755A7] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#134486] transition-all"
            >
              <Plus className="h-4 w-4" />
              Submit Your Idea
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
                <p className="text-xs text-slate-500">Each stage is submitted, reviewed and approved by your mentor</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {verifiedStage} of 6 Approved
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {STARTUP_STAGES.map((s) => {
                const isPassed = s.stage <= verifiedStage;
                const isCurrent = !atFinalStage && s.stage === nextStage;

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
                      {isPassed ? "Mentor Approved" : isCurrent ? (hasPendingMilestone ? "Under Review" : "Submit Now") : "Locked"}
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
                  Your Stage {nextStage} submission is being evaluated by your mentor. You can submit the next stage once it is approved.
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
                No milestone submissions recorded yet. Submit your idea above to begin Stage 1.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3">Target Stage</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Submitted On / Documents</th>
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
                          {m.details?.fields?.documentLink && (
                            <a href={m.details.fields.documentLink} target="_blank" rel="noreferrer" className="mt-1 block truncate font-sans font-semibold text-[#1755A7] hover:underline">
                              Document Link
                            </a>
                          )}
                          {m.details?.documents?.map((d) => (
                            <a key={d.fileKey} href={`${API_BASE_URL}/uploads/files/${d.fileKey}`} target="_blank" rel="noreferrer" className="mt-1 block truncate font-sans font-semibold text-[#1755A7] hover:underline">
                              {d.fileName}
                            </a>
                          ))}
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

      {project && atFinalStage && <RegistrationGuide />}

      {submitModalOpen && (
        <StageSubmissionModal
          project={project ?? null}
          targetStage={nextStage}
          onClose={() => setSubmitModalOpen(false)}
        />
      )}

    </div>
  );
}

function StageSubmissionModal({
  project,
  targetStage,
  onClose,
}: {
  project: { projectId: string; title: string } | null;
  targetStage: number;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const form = STARTUP_STAGE_FORMS[targetStage - 1] ?? STARTUP_STAGE_FORMS[0]!;
  const [title, setTitle] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});

  const submit = useMutation({
    mutationFn: async () => {
      const projectId = project?.projectId ?? (await startupApi.create(title)).projectId;
      return startupApi.submitMilestone(projectId, { targetStage, details: values });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startup", "projects"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-6 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
              <Send className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Stage {targetStage}: {STARTUP_STAGES[targetStage - 1]?.name}
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

          {!project && (
            <div>
              <label className="mb-1 block font-bold text-slate-900">Startup / Idea Name</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. NeuroSync Robotics"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-[#1755A7] focus:outline-none"
              />
            </div>
          )}

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
                ) : f.type === "select" ? (
                  <select {...common} onChange={(e) => set(e.target.value)}>
                    <option value="">Select…</option>
                    {f.options?.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <input type={f.type === "url" ? "url" : "text"} {...common} onChange={(e) => set(e.target.value)} />
                )}
              </div>
            );
          })}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600">
            <strong className="text-slate-800">Mentor approval required:</strong> your mentor will review this submission.
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

function RegistrationGuide() {
  return (
    <div className="space-y-4 rounded-2xl border border-emerald-200 bg-white p-6 shadow-xs">
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Building className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900">Congratulations — Register Your Startup</h3>
          <p className="text-[11px] text-slate-500">
            All 6 stages are mentor-approved. Follow these steps to make your venture a legally registered startup.
            Rules and fees change, so confirm details on each official portal.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {STARTUP_REGISTRATION_GUIDE.map((r, i) => (
          <div key={r.title} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-black text-slate-900">{i + 1}. {r.title}</div>
                <div className="text-[11px] font-semibold text-[#1755A7]">{r.authority}</div>
              </div>
              <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">{r.cost}</span>
            </div>
            <p className="text-slate-600">{r.summary}</p>
            <ol className="list-decimal space-y-0.5 pl-4 text-slate-700">
              {r.steps.map((st) => <li key={st}>{st}</li>)}
            </ol>
            <div>
              <span className="font-bold text-slate-800">Documents: </span>
              <span className="text-slate-600">{r.documents.join(", ")}</span>
            </div>
            {r.link && (
              <a href={r.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-[#1755A7] hover:underline">
                Official portal <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
