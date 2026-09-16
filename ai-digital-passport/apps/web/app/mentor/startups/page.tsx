"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { STARTUP_STAGES } from "@ai-digital-passport/shared-types";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsoleCard } from "../../../components/console/ConsoleCard";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { Button } from "../../../components/ui/Button";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { mentorStartupApi } from "../../../lib/api";

// Page 23 — Startup Milestone Review (spec 02 Section 6.3). Same
// approve/reject-with-feedback pattern as claim review (open decision #5).
export default function MentorStartupsPage() {
  const queryClient = useQueryClient();
  const pending = useQuery({ queryKey: ["mentor", "startups"], queryFn: () => mentorStartupApi.pending({ page: 1, pageSize: 50 }) });

  return (
    <ConsoleShell role="MENTOR">
      <ConsolePageHeader title="Startup Milestone Review" description="Stage-advancement requests awaiting a decision." />

      {pending.isLoading ? (
        <Spinner />
      ) : pending.isError ? (
        <ErrorBanner error={pending.error} />
      ) : !pending.data || pending.data.items.length === 0 ? (
        <p className="text-body text-text-muted">No milestones awaiting review.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {pending.data.items.map((m) => (
            <MilestoneCard key={m.milestoneId} milestone={m} onDone={() => queryClient.invalidateQueries({ queryKey: ["mentor", "startups"] })} />
          ))}
        </div>
      )}
    </ConsoleShell>
  );
}

function MilestoneCard({
  milestone,
  onDone,
}: {
  milestone: { milestoneId: string; targetStage: number; evidenceUrl: string | null; createdAt: string; project: { title: string; leadName: string } };
  onDone: () => void;
}) {
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<unknown>(null);

  const review = useMutation({
    mutationFn: (decision: "APPROVED" | "REJECTED") => mentorStartupApi.review(milestone.milestoneId, decision, feedback || undefined),
    onSuccess: onDone,
    onError: setError,
  });

  return (
    <ConsoleCard>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-h2 text-ink">{milestone.project.title}</h2>
          <p className="text-caption text-text-muted">
            {milestone.project.leadName} · requesting Stage {milestone.targetStage}: {STARTUP_STAGES[milestone.targetStage - 1]?.name}
          </p>
        </div>
        <span className="font-mono text-caption text-text-muted">{new Date(milestone.createdAt).toLocaleDateString()}</span>
      </div>

      {milestone.evidenceUrl ? (
        <a href={milestone.evidenceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-accent underline underline-offset-2">
          {milestone.evidenceUrl}
        </a>
      ) : null}

      {error ? <div className="mt-3"><ErrorBanner error={error} /></div> : null}

      <div className="mt-4 flex flex-col gap-3 border-t border-navy-700 pt-4">
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={2}
          placeholder="Feedback (required to reject)"
          className="rounded-card border border-border bg-surface px-3 py-2 text-body text-ink placeholder:text-text-muted"
        />
        <div className="flex gap-3">
          <Button variant="primary" disabled={review.isPending} onClick={() => review.mutate("APPROVED")}>
            Approve
          </Button>
          <Button variant="destructive" disabled={!feedback.trim() || review.isPending} onClick={() => review.mutate("REJECTED")}>
            Reject
          </Button>
        </div>
      </div>
    </ConsoleCard>
  );
}
