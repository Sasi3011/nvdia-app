"use client";

import { useQuery } from "@tanstack/react-query";
import { PROBLEM_BANK_MIN_LEVEL } from "@ai-digital-passport/shared-types";
import { StudentShell } from "../../components/shell/StudentShell";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { PageHeader } from "../../components/ui/PageHeader";
import { Spinner } from "../../components/ui/Spinner";
import { ApiError } from "../../lib/api-client";
import { problemsApi } from "../../lib/api";
import { useMe } from "../../lib/session";

// Page 11 — Industry Problem Bank (spec 02 Section 6.2). BR-07: Level 3+
// only. The frontend also checks the level so the locked message is
// specific and motivational (Section 18.9) rather than waiting on a raw
// 403 — but the backend independently re-verifies on every request
// (SEC-06) regardless of what this page shows.
export default function ProblemsPage() {
  return (
    <StudentShell>
      <PageHeader title="Industry Problem Bank" description="Real industry problem statements for eligible students." />
      <ProblemsContent />
    </StudentShell>
  );
}

function ProblemsContent() {
  const me = useMe(true);
  const problems = useQuery({
    queryKey: ["problems"],
    queryFn: () => problemsApi.list({ page: 1, pageSize: 50 }),
    enabled: !!me.data && me.data.level.levelId >= PROBLEM_BANK_MIN_LEVEL,
  });

  if (me.isLoading) return <Spinner />;
  if (!me.data) return null;

  if (me.data.level.levelId < PROBLEM_BANK_MIN_LEVEL) {
    return (
      <EmptyState
        message={`Reach Level ${PROBLEM_BANK_MIN_LEVEL} (AI Builder — 2,000 pts) to unlock the Industry Problem Bank. You're at Level ${me.data.level.levelId} with ${me.data.totalPoints.toLocaleString()} pts.`}
      />
    );
  }

  if (problems.isLoading) return <Spinner />;
  if (problems.isError) {
    const message = problems.error instanceof ApiError ? problems.error.message : undefined;
    return <ErrorBanner error={problems.error ?? message} />;
  }

  const items = problems.data?.items ?? [];
  if (items.length === 0) {
    return <EmptyState message="No problem statements published yet — check back soon." />;
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((p) => (
        <Card key={p.problemId}>
          <div className="flex items-center justify-between">
            <h2 className="text-h2 text-ink">{p.title}</h2>
            {p.organization ? <span className="text-caption text-text-muted">{p.organization}</span> : null}
          </div>
          <p className="mt-2 text-body text-text-muted">{p.description}</p>
        </Card>
      ))}
    </div>
  );
}
