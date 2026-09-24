"use client";

import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { StartupsManager } from "../../../components/modules/StartupsManager";

export default function AdminStartupsPage() {
  return (
    <ConsoleShell role="ADMIN">
      <StartupsManager />
    </ConsoleShell>
  );
}
