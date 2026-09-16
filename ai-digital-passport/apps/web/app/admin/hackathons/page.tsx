"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsoleCard } from "../../../components/console/ConsoleCard";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { Button } from "../../../components/ui/Button";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { adminProgramApi, adminReportsApi, hackathonsApi } from "../../../lib/api";
import { Flag, Download, Users, FileCode2 } from "lucide-react";

const inputClass = "w-full rounded-lg border border-border bg-white px-3 py-2.5 text-[14px] text-ink placeholder:text-gray-400 focus:border-[#1A56DB] focus:outline-none focus:ring-1 focus:ring-[#1A56DB]";

export default function AdminHackathonsPage() {
  const queryClient = useQueryClient();
  const hackathons = useQuery({ queryKey: ["hackathons"], queryFn: hackathonsApi.list });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState("");
  
  const create = useMutation({
    mutationFn: () =>
      adminProgramApi.createHackathon({
        title,
        description,
        theme: theme || undefined,
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        teamSizeMin: 1,
        teamSizeMax: 4,
        status: "REGISTRATION_OPEN",
        pointsParticipation: 100,
        pointsWinner: 250,
      }),
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setTheme("");
      queryClient.invalidateQueries({ queryKey: ["hackathons"] });
    },
  });

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader
        title="Hackathon Management"
        description="Create challenges and monitor teams, submissions, evaluations, and exports."
        actions={
          <a href={adminReportsApi.hackathonsExportUrl()} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg bg-surface-muted px-4 py-2 text-[14px] font-medium text-ink transition-all hover:bg-gray-200 border border-border shadow-sm">
            <Download className="h-4 w-4" /> Export CSV
          </a>
        }
      />

      <ConsoleCard className="mb-8 rounded-2xl border-border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-[18px] font-bold text-ink">Create Hackathon</h2>
        <form
          className="grid grid-cols-1 gap-4 tablet:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          {create.isError ? (
            <div className="tablet:col-span-2">
              <ErrorBanner error={create.error} />
            </div>
          ) : null}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-ink">Title</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="E.g. AI Innovation Challenge" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-ink">Theme</label>
            <input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="E.g. Healthcare AI" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5 tablet:col-span-2">
            <label className="text-[13px] font-bold text-ink">Description</label>
            <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Hackathon rules and description" className={inputClass} />
          </div>
          <div className="mt-2 flex justify-start tablet:col-span-2">
            <Button type="submit" variant="primary" disabled={create.isPending} className="w-full tablet:w-auto">
              {create.isPending ? "Creating..." : "Create Hackathon"}
            </Button>
          </div>
        </form>
      </ConsoleCard>

      {hackathons.isLoading ? (
        <Spinner />
      ) : hackathons.isError ? (
        <ErrorBanner error={hackathons.error} />
      ) : !hackathons.data || hackathons.data.length === 0 ? (
        <p className="text-[14px] text-text-muted">No hackathons created yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-surface-muted text-[12px] font-bold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-6 py-4">Hackathon</th>
                <th className="px-6 py-4">Theme</th>
                <th className="px-6 py-4 text-center">Participation</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(hackathons.data ?? []).map((hackathon) => (
                <tr key={hackathon.hackathon_id} className="group transition-colors hover:bg-blue-50/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1A56DB]/10 text-[#1A56DB]">
                        <Flag className="h-5 w-5" />
                      </div>
                      <span className="font-bold text-ink">{hackathon.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-[#1A56DB]">{hackathon.theme ?? "AI Challenge"}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-4 text-[13px] text-text-muted">
                      <span className="flex items-center gap-1.5" title="Teams">
                        <Users className="h-4 w-4" /> {hackathon.teams.length}
                      </span>
                      <span className="flex items-center gap-1.5" title="Submissions">
                        <FileCode2 className="h-4 w-4" /> {hackathon.submissions.length}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-700">
                      {hackathon.status.replace(/_/g, " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ConsoleShell>
  );
}
