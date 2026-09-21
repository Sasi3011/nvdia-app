"use client";

import { useState } from "react";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { ExternalHackathons } from "../../../components/modules/ExternalHackathons";
import { HackathonApplications } from "../../../components/modules/HackathonApplications";

export default function MentorHackathonsPage() {
  const [tab, setTab] = useState<"LIST" | "APPLICATIONS">("LIST");
  return (
    <ConsoleShell role="MENTOR">
      <ConsolePageHeader
        title="AI & LLM Hackathons"
        description="Browse hackathons, add ones your students should know about, and track who has applied."
      />
      <div className="mt-4 flex gap-4 border-b border-slate-200">
        {(["LIST", "APPLICATIONS"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`border-b-2 pb-2.5 text-xs font-bold ${tab === t ? "border-[#1755A7] text-[#1755A7]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            {t === "LIST" ? "Hackathons" : "Student Applications"}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {tab === "LIST" ? <ExternalHackathons canManage /> : <HackathonApplications queueHref="/mentor/queue" />}
      </div>
    </ConsoleShell>
  );
}
