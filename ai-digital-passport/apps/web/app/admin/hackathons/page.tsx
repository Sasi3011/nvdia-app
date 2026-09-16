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

const inputClass = "rounded-card border border-border bg-surface px-3 py-2 text-body text-ink placeholder:text-text-muted";

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
          <a href={adminReportsApi.hackathonsExportUrl()} target="_blank" rel="noreferrer">
            <Button variant="secondary">Export CSV</Button>
          </a>
        }
      />

      <ConsoleCard className="mb-6">
        <h2 className="text-h2 text-ink">Create hackathon</h2>
        <form
          className="mt-3 grid grid-cols-1 gap-3 tablet:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          {create.isError ? <ErrorBanner error={create.error} /> : null}
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Hackathon title" className={inputClass} />
          <input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Theme" className={inputClass} />
          <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className={inputClass + " tablet:col-span-2"} />
          <Button type="submit" variant="primary" disabled={create.isPending} className="justify-self-start">
            {create.isPending ? "Creating..." : "Create"}
          </Button>
        </form>
      </ConsoleCard>

      {hackathons.isLoading ? (
        <Spinner />
      ) : hackathons.isError ? (
        <ErrorBanner error={hackathons.error} />
      ) : (
        <ConsoleCard className="divide-y divide-navy-700 p-0">
          {(hackathons.data ?? []).map((hackathon) => (
            <div key={hackathon.hackathon_id} className="flex items-center justify-between px-6 py-4">
              <div>
                <div className="text-body text-ink">{hackathon.title}</div>
                <div className="text-caption text-text-muted">
                  {hackathon.status} · {hackathon.teams.length} teams · {hackathon.submissions.length} submissions
                </div>
              </div>
              <span className="font-mono text-caption text-accent">{hackathon.theme ?? "AI Challenge"}</span>
            </div>
          ))}
        </ConsoleCard>
      )}
    </ConsoleShell>
  );
}
