"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsoleCard } from "../../../components/console/ConsoleCard";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { Button } from "../../../components/ui/Button";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { adminProgramApi, adminReportsApi, type GpuRequestResponse } from "../../../lib/api";

const inputClass = "rounded-card border border-border bg-surface px-3 py-2 text-body text-ink placeholder:text-text-muted";

export default function AdminGpuPage() {
  const requests = useQuery({ queryKey: ["admin", "gpu", "requests"], queryFn: adminProgramApi.gpuRequests });

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader
        title="GPU Management"
        description="Review requests, allocate credits, and export GPU operations."
        actions={
          <a href={adminReportsApi.gpuExportUrl()} target="_blank" rel="noreferrer">
            <Button variant="secondary">Export CSV</Button>
          </a>
        }
      />

      {requests.isLoading ? (
        <Spinner />
      ) : requests.isError ? (
        <ErrorBanner error={requests.error} />
      ) : !requests.data || requests.data.length === 0 ? (
        <p className="text-body text-text-muted">No GPU requests yet.</p>
      ) : (
        <ConsoleCard className="divide-y divide-navy-700 p-0">
          {requests.data.map((request) => (
            <GpuReviewRow key={request.gpu_request_id} request={request} />
          ))}
        </ConsoleCard>
      )}
    </ConsoleShell>
  );
}

function GpuReviewRow({ request }: { request: GpuRequestResponse }) {
  const queryClient = useQueryClient();
  const [allocatedCredits, setAllocatedCredits] = useState(request.allocated_credits ?? request.requested_credits);
  const [comment, setComment] = useState(request.admin_comment ?? "");
  const review = useMutation({
    mutationFn: (status: string) => adminProgramApi.reviewGpu(request.gpu_request_id, { status, allocatedCredits, comment }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "gpu", "requests"] }),
  });

  return (
    <div className="grid gap-4 px-6 py-4 desktop:grid-cols-[1fr_360px]">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-body text-ink">{request.title}</h2>
          <span className="rounded-full bg-surface-muted px-2 py-0.5 font-mono text-caption text-text-muted">{request.status}</span>
        </div>
        <p className="mt-1 text-caption text-text-muted">
          {request.purpose} · requested {request.requested_credits} credits · allocated {request.allocated_credits ?? 0}
        </p>
        <p className="mt-2 text-body text-text-muted">{request.justification}</p>
      </div>
      <form className="flex flex-col gap-2">
        {review.isError ? <ErrorBanner error={review.error} /> : null}
        <input type="number" min={1} value={allocatedCredits} onChange={(e) => setAllocatedCredits(Number(e.target.value))} className={inputClass} />
        <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Review comment" className={inputClass} />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={review.isPending} onClick={() => review.mutate("MENTOR_RECOMMENDED")}>
            Recommend
          </Button>
          <Button type="button" variant="primary" disabled={review.isPending} onClick={() => review.mutate("ALLOCATED")}>
            Allocate
          </Button>
          <Button type="button" variant="destructive" disabled={review.isPending} onClick={() => review.mutate("REJECTED")}>
            Reject
          </Button>
        </div>
      </form>
    </div>
  );
}
