"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StudentShell } from "../../components/shell/StudentShell";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { Spinner } from "../../components/ui/Spinner";
import { StatusChip, type Status } from "../../components/ui/StatusChip";
import { gpuApi } from "../../lib/api";
import { useMe } from "../../lib/session";
import { 
  Cpu, 
  Server, 
  Plus, 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  Clock, 
  Zap, 
  X,
  Sparkles,
  Layers,
  Award
} from "lucide-react";

const PURPOSES = ["Course Lab", "Project Capstone", "Research Experiment", "Hackathon Sprint", "Startup AI Validation"] as const;
const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7] transition-colors";
const labelClass = "text-xs font-bold text-slate-700 flex items-center gap-1.5";

export default function GpuPage() {
  const me = useMe(true);
  const queryClient = useQueryClient();
  const requests = useQuery({ queryKey: ["gpu", "requests"], queryFn: gpuApi.mine });
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const availableCredits = me.data?.gpuCreditBalance ?? 240;

  return (
    <StudentShell>
      <div className="flex flex-col gap-8 animate-in fade-in duration-300">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              NVIDIA DGX Supercomputing Cluster Access
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Request, justify, and execute high-performance GPU compute sessions on institutional DGX A100 nodes.
            </p>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] via-[#1A5EB7] to-[#2563EB] px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1D4ED8] transition-all active:scale-95 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Request GPU Compute Hours</span>
          </button>
        </div>

        {notice && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between text-xs font-bold text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{notice}</span>
            </div>
            <button onClick={() => setNotice(null)} className="text-emerald-600 hover:text-emerald-800">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* GPU Request Modal */}
        {showRequestModal && (
          <GpuRequestModal
            onClose={() => setShowRequestModal(false)}
            onSubmitted={() => {
              setShowRequestModal(false);
              queryClient.invalidateQueries({ queryKey: ["gpu", "requests"] });
              setNotice("Your GPU compute request has been submitted for faculty mentor review!");
            }}
          />
        )}

        {/* Top 4 KPI Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Available Compute Balance</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Cpu className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700">{availableCredits.toLocaleString()}</span>
              <span className="text-xs font-bold text-emerald-600">Hours</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
              <span>Cluster Pool:</span>
              <span className="font-bold text-[#1755A7]">DGX-A100 SXM4</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">SuperPOD Status</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
                <Server className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">Online</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Operational
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
              <span>GPU Interconnect:</span>
              <span className="font-bold text-slate-800">NVLink 600 GB/s</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">My GPU Requests</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8C401]/20 text-slate-900">
                <Clock className="h-4.5 w-4.5 text-amber-700" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{requests.data?.length || 0}</span>
              <span className="text-xs font-semibold text-slate-500">Submitted</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
              <span>Approval Route:</span>
              <span className="font-bold text-slate-800">Mentor Review</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">VRAM Capacity</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
                <Activity className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#1755A7]">640 GB</span>
              <span className="text-xs font-bold text-slate-500">High-Bandwidth HBM2</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
              <span>Tensor Cores:</span>
              <span className="font-bold text-slate-800">3rd Gen Matrix Math</span>
            </div>
          </div>
        </div>

        {/* Live Cluster Telemetry Hardware Specs Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Server className="h-4 w-4 text-[#1755A7]" />
                Sri Eshwar NVIDIA AI Centre Supercomputing Nodes
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">High-performance AI compute infrastructure specs</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Cluster Available
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Compute Engines</span>
              <span className="text-sm font-black text-slate-900 mt-1 block">8x NVIDIA A100 Tensor Core GPUs</span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">19.5 TeraFLOPS FP64 Compute per GPU</span>
            </div>
            <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Unified Memory</span>
              <span className="text-sm font-black text-slate-900 mt-1 block">640 GB Total GPU VRAM (80GB/node)</span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">2.0 TB/s Memory Bandwidth</span>
            </div>
            <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Interconnect Fabric</span>
              <span className="text-sm font-black text-slate-900 mt-1 block">NVIDIA Mellanox HDR 200Gb/s InfiniBand</span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Sub-microsecond Ultra-Low Latency</span>
            </div>
          </div>
        </div>

        {/* My Requests History Table */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#1755A7]" />
                My GPU Compute Requests History
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Track mentor evaluation and allocation hours</p>
            </div>
          </div>

          {requests.isLoading ? (
            <div className="p-8 text-center">
              <Spinner label="Loading GPU requests..." />
            </div>
          ) : requests.isError ? (
            <div className="mt-4">
              <ErrorBanner error={requests.error} />
            </div>
          ) : !requests.data || requests.data.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Cpu className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="font-bold text-slate-700">No GPU requests submitted yet.</p>
              <p className="text-xs text-slate-400 mt-1">Click "Request GPU Compute Hours" above to submit a quota request.</p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3 rounded-l-xl">Request Title & Objective</th>
                    <th className="px-5 py-3 text-center">Requested Hours</th>
                    <th className="px-5 py-3 text-center">Allocated Hours</th>
                    <th className="px-5 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.data.map((request) => (
                    <tr key={request.gpu_request_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div>
                          <span className="font-bold text-slate-900 text-xs">{request.title}</span>
                          <span className="text-[11px] text-slate-400 font-mono block">ID: {request.gpu_request_id.slice(0, 12)}…</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-900">
                        {request.requested_credits} hrs
                      </td>

                      <td className="px-5 py-3.5 text-center font-mono font-bold text-emerald-700">
                        {request.allocated_credits ?? 0} hrs
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <StatusChip status={(request.status === "REJECTED" ? "REJECTED" : request.status === "APPROVED" || request.status === "ALLOCATED" ? "APPROVED" : "PENDING") as Status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </StudentShell>
  );
}

function GpuRequestModal({
  onClose,
  onSubmitted,
}: {
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [purpose, setPurpose] = useState<string>("Course Lab");
  const [title, setTitle] = useState("");
  const [credits, setCredits] = useState(20);
  const [justification, setJustification] = useState("");

  const create = useMutation({
    mutationFn: () => gpuApi.create({ purpose, title, requestedCredits: credits, justification }),
    onSuccess: onSubmitted,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-[#1755A7] via-[#1E40AF] to-[#2563EB] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#F8C401]">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Request DGX GPU Compute Quota</h3>
              <p className="text-xs text-blue-100">Submit justification for faculty mentor & admin allocation</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          className="p-6 flex flex-col gap-4 max-h-[75vh] overflow-y-auto minute-scrollbar"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          {create.isError && <ErrorBanner error={create.error} />}

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <span>Compute Purpose Track <span className="text-red-500">*</span></span>
            </label>
            <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className={inputClass}>
              {PURPOSES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <span>Project / Experiment Title <span className="text-red-500">*</span></span>
            </label>
            <input 
              required 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="E.g. Fine-Tuning Llama 3 on Medical Question-Answering" 
              className={inputClass} 
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <span>Requested Compute Hours (Credits) <span className="text-red-500">*</span></span>
            </label>
            <input 
              type="number" 
              min={1} 
              max={200}
              required 
              value={credits} 
              onChange={(e) => setCredits(Number(e.target.value))} 
              className={inputClass} 
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <span>Technical Justification & Deliverable Scope <span className="text-red-500">*</span></span>
            </label>
            <textarea 
              required 
              rows={4} 
              value={justification} 
              onChange={(e) => setJustification(e.target.value)} 
              placeholder="Explain dataset size, framework (TensorRT/PyTorch), batch size, target deadline, and expected artifact output..." 
              className={inputClass} 
            />
          </div>

          <div className="mt-2 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#2563EB] px-5 py-2 text-xs font-bold text-white shadow-2xs hover:from-[#124282] hover:to-[#1D4ED8] transition-all active:scale-95 disabled:opacity-50"
            >
              {create.isPending ? "Submitting Request…" : "Submit GPU Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
