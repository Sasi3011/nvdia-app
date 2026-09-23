"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PROBLEM_STAGES } from "@ai-digital-passport/shared-types";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { Spinner } from "../../../components/ui/Spinner";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { mentorProblemsApi, type PendingProblemMilestoneResponse } from "../../../lib/api";
import { PROBLEM_STAGE_FORMS } from "../../../lib/problem-stages";
import {
  Lightbulb,
  Sparkles,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Clock,
  Search,
  Building,
  Calendar
} from "lucide-react";

export default function MentorProblemsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const pending = useQuery({ queryKey: ["mentor", "problems"], queryFn: () => mentorProblemsApi.pending({ page: 1, pageSize: 50 }) });

  const rawItems = pending.data?.items ?? [];
  const filteredItems = rawItems.filter((m) => {
    const q = search.toLowerCase();
    return m.project.problemTitle.toLowerCase().includes(q) || m.project.studentName.toLowerCase().includes(q);
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
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1755A7]/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#1755A7]">
                  <Sparkles className="h-3.5 w-3.5 text-[#F8C401]" />
                  Industry Problem Bank
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200/60">
                  <Clock className="h-3 w-3 text-amber-600" />
                  {rawItems.length} Stage Requests Pending
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900">Industry Problem Solution Reviews</h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Review student solutions to industry problem statements across the 6 mentor-approved stages, from problem understanding through final deployment.
              </p>
            </div>
          </div>
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Stage Reviews</div>
            <div className="mt-2 text-2xl font-black text-amber-600">{rawItems.length} Advancements</div>
            <div className="mt-1 text-xs text-slate-500">Awaiting mentor decision</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Review SLA Target</div>
            <div className="mt-2 text-2xl font-black text-[#1755A7]">&lt; 48 Hours</div>
            <div className="mt-1 text-xs text-slate-500">Mentor evaluation turnaround</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Solution Stages</div>
            <div className="mt-2 text-2xl font-black text-slate-900">6 Stages</div>
            <div className="mt-1 text-xs text-slate-500">From Understanding to Final Solution</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search problem title or student name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <span className="text-xs font-bold text-slate-500">
            Showing {filteredItems.length} of {rawItems.length} requests
          </span>
        </div>

        {/* Pending Milestones List */}
        {pending.isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Spinner label="Loading solution stage requests…" />
          </div>
        ) : pending.isError ? (
          <ErrorBanner error={pending.error} />
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center shadow-xs space-y-3 max-w-md mx-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="text-base font-black text-slate-900">No Stages Pending</h3>
            <p className="text-xs text-slate-500">
              All student problem-solution stage-advancement requests have been reviewed.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {filteredItems.map((m) => (
              <MilestoneCard
                key={m.milestoneId}
                milestone={m}
                onDone={() => queryClient.invalidateQueries({ queryKey: ["mentor", "problems"] })}
              />
            ))}
          </div>
        )}

        {/* 6-Stage Reference Guide */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
              <Lightbulb className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Official 6-Stage Solution Criteria</h3>
              <p className="text-[11px] text-slate-500">Deliverables required for each stage advancement</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {PROBLEM_STAGES.map((s) => (
              <div key={s.stage} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs space-y-1">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#1755A7] font-bold text-white text-[10px]">
                  {s.stage}
                </span>
                <div className="font-black text-slate-900">{s.name}</div>
                <p className="text-[10px] text-slate-500 leading-tight">Stage {s.stage} verification</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </ConsoleShell>
  );
}

function MilestoneCard({
  milestone,
  onDone,
}: {
  milestone: PendingProblemMilestoneResponse;
  onDone: () => void;
}) {
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<unknown>(null);

  const review = useMutation({
    mutationFn: (decision: "APPROVED" | "REJECTED") =>
      mentorProblemsApi.review(milestone.milestoneId, decision, feedback || undefined),
    onSuccess: onDone,
    onError: setError,
  });

  const stageInfo = PROBLEM_STAGES[milestone.targetStage - 1];

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5 transition-all hover:border-[#1755A7]/40 hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-black text-slate-900">{milestone.project.problemTitle}</h3>
            <span className="rounded-full bg-[#1755A7]/10 px-2.5 py-0.5 text-xs font-black text-[#1755A7]">
              Requesting Stage {milestone.targetStage}: {stageInfo?.name}
            </span>
          </div>
          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-700">Student: {milestone.project.studentName}</span>
            {milestone.project.organization && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1"><Building className="h-3 w-3 text-slate-400" /> {milestone.project.organization}</span>
              </>
            )}
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-slate-400" />
              Requested {new Date(milestone.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      {milestone.details && (
        <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs">
          {PROBLEM_STAGE_FORMS[milestone.targetStage - 1]?.fields.map((f) =>
            milestone.details?.fields?.[f.key] ? (
              <div key={f.key}>
                <span className="block font-bold text-slate-700">{f.label}</span>
                {f.type === "url" ? (
                  <a href={milestone.details.fields[f.key]} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-bold text-[#1755A7] hover:underline break-all">
                    {milestone.details.fields[f.key]} <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ) : (
                  <span className="whitespace-pre-wrap text-slate-600">{milestone.details.fields[f.key]}</span>
                )}
              </div>
            ) : null,
          )}
        </div>
      )}

      {milestone.evidenceUrl && (
        <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 flex items-center justify-between gap-3 text-xs">
          <div className="min-w-0">
            <span className="font-bold text-slate-700 block mb-0.5">Submitted Deliverable URL:</span>
            <a
              href={milestone.evidenceUrl.startsWith("http") ? milestone.evidenceUrl : `https://${milestone.evidenceUrl}`}
              target="_blank"
              rel="noreferrer"
              className="text-[#1755A7] font-mono break-all hover:underline flex items-center gap-1 font-bold"
            >
              {milestone.evidenceUrl} <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
          </div>
        </div>
      )}

      {error ? <ErrorBanner error={error} /> : null}

      <div className="space-y-3 pt-1">
        <div>
          <label className="block text-xs font-bold text-slate-900 mb-1">
            Faculty Evaluation Feedback (Required if rejecting advancement)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={2}
            placeholder="Add guidance on the approach, results, or evidence quality…"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#1755A7] focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={review.isPending}
            onClick={() => review.mutate("APPROVED")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-all disabled:opacity-50 active:scale-95"
          >
            <CheckCircle2 className="h-4 w-4" />
            {review.isPending ? "Approving…" : `Approve Stage ${milestone.targetStage} Advancement`}
          </button>

          <button
            type="button"
            disabled={!feedback.trim() || review.isPending}
            onClick={() => review.mutate("REJECTED")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition-all disabled:opacity-40 active:scale-95"
          >
            <XCircle className="h-4 w-4" />
            {review.isPending ? "Rejecting…" : "Reject with Feedback"}
          </button>
        </div>
      </div>
    </div>
  );
}
