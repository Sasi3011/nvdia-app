"use client";

import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { LeaderboardView } from "../../../components/leaderboard/LeaderboardView";

export default function MentorLeaderboardPage() {
  return (
    <ConsoleShell role="MENTOR">
      <LeaderboardView />
    </ConsoleShell>
  );
}
