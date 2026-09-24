"use client";

import { StudentShell } from "../../components/shell/StudentShell";
import { AwardRequests } from "../../components/modules/AwardRequests";

// Same layout as the admin Awards page, showing the student's own requests.
export default function AwardsPage() {
  return (
    <StudentShell>
      <AwardRequests isStaff={false} />
    </StudentShell>
  );
}
