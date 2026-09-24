"use client";

import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ProblemProjectsManager } from "../../../components/modules/ProblemProjectsManager";

// Same Problem Solutions screen as the admin portal; faculty open a
// solution and approve or reject its pending stages there.

export default function MentorProblemsPage() {
  return (
    <ConsoleShell role="MENTOR">
      <ProblemProjectsManager />
    </ConsoleShell>
  );
}