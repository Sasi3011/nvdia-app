"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StudentShell } from "../../components/shell/StudentShell";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { PageHeader } from "../../components/ui/PageHeader";
import { Spinner } from "../../components/ui/Spinner";
import { StatusChip, type Status } from "../../components/ui/StatusChip";
import { gpuApi } from "../../lib/api";
import { useMe } from "../../lib/session";

const PURPOSES = ["Course Lab", "Project", "Research", "Hackathon", "Startup GPU Validation"] as const;

export default function GpuPage() {
  const me = useMe(true);
  const queryClient = useQueryClient();
  const requests = useQuery({ queryKey: ["gpu", "requests"], queryFn: gpuApi.mine });
  const [purpose, setPurpose] = useState<string>("Course Lab");
  const [title, setTitle] = useState("");
  const [credits, setCredits] = useState(10);
  const [justification, setJustification] = useState("");
  const create = useMutation({
    mutationFn: () => gpuApi.create({ purpose, title, requestedCredits: credits, justification }),
    onSuccess: () => {
      setTitle("");
      setCredits(10);
      setJustification("");
      queryClient.invalidateQueries({ queryKey: ["gpu", "requests"] });
    },
  });

  return (
    <StudentShell>
      <div className="flex flex-col gap-6">
        <PageHeader title="GPU Access" description="Request, justify and track GPU credits for labs, projects, research, hackathons and startup validation." />

        <div className="grid grid-cols-1 gap-4 tablet:grid-cols-3">
          <Metric label="Available credits" value={me.data?.gpuCreditBalance?.toLocaleString() ?? "0"} />
          <Metric label="Approval path" value="Mentor + Admin" />
          <Metric label="Best use" value="Labs / Research / MVP" />
        </div>

        <Card>
          <h2 className="text-h2 text-ink">GPU request form</h2>
          <form
            className="mt-4 grid grid-cols-1 gap-3 tablet:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
          >
            {create.isError ? <ErrorBanner error={create.error} /> : null}
            <label className="flex flex-col gap-1">
              <span className="text-caption text-text-muted">Purpose</span>
              <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="rounded-card border border-border px-3 py-2 text-body">
                {PURPOSES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-caption text-text-muted">Request title</span>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="LLM fine-tuning experiment" className="rounded-card border border-border px-3 py-2 text-body" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-caption text-text-muted">Requested credits / hours</span>
              <input type="number" min={1} value={credits} onChange={(e) => setCredits(Number(e.target.value))} className="rounded-card border border-border px-3 py-2 text-body" />
            </label>
            <label className="flex flex-col gap-1 tablet:col-span-2">
              <span className="text-caption text-text-muted">Justification</span>
              <textarea required rows={4} value={justification} onChange={(e) => setJustification(e.target.value)} placeholder="Explain dataset, model, experiment, deadline and expected outcome." className="rounded-card border border-border px-3 py-2 text-body" />
            </label>
            <Button type="submit" variant="primary" className="justify-self-start" disabled={create.isPending}>
              {create.isPending ? "Submitting..." : "Submit request"}
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="text-h2 text-ink">My GPU requests</h2>
          {requests.isLoading ? (
            <Spinner />
          ) : requests.isError ? (
            <ErrorBanner error={requests.error} />
          ) : !requests.data || requests.data.length === 0 ? (
            <p className="mt-3 text-body text-text-muted">No GPU requests yet.</p>
          ) : (
            <div className="mt-3 divide-y divide-border">
              {requests.data.map((request) => (
                <div key={request.gpu_request_id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-body text-ink">{request.title}</div>
                    <div className="font-mono text-caption text-text-muted">{request.requested_credits} requested · {request.allocated_credits ?? 0} allocated</div>
                  </div>
                  <StatusChip status={(request.status === "REJECTED" ? "REJECTED" : request.status === "APPROVED" || request.status === "ALLOCATED" ? "APPROVED" : "PENDING") as Status} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-h2 text-ink">Workflow</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 tablet:grid-cols-4">
            {["Student submits", "Mentor recommends", "Admin allocates", "Usage appears in AI Passport"].map((item, index) => (
              <div key={item} className="rounded-card bg-surface-muted p-3">
                <div className="font-mono text-caption text-navy-700">0{index + 1}</div>
                <div className="mt-1 text-body text-ink">{item}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </StudentShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <div className="text-caption text-text-muted">{label}</div>
      <div className="mt-1 text-h1 text-ink">{value}</div>
    </Card>
  );
}
