"use client";

import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { ExternalHackathons } from "../../../components/modules/ExternalHackathons";

export default function MentorHackathonsPage() {
  return (
    <ConsoleShell role="MENTOR">
      <ConsolePageHeader
        title="AI & LLM Hackathons"
        description="Browse hackathons pulled from Devpost, Unstop and Devfolio, and add ones your students should know about."
      />
      <ExternalHackathons canManage />
    </ConsoleShell>
  );
}
