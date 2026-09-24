"use client";

import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { AwardRequests } from "../../../components/modules/AwardRequests";

// Same layout as the admin Awards page, showing the faculty member's own
// requests and nominations.
export default function MentorAwardsPage() {
  return (
    <ConsoleShell role="MENTOR">
      <AwardRequests isStaff />
    </ConsoleShell>
  );
}
