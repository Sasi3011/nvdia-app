"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsoleCard } from "../../../components/console/ConsoleCard";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { Button } from "../../../components/ui/Button";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { adminProblemsApi, type AdminProblemResponse, type UpsertProblemInput } from "../../../lib/api";

const STATUSES: UpsertProblemInput["status"][] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const inputClass = "rounded-card border border-border bg-surface px-3 py-2 text-body text-ink placeholder:text-text-muted";

// Page 26 — Problem Bank Management (spec 02 Section 6.4). Open decision
// #8 — minimum schema: title, description, status, level requirement.
export default function AdminProblemsPage() {
  const queryClient = useQueryClient();
  const problems = useQuery({ queryKey: ["admin", "problems"], queryFn: () => adminProblemsApi.list({ page: 1, pageSize: 100 }) });
  const [editing, setEditing] = useState<AdminProblemResponse | "new" | null>(null);

  const invalidate = () => {
    setEditing(null);
    queryClient.invalidateQueries({ queryKey: ["admin", "problems"] });
  };

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader
        title="Problem Bank Management"
        description="Create and manage industry problem statements."
        actions={
          <Button variant="primary" onClick={() => setEditing("new")}>
            New problem
          </Button>
        }
      />

      {editing ? (
        <ProblemForm problem={editing === "new" ? null : editing} onDone={invalidate} onCancel={() => setEditing(null)} />
      ) : null}

      {problems.isLoading ? (
        <Spinner />
      ) : problems.isError ? (
        <ErrorBanner error={problems.error} />
      ) : !problems.data || problems.data.items.length === 0 ? (
        <p className="text-body text-text-muted">No problem statements yet.</p>
      ) : (
        <ConsoleCard className="divide-y divide-navy-700 p-0">
          {problems.data.items.map((p) => (
            <button key={p.problemId} onClick={() => setEditing(p)} className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-surface-muted">
              <div>
                <div className="text-body text-ink">{p.title}</div>
                <div className="text-caption text-text-muted">
                  {p.organization ?? "—"} · Requires Level {p.levelRequirement}
                </div>
              </div>
              <StatusBadge status={p.status} />
            </button>
          ))}
        </ConsoleCard>
      )}
    </ConsoleShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    DRAFT: "text-text-muted",
    PUBLISHED: "text-accent",
    ARCHIVED: "text-rejected",
  };
  return <span className={"font-mono text-caption " + (colors[status] ?? "text-text-muted")}>{status}</span>;
}

function ProblemForm({
  problem,
  onDone,
  onCancel,
}: {
  problem: AdminProblemResponse | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(problem?.title ?? "");
  const [description, setDescription] = useState(problem?.description ?? "");
  const [organization, setOrganization] = useState(problem?.organization ?? "");
  const [status, setStatus] = useState<UpsertProblemInput["status"]>(problem?.status ?? "DRAFT");
  const [levelRequirement, setLevelRequirement] = useState(problem?.levelRequirement ?? 3);

  const save = useMutation({
    mutationFn: () => {
      const input: UpsertProblemInput = { title, description, organization: organization || undefined, status, levelRequirement };
      return problem ? adminProblemsApi.update(problem.problemId, input) : adminProblemsApi.create(input);
    },
    onSuccess: onDone,
  });

  return (
    <ConsoleCard className="mb-6">
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        {save.isError ? <ErrorBanner error={save.error} /> : null}
        <input required placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        <textarea
          required
          rows={3}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
        <div className="grid grid-cols-1 gap-3 tablet:grid-cols-3">
          <input
            placeholder="Organization"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            className={inputClass}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value as UpsertProblemInput["status"])} className={inputClass}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            required
            type="number"
            min={1}
            max={6}
            placeholder="Level requirement"
            value={levelRequirement}
            onChange={(e) => setLevelRequirement(Number(e.target.value))}
            className={inputClass}
          />
        </div>
        <div className="flex gap-3">
          <Button type="submit" variant="primary" disabled={save.isPending}>
            {save.isPending ? "Saving…" : problem ? "Save changes" : "Create"}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </ConsoleCard>
  );
}
