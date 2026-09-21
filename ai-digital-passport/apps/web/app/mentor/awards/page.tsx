"use client";

import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { AwardRequests } from "../../../components/modules/AwardRequests";

export default function MentorAwardsPage() {
  return (
    <ConsoleShell role="MENTOR">
      <ConsolePageHeader
        title="Awards"
        description="Request an award, or nominate a student or fellow mentor (by email). The admin reviews every request."
      />
      <div className="mt-6">
        <AwardRequests isStaff />
      </div>
    </ConsoleShell>
  );
}
