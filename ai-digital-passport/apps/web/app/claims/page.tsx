"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { StudentShell } from "../../components/shell/StudentShell";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { PageHeader } from "../../components/ui/PageHeader";
import { Spinner } from "../../components/ui/Spinner";
import { StatusChip, type Status } from "../../components/ui/StatusChip";
import { claimsApi } from "../../lib/api";

// Page 15 — My Claims (spec 02 Section 6.2). Rejected claims retain
// mentor feedback (FR-VERIF-03).
export default function ClaimsPage() {
  const [page, setPage] = useState(1);
  const claims = useQuery({ queryKey: ["claims", page], queryFn: () => claimsApi.list({ page, pageSize: 20 }) });

  return (
    <StudentShell>
      <PageHeader
        title="My Claims"
        description="Status and history of everything you've submitted."
        actions={
          <Link href="/claims/new">
            <Button variant="primary">Submit evidence</Button>
          </Link>
        }
      />

      {claims.isLoading ? (
        <Spinner />
      ) : claims.isError ? (
        <ErrorBanner error={claims.error} />
      ) : !claims.data || claims.data.items.length === 0 ? (
        <EmptyState
          message="No claims yet — submit evidence from any module to get started."
          action={
            <Link href="/claims/new">
              <Button variant="primary">Submit evidence</Button>
            </Link>
          }
        />
      ) : (
        <>
          <Card className="divide-y divide-border p-0">
            {claims.data.items.map((c) => (
              <Link
                key={c.claimId}
                href={`/claims/detail?id=${c.claimId}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-surface-muted"
              >
                <div>
                  <div className="text-body text-ink">{c.category.replace(/_/g, " ")}</div>
                  <div className="font-mono text-caption text-text-muted">
                    {new Date(c.createdAt).toLocaleDateString()} · {c.proofType.replace(/_/g, " ")}
                    {c.pointsAwarded != null ? ` · +${c.pointsAwarded} pts` : ` · ${c.pointsRequested} pts requested`}
                  </div>
                  {c.status === "REJECTED" && c.mentorFeedback ? (
                    <div className="mt-1 text-caption text-rejected">{c.mentorFeedback}</div>
                  ) : null}
                </div>
                <StatusChip status={c.status as Status} />
              </Link>
            ))}
          </Card>

          {claims.data.total > claims.data.pageSize ? (
            <div className="mt-4 flex items-center justify-between">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-caption text-text-muted">
                Page {claims.data.page} of {Math.ceil(claims.data.total / claims.data.pageSize)}
              </span>
              <Button
                variant="secondary"
                disabled={page * claims.data.pageSize >= claims.data.total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </>
      )}
    </StudentShell>
  );
}
