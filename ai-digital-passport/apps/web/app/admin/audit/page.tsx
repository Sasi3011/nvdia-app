"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsoleCard } from "../../../components/console/ConsoleCard";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { Button } from "../../../components/ui/Button";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { adminAuditApi } from "../../../lib/api";

const inputClass = "rounded-card border border-border bg-surface px-3 py-2 text-body text-ink placeholder:text-text-muted";

// Page 30 — Annual Audit & Awards (spec 02 Section 6.4). Admin-triggered
// (open decision #6) rather than cron-scheduled on a guessed academic-year
// boundary.
export default function AdminAuditPage() {
  const queryClient = useQueryClient();
  const [academicYear, setAcademicYear] = useState("");
  const [candidateCount, setCandidateCount] = useState(25);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const runs = useQuery({ queryKey: ["admin", "audit", "runs"], queryFn: adminAuditApi.listRuns });
  const runDetail = useQuery({
    queryKey: ["admin", "audit", "run", selectedRunId],
    queryFn: () => adminAuditApi.getRun(selectedRunId!),
    enabled: !!selectedRunId,
  });

  const trigger = useMutation({
    mutationFn: () => adminAuditApi.run(academicYear, candidateCount),
    onSuccess: (res) => {
      setSelectedRunId(res.auditRunId);
      queryClient.invalidateQueries({ queryKey: ["admin", "audit", "runs"] });
    },
  });

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader title="Annual Audit & Awards" description="Run the fellowship candidate audit and review past rosters." />

      <ConsoleCard className="mb-6">
        <h2 className="text-h2 text-ink">Run a new audit</h2>
        <form
          className="mt-3 flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            trigger.mutate();
          }}
        >
          {trigger.isError ? <ErrorBanner error={trigger.error} /> : null}
          <label className="flex flex-col gap-1">
            <span className="text-caption text-text-muted">Academic year</span>
            <input required placeholder="2025-2026" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-caption text-text-muted">Candidate count</span>
            <input
              type="number"
              min={1}
              max={100}
              value={candidateCount}
              onChange={(e) => setCandidateCount(Number(e.target.value))}
              className={inputClass + " w-24"}
            />
          </label>
          <Button type="submit" variant="primary" disabled={trigger.isPending}>
            {trigger.isPending ? "Running…" : "Run audit"}
          </Button>
        </form>
      </ConsoleCard>

      <div className="grid grid-cols-1 gap-6 desktop:grid-cols-2">
        <div>
          <h2 className="mb-3 text-h2 text-ink">Past runs</h2>
          {runs.isLoading ? (
            <Spinner />
          ) : runs.isError ? (
            <ErrorBanner error={runs.error} />
          ) : !runs.data || runs.data.length === 0 ? (
            <p className="text-body text-text-muted">No audit runs yet.</p>
          ) : (
            <ConsoleCard className="divide-y divide-navy-700 p-0">
              {runs.data.map((r) => (
                <button
                  key={r.auditRunId}
                  onClick={() => setSelectedRunId(r.auditRunId)}
                  className={"flex w-full items-center justify-between px-6 py-4 text-left hover:bg-surface-muted " + (r.auditRunId === selectedRunId ? "bg-surface-muted" : "")}
                >
                  <span className="text-body text-ink">{r.academicYear}</span>
                  <span className="font-mono text-caption text-text-muted">
                    {r.candidateCount} candidates · {new Date(r.runAt).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </ConsoleCard>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-h2 text-ink">Roster</h2>
          {!selectedRunId ? (
            <p className="text-body text-text-muted">Select a run to view its roster.</p>
          ) : runDetail.isLoading ? (
            <Spinner />
          ) : runDetail.isError ? (
            <ErrorBanner error={runDetail.error} />
          ) : (
            <ConsoleCard className="divide-y divide-navy-700 p-0">
              {runDetail.data?.candidates.map((c) => (
                <div key={c.candidateId} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-caption text-text-muted">#{c.rank}</span>
                    <span className="text-body text-ink">{c.user.fullName}</span>
                  </div>
                  <span className="font-mono text-caption text-text-muted">{c.totalPoints.toLocaleString()} pts</span>
                </div>
              ))}
            </ConsoleCard>
          )}
        </div>
      </div>
    </ConsoleShell>
  );
}
