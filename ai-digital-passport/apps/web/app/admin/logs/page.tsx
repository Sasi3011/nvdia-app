"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsoleCard } from "../../../components/console/ConsoleCard";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { Button } from "../../../components/ui/Button";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { adminAuditApi } from "../../../lib/api";

// Page 31 — Audit Log Viewer (spec 02 Section 6.4, SEC-09). Claim
// approvals/rejections, scoring/config changes, role changes, annual
// audit runs — everything AuditLogService records across the API.
export default function AdminLogsPage() {
  const [page, setPage] = useState(1);
  const logs = useQuery({ queryKey: ["admin", "audit", "logs", page], queryFn: () => adminAuditApi.logs({ page, pageSize: 30 }) });

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader title="Audit Log" description="Chronological record of sensitive administrative and verification actions." />

      {logs.isLoading ? (
        <Spinner />
      ) : logs.isError ? (
        <ErrorBanner error={logs.error} />
      ) : !logs.data || logs.data.items.length === 0 ? (
        <p className="text-body text-text-muted">No audit log entries yet.</p>
      ) : (
        <>
          <ConsoleCard className="overflow-x-auto p-0">
            <table className="w-full text-left">
              <thead className="border-b border-navy-700 text-caption text-text-muted">
                <tr>
                  <th className="px-6 py-3 font-normal">Actor</th>
                  <th className="px-6 py-3 font-normal">Action</th>
                  <th className="px-6 py-3 font-normal">Entity</th>
                  <th className="px-6 py-3 font-normal">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700">
                {logs.data.items.map((l, i) => (
                  <tr key={l.auditLogId} className={i % 2 === 1 ? "bg-surface-muted/60" : undefined}>
                    <td className="px-6 py-3 text-body text-ink">{l.actorName}</td>
                    <td className="px-6 py-3 font-mono text-caption text-text-muted">{l.action}</td>
                    <td className="px-6 py-3 font-mono text-caption text-text-muted">
                      {l.entityType}
                      {l.entityId ? `:${l.entityId.slice(0, 8)}` : ""}
                    </td>
                    <td className="px-6 py-3 font-mono text-caption text-text-muted">{new Date(l.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ConsoleCard>

          {logs.data.total > logs.data.pageSize ? (
            <div className="mt-4 flex items-center justify-between">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-caption text-text-muted">
                Page {logs.data.page} of {Math.ceil(logs.data.total / logs.data.pageSize)}
              </span>
              <Button variant="secondary" disabled={page * logs.data.pageSize >= logs.data.total} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          ) : null}
        </>
      )}
    </ConsoleShell>
  );
}
