"use client";

import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { LeaderboardView } from "../../../components/leaderboard/LeaderboardView";

export default function AdminLeaderboardPage() {
  return (
    <ConsoleShell role="ADMIN">
      <LeaderboardView />
    </ConsoleShell>
  );
}
