"use client";

import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { HackathonsManager } from "../../../components/modules/HackathonsManager";

export default function AdminHackathonsPage() {
  return (
    <ConsoleShell role="ADMIN">
      <HackathonsManager />
    </ConsoleShell>
  );
}
