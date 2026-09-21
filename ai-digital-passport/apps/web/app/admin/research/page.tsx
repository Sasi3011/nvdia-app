"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, FileText, Microscope, Search, XCircle } from "lucide-react";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { mentorApi, type MentorQueueItemResponse } from "../../../lib/api";

const CATEGORY = "research_patent";
type Status = "PENDING" | "APPROVED" | "REJECTED";

const STATUS_META: Record<Status, { label: string; cls: string; icon: typeof Clock }> = {
  PENDING: { label: "Awaiting verification", cls: "border-amber-200 bg-amber-50 text-amber-700", icon: Clock },
  APPROVED: { label: "Verified", cls: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  REJECTED: { label: "Rejected", cls: "border-rose-200 bg-rose-50 text-rose-700", icon: XCircle },
};

const PROOF_LABEL: Record<MentorQueueItemResponse["proofType"], string> = {
  TOTP_QR: "Live QR",
  PDF_FILE: "PDF document",
  GITHUB_LINK: "GitHub link",
  DOI_LINK: "DOI / patent link",
};

export default function AdminResearchPage() {
  const [tab, setTab] = useState<"ALL" | Status>("ALL");
  const [search, setSearch] = useState("");

  const load = (status: Status) => () => mentorApi.queue({ status, category: CATEGORY, page: 1, pageSize: 100 });
  const pending = useQuery({ queryKey: ["admin", "research", "PENDING"], queryFn: load("PENDING") });
  const approved = useQuery({ queryKey: ["admin", "research", "APPROVED"], queryFn: load("APPROVED") });
  const rejected = useQuery({ queryKey: ["admin", "research", "REJECTED"], queryFn: load("REJECTED") });
  const results = [pending, approved, rejected];
  const loading = results.some((r) => r.isLoading);
  const error = results.find((r) => r.isError)?.error;

  const pendingItems = pending.data?.items ?? [];
  const approvedItems = approved.data?.items ?? [];
  const rejectedItems = rejected.data?.items ?? [];
  const counts = {
    PENDING: pending.data?.total ?? pendingItems.length,
    APPROVED: approved.data?.total ?? approvedItems.length,
    REJECTED: rejected.data?.total ?? rejectedItems.length,
  };
  const total = counts.PENDING + counts.APPROVED + counts.REJECTED;
  const decided = counts.APPROVED + counts.REJECTED;

  const all = [...pendingItems, ...approvedItems, ...rejectedItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const shown = all.filter(
    (r) => (tab === "ALL" || r.status === tab) && r.student.fullName.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const kpis = [
    { label: "Research & Patent Claims", value: total, icon: Microscope, bar: "from-[#1755A7] via-[#2563EB] to-[#38BDF8]", tone: "from-[#1755A7]/15 to-[#2563EB]/10 text-[#1755A7]", foot: ["Students who submitted", new Set(all.map((r) => r.student.userId)).size] },
    { label: "Awaiting Verification", value: counts.PENDING, icon: Clock, bar: "from-[#F8C401] via-amber-500 to-orange-500", tone: "from-amber-500/15 to-orange-500/10 text-amber-600", foot: ["In the mentor queue", counts.PENDING] },
    { label: "Verified", value: counts.APPROVED, icon: CheckCircle2, bar: "from-emerald-500 via-emerald-400 to-teal-400", tone: "from-emerald-500/15 to-teal-400/10 text-emerald-600", foot: ["Approval rate", decided ? `${Math.round((counts.APPROVED / decided) * 100)}%` : "-"] },
    { label: "Rejected", value: counts.REJECTED, icon: XCircle, bar: "from-rose-500 via-rose-400 to-orange-400", tone: "from-rose-500/15 to-orange-400/10 text-rose-600", foot: ["Of reviewed claims", decided ? `${Math.round((counts.REJECTED / decided) * 100)}%` : "-"] },
  ] as const;

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader
        title="Research & Patents"
        description="Research paper and patent claims submitted by students, and their verification status."
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm">
            <div className={`absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${k.bar}`} />
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">{k.label}</span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${k.tone}`}>
                <k.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-black tracking-tight text-slate-900">{loading ? "-" : k.value}</div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
              <span>{k.foot[0]}</span>
              <span className="font-bold text-slate-800">{loading ? "-" : k.foot[1]}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`shrink-0 rounded-full border px-3.5 py-2 text-[11px] font-bold transition-colors ${
                tab === t ? "border-[#1755A7] bg-[#1755A7] text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t === "ALL" ? "All" : STATUS_META[t].label}
              {!loading && <span className="ml-1.5 opacity-70">{t === "ALL" ? total : counts[t]}</span>}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7]"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-56 items-center justify-center"><Spinner label="Loading research claims..." /></div>
      ) : error ? (
        <div className="mt-6"><ErrorBanner error={error} /></div>
      ) : shown.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm font-bold text-slate-700">
            {total === 0 ? "No research or patent claims yet." : "No claims match this filter."}
          </p>
          <p className="mt-1 text-xs text-slate-400">Students submit these from Evidence &amp; Claims in the Research Paper / Patent Filing category.</p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3.5 sm:px-6">Student</th>
                <th className="px-4 py-3.5 sm:px-6">Proof</th>
                <th className="px-4 py-3.5 text-center sm:px-6">Points</th>
                <th className="px-4 py-3.5 sm:px-6">Submitted</th>
                <th className="px-4 py-3.5 text-center sm:px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shown.map((r) => {
                const meta = STATUS_META[r.status];
                const Icon = meta.icon;
                return (
                  <tr key={r.claimId} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-4 py-3.5 font-bold text-slate-900 sm:px-6">{r.student.fullName}</td>
                    <td className="px-4 py-3.5 text-slate-600 sm:px-6">{PROOF_LABEL[r.proofType]}</td>
                    <td className="px-4 py-3.5 text-center font-black text-slate-800 sm:px-6">+{r.pointsRequested}</td>
                    <td className="px-4 py-3.5 text-slate-600 sm:px-6">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3.5 text-center sm:px-6">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${meta.cls}`}>
                        <Icon className="h-3 w-3" /> {meta.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </ConsoleShell>
  );
}
