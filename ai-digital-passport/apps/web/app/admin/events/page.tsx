"use client";

import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { EventsManager } from "../../../components/modules/EventsManager";

export default function AdminEventsPage() {
  return (
    <ConsoleShell role="ADMIN">
      <EventsManager />
    </ConsoleShell>
  );
}
