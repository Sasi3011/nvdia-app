"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { adminProgramApi, adminReportsApi, type GpuRequestResponse } from "../../../lib/api";
import { 
  Cpu, 
  Download, 
  Server, 
  Activity, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Zap, 
  HardDrive, 
  Network,
  Sliders,
  Sparkles
} from "lucide-react";

const GPU_CLUSTER_METRICS = [
  { id: "DGX-A100-01", type: "DGX A100 (8x 80GB)", load: 94, status: "RUNNING", memory: "75.2 / 80 GB", task: "LLM Fine-tuning (Track 4)" },
  { id: "DGX-A100-02", type: "DGX A100 (8x 80GB)", load: 98, status: "RUNNING", memory: "78.4 / 80 GB", task: "Autonomous Vision Model" },
  { id: "DGX-A100-03", type: "DGX A100 (8x 80GB)", load: 78, status: "RUNNING", memory: "62.4 / 80 GB", task: "NeurIPS Research Benchmarks" },
  { id: "H100-POD-01", type: "NVIDIA H100 SuperPOD", load: 96, status: "RUNNING", memory: "76.8 / 80 GB", task: "Multimodal Foundation Model" },
];

export default function AdminGpuPage() {
  const requests = useQuery({ queryKey: ["admin", "gpu", "requests"], queryFn: adminProgramApi.gpuRequests });
  const [filter, setFilter] = useState<string>("ALL");

  const rawData = requests.data ?? [];
  const filteredRequests = rawData.filter((r) => {
    if (filter === "ALL") return true;
    return r.status === filter;
  });

  const totalAllocated = rawData.filter(r => r.status === "ALLOCATED").reduce((acc, r) => acc + (r.allocated_credits || r.requested_credits), 0);
  const pendingCount = rawData.filter(r => r.status === "PENDING").length;

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader
        title="Supercomputing & GPU Cluster Management"
        description="Monitor live NVIDIA DGX & H100 node workloads, process student & research credit quotas, and audit compute allocations."
        actions={
          <a
            href={adminReportsApi.gpuExportUrl()}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-all"
          >
            <Download className="h-4 w-4 text-[#1755A7]" />
            <span>Export GPU CSV</span>
          </a>
        }
      />

      {/* Top 4 Cluster Telemetry Metric Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Aggregate Cluster Load</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
              <Cpu className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#1755A7]">91.5%</span>
            <span className="text-xs font-bold text-emerald-600 inline-flex items-center gap-0.5">
              <Activity className="h-3 w-3 animate-pulse" /> Optimal
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>DGX A100 & H100 Nodes:</span>
            <span className="font-bold text-slate-800">4 / 4 Online</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Quota Requests</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8C401]/20 text-slate-900">
              <Clock className="h-4.5 w-4.5 text-amber-700" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{pendingCount}</span>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              In Review
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Priority Queue:</span>
            <span className="font-bold text-[#1755A7]">Fellowship & Startups</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Credits Allocated</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
              <Zap className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalAllocated.toLocaleString()}</span>
            <span className="text-xs font-bold text-slate-500">GPU hrs</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Pool Capacity:</span>
            <span className="font-bold text-emerald-600">15,000 Total Hrs</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">InfiniBand & Memory</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8C401]/20 text-slate-900">
              <Network className="h-4.5 w-4.5 text-amber-700" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">3.35 TB/s</span>
            <span className="text-xs font-bold text-[#1755A7]">HBM3</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Low-Latency Fabric:</span>
            <span className="font-bold text-slate-800">400 Gbps QSFP-DD</span>
          </div>
        </div>
      </div>

      {/* Visual Telemetry: Live Cluster Nodes */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Server className="h-4.5 w-4.5 text-[#1755A7]" />
              DGX & H100 Supercomputing Nodes Telemetry
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live containerized cluster load, HBM memory saturation, and active AI tasks
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            Cluster Fabric Healthy
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {GPU_CLUSTER_METRICS.map((node) => (
            <div key={node.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition-all hover:bg-white hover:shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-black text-slate-900">{node.id}</span>
                <span className="font-mono text-xs font-extrabold text-[#1755A7]">{node.load}% Load</span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{node.type}</p>

              {/* Progress Load Bar */}
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div 
                  className="h-full rounded-full bg-[#1755A7] transition-all duration-500" 
                  style={{ width: `${node.load}%` }} 
                />
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-600 font-medium">
                <span className="truncate pr-1">⚡ {node.task}</span>
                <span className="shrink-0 font-bold text-slate-500 font-mono">{node.memory}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GPU Request Queue & Approval Interface */}
      <div className="mt-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 w-fit">
            {["ALL", "PENDING", "ALLOCATED", "REJECTED"].map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  filter === st
                    ? "bg-[#1755A7] text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {st === "ALL" ? "All Requests" : st}
              </button>
            ))}
          </div>

          <span className="text-xs font-mono font-semibold text-slate-500">
            Showing {filteredRequests.length} of {rawData.length} requests
          </span>
        </div>

        {requests.isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner label="Loading GPU requests..." />
          </div>
        ) : requests.isError ? (
          <ErrorBanner error={requests.error} />
        ) : filteredRequests.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <Cpu className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-bold text-slate-700">No GPU requests in this view.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5 w-2/5">Research Project & Workload Justification</th>
                  <th className="px-6 py-3.5 w-1/5">Status & Quota</th>
                  <th className="px-6 py-3.5">Admin Review & Supercomputing Allocation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((request) => (
                  <GpuReviewRow key={request.gpu_request_id} request={request} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
    <tr className="hover:bg-slate-50/70 transition-colors">
      <td className="px-6 py-4 align-top">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-[13px]">{request.title}</h4>
            <p className="mt-0.5 text-xs font-bold text-[#1755A7]">{request.purpose}</p>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed max-w-xl">{request.justification}</p>
          </div>
        </div>
      </td>

      <td className="px-6 py-4 align-top">
        <div className="flex flex-col gap-1.5">
          <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            request.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 
            request.status === 'ALLOCATED' ? 'bg-emerald-100 text-emerald-800' : 
            request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
            'bg-slate-100 text-slate-700'
          }`}>
            {request.status}
          </span>
          <div className="text-xs text-slate-500 font-mono">
            Requested: <span className="font-bold text-slate-900">{request.requested_credits} hrs</span>
          </div>
          {request.allocated_credits ? (
            <div className="text-xs text-slate-500 font-mono">
              Allocated: <span className="font-bold text-[#1755A7]">{request.allocated_credits} hrs</span>
            </div>
          ) : null}
        </div>
      </td>

      <td className="px-6 py-4 align-top">
        <form className="flex flex-col gap-2.5">
          {review.isError ? <ErrorBanner error={review.error} /> : null}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <input 
              type="number" 
              min={1} 
              value={allocatedCredits} 
              onChange={(e) => setAllocatedCredits(Number(e.target.value))} 
              className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono text-slate-900 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7] disabled:opacity-50 disabled:bg-slate-100" 
              disabled={!isEditing} 
              placeholder="Credits"
            />
            <input 
              value={comment} 
              onChange={(e) => setComment(e.target.value)} 
              placeholder="Mentor / Admin remarks..." 
              className="w-full flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7] disabled:opacity-50 disabled:bg-slate-100" 
              disabled={!isEditing} 
            />
          </div>
          
          {isEditing ? (
            <div className="flex flex-wrap gap-2 mt-1">
              <button 
                type="button" 
                disabled={review.isPending} 
                onClick={() => review.mutate("ALLOCATED")} 
                className="inline-flex items-center gap-1 rounded-lg bg-[#1755A7] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#124282] transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Allocate Quota
              </button>
              <button 
                type="button" 
                disabled={review.isPending} 
                onClick={() => review.mutate("MENTOR_RECOMMENDED")} 
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Recommend
              </button>
              <button 
                type="button" 
                disabled={review.isPending} 
                onClick={() => review.mutate("REJECTED")} 
                className="inline-flex items-center gap-1 rounded-lg bg-red-50 border border-red-200 px-3.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </button>
              {request.status !== "PENDING" && (
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)} 
                  className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              )}
            </div>
          ) : (
            <div className="mt-1">
              <button 
                type="button" 
                onClick={() => setIsEditing(true)} 
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-[#1755A7] transition-all"
              >
                <Sliders className="h-3.5 w-3.5 text-[#1755A7]" />
                Modify Allocation
              </button>
            </div>
          )}
        </form>
      </td>
    </tr>
  );
}
