"use client";

import { useQuery } from "@tanstack/react-query";
import { ConsoleShell } from "../../components/console/ConsoleShell";
import { ConsoleCard } from "../../components/console/ConsoleCard";
import { ConsolePageHeader } from "../../components/console/ConsolePageHeader";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { Spinner } from "../../components/ui/Spinner";
import { adminDashboardApi } from "../../lib/api";

// Page 24 — Admin Dashboard / Analytics (spec 02 Section 6.4). Headline
// operational metrics; system health is GET /health (NFR health-check).
export default function AdminDashboardPage() {
  const summary = useQuery({ queryKey: ["admin", "dashboard"], queryFn: adminDashboardApi.summary });

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader title="Admin Dashboard" description="System-wide operational overview." />

      {summary.isLoading ? (
        <Spinner />
      ) : summary.isError ? (
        <ErrorBanner error={summary.error} />
      ) : summary.data ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4 tablet:grid-cols-3">
            <Metric label="Total students" value={summary.data.totalStudents} />
            <Metric label="Pending claims" value={summary.data.pendingClaims} />
            <Metric label="Active events" value={summary.data.activeEvents} />
            {summary.data.levelDistribution
              .sort((a, b) => a.levelId - b.levelId)
              .map((l) => (
                <Metric key={l.levelId} label={`Level ${l.levelId} students`} value={l.count} />
              ))}
          </div>
          <ConsoleCard>
            <h2 className="text-h2 text-ink">Operational modules</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 tablet:grid-cols-3">
              {["Courses", "GPU", "Hackathons", "Research", "Industry", "Awards", "Users", "Reports", "Scoring"].map((item) => (
                <div key={item} className="rounded-card border border-navy-700 p-3">
                  <div className="text-body text-ink">{item}</div>
                  <div className="mt-1 text-caption text-text-muted">Manage workflow, approvals and reports</div>
                </div>
              ))}
            </div>
          </ConsoleCard>
        </div>
      ) : null}
    </ConsoleShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <ConsoleCard>
      <div className="text-caption text-text-muted">{label}</div>
      <div className="mt-1 font-mono text-display text-ink">{value.toLocaleString()}</div>
    </ConsoleCard>
  );
}
