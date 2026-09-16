"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsoleCard } from "../../../components/console/ConsoleCard";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { Button } from "../../../components/ui/Button";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { adminProblemsApi, type AdminProblemResponse, type UpsertProblemInput } from "../../../lib/api";
import { Lightbulb, Building, ShieldCheck } from "lucide-react";

const STATUSES: UpsertProblemInput["status"][] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const inputClass = "w-full rounded-lg border border-border bg-white px-3 py-2.5 text-[14px] text-ink placeholder:text-gray-400 focus:border-[#1A56DB] focus:outline-none focus:ring-1 focus:ring-[#1A56DB]";

export default function AdminProblemsPage() {
  const queryClient = useQueryClient();
  const problems = useQuery({ queryKey: ["admin", "problems"], queryFn: () => adminProblemsApi.list({ page: 1, pageSize: 100 }) });
  const [editing, setEditing] = useState<AdminProblemResponse | "new" | null>(null);

  const invalidate = () => {
    setEditing(null);
    queryClient.invalidateQueries({ queryKey: ["admin", "problems"] });
  };

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader
        title="Problem Bank Management"
        description="Create and manage industry problem statements."
        actions={
          <Button variant="primary" onClick={() => setEditing("new")}>
            New problem
          </Button>
        }
      />

      {editing ? (
        <ProblemForm problem={editing === "new" ? null : editing} onDone={invalidate} onCancel={() => setEditing(null)} />
      ) : null}

      {problems.isLoading ? (
        <Spinner />
      ) : problems.isError ? (
        <ErrorBanner error={problems.error} />
      ) : !problems.data || problems.data.items.length === 0 ? (
        <p className="mt-4 text-[14px] text-text-muted">No problem statements yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-surface-muted text-[12px] font-bold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-6 py-4">Problem Statement</th>
                <th className="px-6 py-4">Organization</th>
                <th className="px-6 py-4 text-center">Level Req</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {problems.data.items.map((p) => (
                <tr key={p.problemId} onClick={() => setEditing(p)} className="group cursor-pointer transition-colors hover:bg-blue-50/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1A56DB]/10 text-[#1A56DB]">
                        <Lightbulb className="h-5 w-5" />
                      </div>
                      <span className="font-bold text-ink">{p.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 font-medium text-text-muted">
                      <Building className="h-4 w-4" /> {p.organization ?? "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1.5 font-bold text-ink">
                      <ShieldCheck className="h-4 w-4 text-[#1A56DB]" /> Lvl {p.levelRequirement}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <StatusBadge status={p.status} />
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

function StatusBadge({ status }: { status: string }) {
  if (status === "PUBLISHED") {
    return <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">Published</span>;
  }
  if (status === "ARCHIVED") {
    return <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-600">Archived</span>;
  }
  return <span className="inline-flex rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700">Draft</span>;
}

function ProblemForm({
  problem,
  onDone,
  onCancel,
}: {
  problem: AdminProblemResponse | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(problem?.title ?? "");
  const [description, setDescription] = useState(problem?.description ?? "");
  const [organization, setOrganization] = useState(problem?.organization ?? "");
  const [status, setStatus] = useState<UpsertProblemInput["status"]>(problem?.status ?? "DRAFT");
  const [levelRequirement, setLevelRequirement] = useState(problem?.levelRequirement ?? 3);

  const save = useMutation({
    mutationFn: (overrideStatus?: UpsertProblemInput["status"]) => {
      const input: UpsertProblemInput = { title, description, organization: organization || undefined, status: overrideStatus ?? status, levelRequirement };
      return problem ? adminProblemsApi.update(problem.problemId, input) : adminProblemsApi.create(input);
    },
    onSuccess: onDone,
  });

  return (
    <ConsoleCard className="mb-8 rounded-2xl border-border bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-[18px] font-bold text-ink">{problem ? "Edit Problem" : "New Problem"}</h3>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        {save.isError ? <ErrorBanner error={save.error} /> : null}
        
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-ink">Title</label>
          <input required placeholder="E.g. Predictive Maintenance AI" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-ink">Description</label>
          <textarea
            required
            rows={3}
            placeholder="Detailed description of the problem statement"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </div>
        
        <div className="grid grid-cols-1 gap-4 tablet:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-ink">Organization</label>
            <input
              placeholder="E.g. NVIDIA or internal"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-ink">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as UpsertProblemInput["status"])} className={inputClass}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-ink">Min Level Req</label>
            <input
              required
              type="number"
              min={1}
              max={6}
              placeholder="Level 3+"
              value={levelRequirement}
              onChange={(e) => setLevelRequirement(Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>
        
        <div className="mt-2 flex gap-3">
          <Button type="submit" variant="primary" disabled={save.isPending}>
            {save.isPending ? "Saving…" : problem ? "Save Changes" : "Create"}
          </Button>
          {status !== "PUBLISHED" && (
            <button 
              type="button" 
              disabled={save.isPending} 
              onClick={() => save.mutate("PUBLISHED")}
              className="rounded-lg border border-[#1A56DB] px-4 py-2 text-[13px] font-bold text-[#1A56DB] transition-colors hover:bg-[#1A56DB] hover:text-white"
            >
              Publish Instantly
            </button>
          )}
          <Button type="button" variant="secondary" onClick={onCancel} className="bg-white">
            Cancel
          </Button>
        </div>
      </form>
    </ConsoleCard>
  );
}
