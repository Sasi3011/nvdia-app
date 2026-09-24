"use client";

import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ProblemProjectsManager } from "../../../components/modules/ProblemProjectsManager";

export default function AdminProblemProjectsPage() {
  return (
    <ConsoleShell role="ADMIN">
      <ProblemProjectsManager />
    </ConsoleShell>
  );
}