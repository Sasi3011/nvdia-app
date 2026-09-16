"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { Button } from "../../../components/ui/Button";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { adminProgramApi, adminReportsApi, type GpuRequestResponse } from "../../../lib/api";
import { Cpu, Download } from "lucide-react";

export default function AdminGpuPage() {
  const requests = useQuery({ queryKey: ["admin", "gpu", "requests"], queryFn: adminProgramApi.gpuRequests });

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader
        title="GPU Management"
        description="Review requests, allocate credits, and export GPU operations."
        actions={
          <a href={adminReportsApi.gpuExportUrl()} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg bg-surface-muted px-4 py-2 text-[14px] font-medium text-ink transition-all hover:bg-gray-200 border border-border shadow-sm">
            <Download className="h-4 w-4" /> Export CSV
          </a>
        }
      />

      {requests.isLoading ? (
        <Spinner />
      ) : requests.isError ? (
        <ErrorBanner error={requests.error} />
      ) : !requests.data || requests.data.length === 0 ? (
        <p className="mt-4 text-[14px] text-text-muted">No GPU requests yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-surface-muted text-[12px] font-bold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-6 py-4">Request</th>
                <th className="px-6 py-4">Status & Credits</th>
                <th className="px-6 py-4">Admin Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {requests.data.map((request) => (
                <GpuReviewRow key={request.gpu_request_id} request={request} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ConsoleShell>
  );
}

function GpuReviewRow({ request }: { request: GpuRequestResponse }) {
  const queryClient = useQueryClient();
  const [allocatedCredits, setAllocatedCredits] = useState(request.allocated_credits ?? request.requested_credits);
  const [comment, setComment] = useState(request.admin_comment ?? "");
  const [isEditing, setIsEditing] = useState(request.status === "PENDING");
  const review = useMutation({
    mutationFn: (status: string) => adminProgramApi.reviewGpu(request.gpu_request_id, { status, allocatedCredits, comment }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "gpu", "requests"] }),
  });

  return (
    <tr className="group transition-colors hover:bg-blue-50/30">
      <td className="px-6 py-4 align-top w-2/5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1A56DB]/10 text-[#1A56DB]">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-ink">{request.title}</h2>
            <p className="mt-1 text-[13px] font-bold text-text-muted">{request.purpose}</p>
            <p className="mt-2 text-[13px] text-text-muted leading-relaxed">{request.justification}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 align-top w-1/5">
        <div className="flex flex-col gap-2">
          <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
            request.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 
            request.status === 'ALLOCATED' ? 'bg-emerald-100 text-emerald-700' : 
            request.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {request.status}
          </span>
          <div className="mt-2 text-[13px] text-text-muted">
            Req: <span className="font-bold text-ink">{request.requested_credits}</span>
          </div>
          {request.allocated_credits ? (
            <div className="text-[13px] text-text-muted">
              Alloc: <span className="font-bold text-[#1A56DB]">{request.allocated_credits}</span>
            </div>
          ) : null}
        </div>
      </td>
      <td className="px-6 py-4 align-top">
        <form className="flex flex-col gap-3">
          {review.isError ? <ErrorBanner error={review.error} /> : null}
          <div className="flex flex-col xl:flex-row items-start xl:items-center gap-2">
            <input 
              type="number" 
              min={1} 
              value={allocatedCredits} 
              onChange={(e) => setAllocatedCredits(Number(e.target.value))} 
              className="w-24 rounded-lg border border-border bg-white px-3 py-2 text-[13px] text-ink focus:border-[#1A56DB] focus:outline-none focus:ring-1 focus:ring-[#1A56DB] disabled:opacity-50 disabled:bg-surface-muted" 
              disabled={!isEditing} 
              placeholder="Credits"
            />
            <input 
              value={comment} 
              onChange={(e) => setComment(e.target.value)} 
              placeholder="Review comment..." 
              className="w-full flex-1 rounded-lg border border-border bg-white px-3 py-2 text-[13px] text-ink focus:border-[#1A56DB] focus:outline-none focus:ring-1 focus:ring-[#1A56DB] disabled:opacity-50 disabled:bg-surface-muted" 
              disabled={!isEditing} 
            />
          </div>
          
          {isEditing ? (
            <div className="flex flex-wrap gap-2 mt-1">
              <Button type="button" variant="primary" disabled={review.isPending} onClick={() => review.mutate("ALLOCATED")} className="text-[12px] h-8 px-3">Allocate</Button>
              <Button type="button" variant="secondary" disabled={review.isPending} onClick={() => review.mutate("MENTOR_RECOMMENDED")} className="text-[12px] h-8 px-3 bg-white">Recommend</Button>
              <Button type="button" variant="destructive" disabled={review.isPending} onClick={() => review.mutate("REJECTED")} className="text-[12px] h-8 px-3">Reject</Button>
              {request.status !== "PENDING" && <Button type="button" variant="secondary" onClick={() => setIsEditing(false)} className="text-[12px] h-8 px-3">Cancel</Button>}
            </div>
          ) : (
            <div className="mt-1">
              <Button type="button" variant="secondary" onClick={() => setIsEditing(true)} className="text-[12px] h-8 px-3 bg-white">Edit Review</Button>
            </div>
          )}
        </form>
      </td>
    </tr>
  );
}
