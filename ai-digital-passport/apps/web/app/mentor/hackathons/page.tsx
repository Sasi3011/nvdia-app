"use client";

import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { HackathonsManager } from "../../../components/modules/HackathonsManager";

// Same Hackathons screen as the admin portal — faculty have the same
// add/edit/delete/fetch access and verify student proofs from here.
export default function MentorHackathonsPage() {
  return (
    <ConsoleShell role="MENTOR">
      <HackathonsManager />
    </ConsoleShell>
  );
}
