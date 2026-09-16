"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { STARTUP_STAGES } from "@ai-digital-passport/shared-types";
import { StudentShell } from "../../components/shell/StudentShell";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { PageHeader } from "../../components/ui/PageHeader";
import { Spinner } from "../../components/ui/Spinner";
import { StatusChip, type Status } from "../../components/ui/StatusChip";
import { startupApi } from "../../lib/api";

// Page 12 — Startup Launchpad (spec 02 Section 6.2). BR-09: projects
// always start at Stage 1 (Idea) and move sequentially through Stage 6.
export default function StartupPage() {
  return (
    <StudentShell>
      <PageHeader title="Startup Launchpad" description="Track your startup project through its six-stage pipeline." />
      <StartupContent />
    </StudentShell>
  );
}

function StartupContent() {
  const queryClient = useQueryClient();
  const projects = useQuery({ queryKey: ["startup", "projects"], queryFn: startupApi.list });
  const [title, setTitle] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  const createProject = useMutation({
    mutationFn: () => startupApi.create(title),
    onSuccess: () => {
      setTitle("");
      queryClient.invalidateQueries({ queryKey: ["startup", "projects"] });
    },
  });

  if (projects.isLoading) return <Spinner />;
  if (projects.isError) return <ErrorBanner error={projects.error} />;

  const project = projects.data?.[0];

  if (!project) {
    return (
      <EmptyState
        message="No startup project yet — create one to begin Stage 1: Idea."
        action={
          <form
            className="mt-2 flex w-full max-w-xs gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              createProject.mutate();
            }}
          >
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Project title"
              className="flex-1 rounded-card border border-border px-3 py-2 text-body"
            />
            <Button type="submit" variant="primary" disabled={createProject.isPending}>
              Create
            </Button>
          </form>
        }
      />
    );
  }

  const nextStage = project.currentStage + 1;
  const hasPendingMilestone = project.milestones.some((m) => m.status === "PENDING");
  const atFinalStage = project.currentStage >= 6;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-h2 text-ink">{project.title}</h2>
          {project.gpuValidated ? <StatusChip status="APPROVED" className="bg-accent/10 text-accent-deep" /> : null}
        </div>
        <StageProgress currentStage={project.currentStage} />
      </Card>

      {!atFinalStage && (
        <Card>
          <h3 className="text-h2 text-ink">Request advancement to Stage {nextStage}: {STARTUP_STAGES[nextStage - 1]?.name}</h3>
          <p className="mt-1 text-caption text-text-muted">A mentor reviews your evidence before the stage advances.</p>
          {hasPendingMilestone ? (
            <p className="mt-4 text-body text-text-muted">Your last submission is awaiting mentor review.</p>
          ) : (
            <MilestoneForm projectId={project.projectId} targetStage={nextStage} evidenceUrl={evidenceUrl} onEvidenceUrlChange={setEvidenceUrl} />
          )}
        </Card>
      )}

      <div>
        <h3 className="mb-3 text-h2 text-ink">Milestone history</h3>
        {project.milestones.length === 0 ? (
          <p className="text-body text-text-muted">No milestones submitted yet.</p>
        ) : (
          <Card className="divide-y divide-border p-0">
            {project.milestones.map((m) => (
              <div key={m.milestoneId} className="flex items-center justify-between px-6 py-4">
                <div>
                  <div className="text-body text-ink">Stage {m.targetStage}: {STARTUP_STAGES[m.targetStage - 1]?.name}</div>
                  {m.feedback ? <div className="mt-1 text-caption text-text-muted">{m.feedback}</div> : null}
                </div>
                <StatusChip status={m.status as Status} />
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}

function StageProgress({ currentStage }: { currentStage: number }) {
  return (
    <div className="mt-6 grid grid-cols-6 gap-1">
      {STARTUP_STAGES.map((s) => (
        <div key={s.stage} className="flex flex-col items-center gap-2">
          <div
            className={
              "flex h-8 w-8 items-center justify-center rounded-full font-mono text-caption " +
              (s.stage <= currentStage ? "bg-accent text-white" : "bg-surface-muted text-text-muted")
            }
          >
            {s.stage}
          </div>
          <span className="text-center text-caption text-text-muted">{s.name}</span>
        </div>
      ))}
    </div>
  );
}

function MilestoneForm({
  projectId,
  targetStage,
  evidenceUrl,
  onEvidenceUrlChange,
}: {
  projectId: string;
  targetStage: number;
  evidenceUrl: string;
  onEvidenceUrlChange: (v: string) => void;
}) {
  const queryClient = useQueryClient();
  const submit = useMutation({
    mutationFn: () => startupApi.submitMilestone(projectId, { targetStage, evidenceUrl: evidenceUrl || undefined }),
    onSuccess: () => {
      onEvidenceUrlChange("");
      queryClient.invalidateQueries({ queryKey: ["startup", "projects"] });
    },
  });

  return (
    <form
      className="mt-4 flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit.mutate();
      }}
    >
      {submit.isError ? <ErrorBanner error={submit.error} /> : null}
      <input
        type="url"
        placeholder="Evidence URL (optional)"
        value={evidenceUrl}
        onChange={(e) => onEvidenceUrlChange(e.target.value)}
        className="rounded-card border border-border px-3 py-2 text-body"
      />
      <Button type="submit" variant="primary" disabled={submit.isPending} className="self-start">
        {submit.isPending ? "Submitting…" : "Request advancement"}
      </Button>
    </form>
  );
}
