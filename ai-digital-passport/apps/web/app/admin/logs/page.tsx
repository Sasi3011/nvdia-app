"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { adminAuditApi } from "../../../lib/api";
import { Activity, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminLogsPage() {
  const [page, setPage] = useState(1);
  const logs = useQuery({ queryKey: ["admin", "audit", "logs", page], queryFn: () => adminAuditApi.logs({ page, pageSize: 30 }) });

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader 
        title="Supercomputing Security & Audit Logs" 
        description="Immutable chronological record of administrative approvals, compute allocations, and role assignments." 
      />

      {logs.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner label="Loading audit logs..." />
        </div>
      ) : logs.isError ? (
        <ErrorBanner error={logs.error} />
      ) : !logs.data || logs.data.items.length === 0 ? (
        <p className="mt-4 text-xs text-slate-500">No audit log entries recorded yet.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Actor / Origin</th>
                  <th className="px-6 py-3.5">Action Executed</th>
                  <th className="px-6 py-3.5">Entity Reference</th>
                  <th className="px-6 py-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.data.items.map((l) => (
                  <tr key={l.auditLogId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1755A7]/10 text-[#1755A7]">
                          <ShieldCheck className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-bold text-slate-900">{l.actorName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-mono font-semibold text-[#1755A7]">
                      {l.action}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-500">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {l.entityType}{l.entityId ? `:${l.entityId.slice(0, 8)}` : ""}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono text-slate-400">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {logs.data.total > logs.data.pageSize ? (
            <div className="flex items-center justify-between px-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <span className="text-xs font-mono font-medium text-slate-500">
                Page {logs.data.page} of {Math.ceil(logs.data.total / logs.data.pageSize)}
              </span>

              <button
                type="button"
                disabled={page * logs.data.pageSize >= logs.data.total}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      )}
    </ConsoleShell>
  );
}
