"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { adminIndustryGpuApi, type IndustryGpuRequestResponse, type IndustryGpuStatus } from "../../../lib/api";
import { useConfirm } from "../../../components/ui/ConfirmDialogProvider";
import { Building, Cpu, Edit3, ExternalLink, Mail, Phone, Plus, Search, Trash2, X, TrendingUp, CheckCircle2 } from "lucide-react";

const STATUSES: { value: IndustryGpuStatus; label: string; style: string }[] = [
  { value: "NEW", label: "New", style: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "UNDER_REVIEW", label: "Under Review", style: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "APPROVED", label: "Approved", style: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "FULFILLED", label: "Fulfilled", style: "bg-slate-100 text-slate-700 border-slate-200" },
  { value: "REJECTED", label: "Rejected", style: "bg-rose-50 text-rose-700 border-rose-200" },
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7]";

export default function AdminIndustryPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const requests = useQuery({ queryKey: ["admin", "industry", "gpu-requests"], queryFn: adminIndustryGpuApi.list });
  const [editing, setEditing] = useState<IndustryGpuRequestResponse | "new" | null>(null);
  const [search, setSearch] = useState("");

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "industry", "gpu-requests"] });
  const remove = useMutation({ mutationFn: (id: string) => adminIndustryGpuApi.remove(id), onSuccess: refresh });

  const all = requests.data ?? [];
  const q = search.toLowerCase();
  const rows = all.filter(
    (r) =>
      r.companyName.toLowerCase().includes(q) || r.contactPerson.toLowerCase().includes(q) || r.useCase.toLowerCase().includes(q) || (r.sector ?? "").toLowerCase().includes(q),
  );
  const count = (s: IndustryGpuStatus) => all.filter((r) => r.status === s).length;

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader
        title="Industry GPU Access Requests"
        description="Companies that have asked for GPU access: who they are, what they need, and where each request stands."
        actions={
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#1755A7] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#134486] active:scale-95 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Add Request
          </button>
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* KPI: Total Requests */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
            <div className="absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#1755A7] via-[#2563EB] to-[#38BDF8]" />
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Requests</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1755A7]/15 to-[#2563EB]/10 text-[#1755A7]">
                <Cpu className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-slate-900">{all.length}</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
                <TrendingUp className="h-3 w-3" /> Active
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
              <span>Enterprises</span>
              <span className="font-bold text-slate-800">{new Set(all.map(a => a.companyName)).size}</span>
            </div>
          </div>

          {/* KPI: Under Review */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-amber-400/40 hover:shadow-md transition-all">
            <div className="absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#38BDF8] via-[#F59E0B] to-[#EA580C]" />
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Action Needed</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-400/15 text-amber-600">
                <Mail className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-slate-900">{count("NEW") + count("UNDER_REVIEW")}</span>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Pending</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
              <span>Just Added</span>
              <span className="font-bold text-slate-800">{count("NEW")}</span>
            </div>
          </div>

          {/* KPI: Fulfilled */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-emerald-400/40 hover:shadow-md transition-all">
            <div className="absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600" />
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Fulfilled Allocations</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-400/15 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-3xl font-black tracking-tight text-transparent">{count("FULFILLED") + count("APPROVED")}</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
                Allocated
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
              <span>Rejected</span>
              <span className="font-bold text-rose-600">{count("REJECTED")}</span>
            </div>
          </div>
        </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company, contact or requirement…" className={`${inputClass} pl-9`} />
        </div>
      </div>

      {requests.isLoading ? (
        <div className="flex h-48 items-center justify-center"><Spinner label="Loading requests…" /></div>
      ) : requests.isError ? (
        <div className="mt-6"><ErrorBanner error={requests.error} /></div>
      ) : rows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Building className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm font-bold text-slate-700">{all.length === 0 ? "No GPU access requests yet." : "No requests match your filters."}</p>
          {all.length === 0 && <p className="mt-1 text-xs text-slate-400">Click “Add Request” to log one.</p>}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {rows.map((r) => {
            const st = STATUSES.find((s) => s.value === r.status);
            return (
              <div key={r.requestId} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
                      <Building className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">{r.companyName}</h3>
                      <p className="text-[11px] text-slate-500">
                        {r.sector ? `${r.sector} · ` : ""}Requested {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${st?.style}`}>{st?.label}</span>
                    <button type="button" onClick={() => setEditing(r)} title="Edit" aria-label={`Edit ${r.companyName}`} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 sm:h-8 sm:w-8">
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Delete"
                      aria-label={`Delete ${r.companyName}`}
                      disabled={remove.isPending}
                      onClick={async () => {
                        if (await confirm({ message: `Delete the request from ${r.companyName}?`, confirmLabel: "Delete" })) remove.mutate(r.requestId);
                      }}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-rose-500 hover:bg-rose-50 disabled:opacity-50 sm:h-8 sm:w-8"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 text-xs lg:grid-cols-3">
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contact</div>
                    <div className="font-semibold text-slate-800">{r.contactPerson}</div>
                    {r.contactEmail && <div className="flex items-center gap-1.5 text-slate-600"><Mail className="h-3 w-3" />{r.contactEmail}</div>}
                    {r.contactPhone && <div className="flex items-center gap-1.5 text-slate-600"><Phone className="h-3 w-3" />{r.contactPhone}</div>}
                    {r.website && (
                      <a href={r.website.startsWith("http") ? r.website : `https://${r.website}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-[#1755A7] hover:underline">
                        <ExternalLink className="h-3 w-3" />{r.website}
                      </a>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">GPU Requirement</div>
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800"><Cpu className="h-3.5 w-3.5 text-[#1755A7]" />{r.gpuType || "Not specified"}</div>
                    <div className="text-slate-600">
                      {[r.gpuCount != null ? `${r.gpuCount} GPU(s)` : null, r.hoursNeeded != null ? `${r.hoursNeeded} hrs` : null, r.duration].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">What they want</div>
                    <p className="whitespace-pre-wrap text-slate-700">{r.useCase}</p>
                    {r.adminNotes && <p className="mt-1 rounded-lg bg-slate-50 p-2 text-[11px] text-slate-600"><span className="font-bold">Note:</span> {r.adminNotes}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <RequestModal
          request={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}
    </ConsoleShell>
  );
}



function RequestModal({ request, onCancel, onDone }: { request: IndustryGpuRequestResponse | null; onCancel: () => void; onDone: () => void }) {
  const [f, setF] = useState({
    companyName: request?.companyName ?? "",
    contactPerson: request?.contactPerson ?? "",
    contactEmail: request?.contactEmail ?? "",
    contactPhone: request?.contactPhone ?? "",
    website: request?.website ?? "",
    sector: request?.sector ?? "",
    useCase: request?.useCase ?? "",
    gpuType: request?.gpuType ?? "",
    gpuCount: request?.gpuCount?.toString() ?? "",
    hoursNeeded: request?.hoursNeeded?.toString() ?? "",
    duration: request?.duration ?? "",
    status: (request?.status ?? "NEW") as IndustryGpuStatus,
    adminNotes: request?.adminNotes ?? "",
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const save = useMutation({
    mutationFn: () => {
      const body = {
        ...f,
        gpuCount: f.gpuCount === "" ? undefined : Number(f.gpuCount),
        hoursNeeded: f.hoursNeeded === "" ? undefined : Number(f.hoursNeeded),
      };
      return request ? adminIndustryGpuApi.update(request.requestId, body) : adminIndustryGpuApi.create(body);
    },
    onSuccess: onDone,
  });

  if (typeof document === "undefined") return null;

  return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl max-h-[92vh] flex flex-col">
          <div className="bg-gradient-to-r from-[#1755A7] via-[#1E40AF] to-[#2563EB] px-6 py-4 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#F8C401]">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold">{request ? "Edit GPU Access Request" : "Add GPU Access Request"}</h3>
                <p className="text-xs text-blue-100">Company details and what they need</p>
              </div>
            </div>
            <button type="button" onClick={onCancel} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors active:scale-95">
              <X className="h-4 w-4" />
            </button>
          </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="p-4 sm:p-6 grid grid-cols-1 gap-4 sm:grid-cols-2 max-h-[75vh] overflow-y-auto minute-scrollbar"
        >
            {save.isError && <div className="sm:col-span-2"><ErrorBanner error={save.error} /></div>}
            <Field label="Company name *"><input required value={f.companyName} onChange={(e) => set("companyName", e.target.value)} className={inputClass} /></Field>
            <Field label="Industry / sector"><input value={f.sector} onChange={(e) => set("sector", e.target.value)} placeholder="e.g. Healthcare AI" className={inputClass} /></Field>
            <Field label="Contact person *"><input required value={f.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} className={inputClass} /></Field>
            <Field label="Email"><input type="email" value={f.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} className={inputClass} /></Field>
            <Field label="Phone"><input value={f.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} className={inputClass} /></Field>
            <Field label="Website"><input value={f.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" className={inputClass} /></Field>
            <Field label="GPU type"><input value={f.gpuType} onChange={(e) => set("gpuType", e.target.value)} placeholder="e.g. NVIDIA A100 / H100" className={inputClass} /></Field>
            <Field label="Number of GPUs"><input type="number" min={0} value={f.gpuCount} onChange={(e) => set("gpuCount", e.target.value)} className={inputClass} /></Field>
            <Field label="Compute hours needed"><input type="number" min={0} value={f.hoursNeeded} onChange={(e) => set("hoursNeeded", e.target.value)} className={inputClass} /></Field>
            <Field label="Duration"><input value={f.duration} onChange={(e) => set("duration", e.target.value)} placeholder="e.g. 3 months" className={inputClass} /></Field>
            <div className="sm:col-span-2">
              <Field label="What they want / use case *">
                <textarea required rows={4} value={f.useCase} onChange={(e) => set("useCase", e.target.value)} placeholder="Workload, model/data, expected outcome…" className={inputClass} />
              </Field>
            </div>
            <Field label="Status">
              <select value={f.status} onChange={(e) => set("status", e.target.value)} className={inputClass}>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Admin notes"><textarea rows={2} value={f.adminNotes} onChange={(e) => set("adminNotes", e.target.value)} className={inputClass} /></Field>
            </div>
          <div className="mt-2 flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors active:scale-95">
              Cancel
            </button>
            <button type="submit" disabled={save.isPending} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] via-[#1A5EB7] to-[#2563EB] px-6 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1D4ED8] transition-all disabled:opacity-50 active:scale-95">
              {save.isPending ? "Saving…" : request ? "Save Changes" : "Add Request"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}
