"use client";

import { useQuery } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsoleCard } from "../../../components/console/ConsoleCard";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { Button } from "../../../components/ui/Button";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { adminReportsApi } from "../../../lib/api";

// Page 29 — Reports & Analytics Export (spec 02 Section 6.4).
export default function AdminReportsPage() {
  const summary = useQuery({ queryKey: ["admin", "reports", "summary"], queryFn: adminReportsApi.summary });

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader
        title="Reports & Analytics"
        description="Cohort-wide distributions."
        actions={
          <a href={adminReportsApi.claimsExportUrl()} target="_blank" rel="noreferrer">
            <Button variant="secondary">Export claims CSV</Button>
          </a>
        }
      />

      {summary.isLoading ? (
        <Spinner />
      ) : summary.isError ? (
        <ErrorBanner error={summary.error} />
      ) : summary.data ? (
        <div className="grid grid-cols-1 gap-6 desktop:grid-cols-2">
          <ReportTable
            title="Points by category"
            rows={summary.data.pointsByCategory.map((r) => [r.category.replace(/_/g, " "), `${r.approvedCount} approved`, `${r.totalPointsAwarded} pts`])}
          />
          <ReportTable title="Claims by status" rows={summary.data.claimsByStatus.map((r) => [r.status, `${r.count}`])} />
          <ReportTable
            title="Level distribution"
            rows={summary.data.levelDistribution.sort((a, b) => a.levelId - b.levelId).map((r) => [`Level ${r.levelId}`, `${r.count} students`])}
          />
          <ReportTable
            title="Startup stage distribution"
            rows={summary.data.startupStageDistribution.sort((a, b) => a.stage - b.stage).map((r) => [`Stage ${r.stage}`, `${r.count} projects`])}
          />
          <ConsoleCard>
            <h2 className="text-h2 text-ink">Problem Bank usage</h2>
            <div className="mt-3 flex gap-8 font-mono text-body text-text-muted">
              <div>
                <div className="text-caption text-text-muted">Submissions</div>
                <div className="text-h1 text-ink">{summary.data.problemBank.submissionCount}</div>
              </div>
              <div>
                <div className="text-caption text-text-muted">Distinct students</div>
                <div className="text-h1 text-ink">{summary.data.problemBank.distinctSubmitters}</div>
              </div>
            </div>
          </ConsoleCard>
        </div>
      ) : null}
    </ConsoleShell>
  );
}

function ReportTable({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <ConsoleCard>
      <h2 className="text-h2 text-ink">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-body text-text-muted">No data yet.</p>
      ) : (
        <table className="mt-3 w-full text-left">
          <tbody className="divide-y divide-navy-700">
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className={"py-2 " + (j === 0 ? "text-body text-text-muted" : "text-right font-mono text-caption text-ink")}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ConsoleCard>
  );
}
