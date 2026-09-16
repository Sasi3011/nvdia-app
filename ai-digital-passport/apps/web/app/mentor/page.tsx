"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ConsoleShell } from "../../components/console/ConsoleShell";
import { ConsoleCard } from "../../components/console/ConsoleCard";
import { ConsolePageHeader } from "../../components/console/ConsolePageHeader";
import { Button } from "../../components/ui/Button";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { Spinner } from "../../components/ui/Spinner";
import { StatusChip, type Status } from "../../components/ui/StatusChip";
import { mentorApi } from "../../lib/api";

// Page 20 — Mentor Dashboard (spec 02 Section 6.3). At-a-glance workload:
// pending queue size and recent activity.
export default function MentorDashboardPage() {
  return (
    <ConsoleShell role="MENTOR">
      <MentorDashboardContent />
    </ConsoleShell>
  );
}

function MentorDashboardContent() {
  const queue = useQuery({ queryKey: ["mentor", "queue", "summary"], queryFn: () => mentorApi.queue({ page: 1, pageSize: 5 }) });

  return (
    <>
      <ConsolePageHeader
        title="Mentor Dashboard"
        description="Your review workload at a glance."
        actions={
          <Link href="/mentor/queue">
            <Button variant="primary">Open queue</Button>
          </Link>
        }
      />

      {queue.isLoading ? (
        <Spinner />
      ) : queue.isError ? (
        <ErrorBanner error={queue.error} />
      ) : (
        <>
          <ConsoleCard className="mb-8 max-w-xs">
            <div className="text-caption text-text-muted">Pending claims</div>
            <div className="mt-1 font-mono text-display text-ink">{queue.data?.total ?? 0}</div>
          </ConsoleCard>

          <h2 className="mb-3 text-h2 text-ink">Recent submissions</h2>
          {queue.data && queue.data.items.length > 0 ? (
            <ConsoleCard className="divide-y divide-navy-700 p-0">
              {queue.data.items.map((c) => (
                <Link
                  key={c.claimId}
                  href={`/mentor/queue/detail?id=${c.claimId}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-surface-muted"
                >
                  <div>
                    <div className="text-body text-ink">{c.student.fullName}</div>
                    <div className="font-mono text-caption text-text-muted">
                      {c.category.replace(/_/g, " ")} · {new Date(c.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <StatusChip status={c.status as Status} />
                </Link>
              ))}
            </ConsoleCard>
          ) : (
            <p className="text-body text-text-muted">No pending claims — the queue is clear.</p>
          )}
        </>
      )}
    </>
  );
}
