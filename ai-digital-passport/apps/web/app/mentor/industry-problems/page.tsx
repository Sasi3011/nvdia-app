"use client";

import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ProblemsManager } from "../../../components/modules/ProblemsManager";

// Same Industry Problem Bank screen as the admin portal (same access).

export default function MentorIndustryProblemsPage() {
  return (
    <ConsoleShell role="MENTOR">
      <ProblemsManager />
    </ConsoleShell>
  );
}