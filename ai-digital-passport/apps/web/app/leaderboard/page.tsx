"use client";

import { StudentShell } from "../../components/shell/StudentShell";
import { LeaderboardView } from "../../components/leaderboard/LeaderboardView";

export default function LeaderboardPage() {
  return (
    <StudentShell>
      <LeaderboardView showSelf />
    </StudentShell>
  );
}
