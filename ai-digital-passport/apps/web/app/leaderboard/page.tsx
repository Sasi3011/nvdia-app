"use client";

import { useQuery } from "@tanstack/react-query";
import { StudentShell } from "../../components/shell/StudentShell";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { PageHeader } from "../../components/ui/PageHeader";
import { Spinner } from "../../components/ui/Spinner";
import { leaderboardApi } from "../../lib/api";
import { useMe } from "../../lib/session";

// Page 13 — Leaderboard & Awards (spec 02 Section 6.2). Read-only for
// students; backed by Redis with a PostgreSQL fallback (handled
// server-side, spec 01 Section 5.1). Tie-break (earliest account wins) is
// a documented assumption — open decision #9, see apps/api's
// leaderboard.service.ts.
export default function LeaderboardPage() {
  return (
    <StudentShell>
      <PageHeader title="Leaderboard" description="Cohort ranking by total points." />
      <LeaderboardContent />
    </StudentShell>
  );
}

function LeaderboardContent() {
  const me = useMe(true);
  const leaderboard = useQuery({ queryKey: ["leaderboard"], queryFn: () => leaderboardApi.top(50) });

  if (leaderboard.isLoading) return <Spinner />;
  if (leaderboard.isError) return <ErrorBanner error={leaderboard.error} />;
  if (!leaderboard.data || leaderboard.data.length === 0) {
    return <EmptyState message="No ranked students yet." />;
  }

  return (
    <Card className="divide-y divide-border p-0">
      {leaderboard.data.map((entry, index) => (
        <div
          key={entry.userId}
          className={"flex items-center justify-between px-6 py-4" + (entry.userId === me.data?.userId ? " bg-accent/5" : "")}
        >
          <div className="flex items-center gap-4">
            <span className="font-mono text-caption text-text-muted">#{index + 1}</span>
            <div>
              <div className="text-body text-ink">{entry.fullName}</div>
              <div className="text-caption text-text-muted">{entry.levelName}</div>
            </div>
          </div>
          <span className="font-mono text-body font-medium text-ink">{entry.totalPoints.toLocaleString()} pts</span>
        </div>
      ))}
    </Card>
  );
}
