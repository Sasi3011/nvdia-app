"use client";

import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { StartupsManager } from "../../../components/modules/StartupsManager";

// Same Startup Launchpad screen as the admin portal. Faculty open a
// startup and approve or reject its pending stage submissions there.
export default function MentorStartupsPage() {
  return (
    <ConsoleShell role="MENTOR">
      <StartupsManager />
    </ConsoleShell>
  );
}
