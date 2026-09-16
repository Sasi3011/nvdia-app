"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsoleCard } from "../../../components/console/ConsoleCard";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { Button } from "../../../components/ui/Button";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { StatusChip, type Status } from "../../../components/ui/StatusChip";
import { mentorApi } from "../../../lib/api";

const STATUS_FILTERS: { value: Status | ""; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "", label: "All" },
];

// Page 21 — Mentor Review Queue (spec 02 Section 6.3). Shared-pool model
// (open decision #3) — any mentor can open and review any pending claim,
// paginated per the API Design Rules (spec 04 Section 9).
export default function MentorQueuePage() {
  const [status, setStatus] = useState<Status | "">("PENDING");
  const [page, setPage] = useState(1);
  const queue = useQuery({
    queryKey: ["mentor", "queue", status, page],
    queryFn: () => mentorApi.queue({ page, pageSize: 20, status: status || undefined }),
  });

  return (
    <ConsoleShell role="MENTOR">
      <ConsolePageHeader
        title={`Queue: ${status ? status[0] + status.slice(1).toLowerCase() : "All"} Claims (${queue.data?.total ?? "…"})`}
        description="Open a claim to review its evidence."
      />

      <div className="mb-4 flex gap-2">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={status === f.value ? "primary" : "secondary"}
            onClick={() => {
              setStatus(f.value);
              setPage(1);
            }}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {queue.isLoading ? (
        <Spinner />
      ) : queue.isError ? (
        <ErrorBanner error={queue.error} />
      ) : !queue.data || queue.data.items.length === 0 ? (
        <p className="text-body text-text-muted">Nothing here — the queue is clear.</p>
      ) : (
        <>
          <ConsoleCard className="overflow-x-auto p-0">
            <table className="w-full text-left">
              <thead className="sticky top-0 border-b border-border bg-surface text-caption text-text-muted">
                <tr>
                  <th className="px-6 py-3 font-normal">Student</th>
                  <th className="px-6 py-3 font-normal">Category</th>
                  <th className="px-6 py-3 font-normal">Proof</th>
                  <th className="px-6 py-3 font-normal">Submitted</th>
                  <th className="px-6 py-3 font-normal">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700">
                {queue.data.items.map((c, i) => (
                  <tr key={c.claimId} className={i % 2 === 1 ? "bg-surface-muted/60" : undefined}>
                    <td className="px-6 py-3">
                      <Link href={`/mentor/queue/detail?id=${c.claimId}`} className="text-body text-ink hover:underline">
                        {c.student.fullName}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-body text-text-muted">{c.category.replace(/_/g, " ")}</td>
                    <td className="px-6 py-3 font-mono text-caption text-text-muted">{c.proofType.replace(/_/g, " ")}</td>
                    <td className="px-6 py-3 font-mono text-caption text-text-muted">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3">
                      <StatusChip status={c.status as Status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ConsoleCard>

          {queue.data.total > queue.data.pageSize ? (
            <div className="mt-4 flex items-center justify-between">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-caption text-text-muted">
                Page {queue.data.page} of {Math.ceil(queue.data.total / queue.data.pageSize)}
              </span>
              <Button
                variant="secondary"
                disabled={page * queue.data.pageSize >= queue.data.total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </>
      )}
    </ConsoleShell>
  );
}
