"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { StatusChip, type Status } from "../../../components/ui/StatusChip";
import { mentorApi } from "../../../lib/api";
import { 
  FileCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  ExternalLink, 
  ChevronRight, 
  ArrowLeft,
  Filter,
  UserCircle
} from "lucide-react";

const STATUS_FILTERS: { value: Status | ""; label: string }[] = [
  { value: "PENDING", label: "Pending Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "", label: "All Submissions" },
];

export default function MentorQueuePage() {
  const [status, setStatus] = useState<Status | "">("PENDING");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const queue = useQuery({
    queryKey: ["mentor", "queue", status, page],
    queryFn: () => mentorApi.queue({ page, pageSize: 50, status: status || undefined }),
  });

  const allItems = queue.data?.items ?? [];
  const filteredItems = allItems.filter((item) => {
    return (
      item.student.fullName.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      item.student.userId.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <ConsoleShell role="MENTOR">
      <ConsolePageHeader
        title="Evidence Review Queue"
        description="Audit student submissions, verify code deliverables & certificates, and allocate competency points."
        actions={
          <Link
            href="/mentor"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        }
      />

      {/* Filter Tabs & Search */}
      <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setStatus(f.value);
                setPage(1);
              }}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95 ${
                status === f.value
                  ? "bg-gradient-to-r from-[#1755A7] to-[#2563EB] text-white shadow-sm shadow-[#1755A7]/25"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search student or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7]"
          />
        </div>
      </div>

      {/* Queue Table */}
      {queue.isLoading ? (
        <div className="mt-8 flex h-64 items-center justify-center">
          <Spinner label="Loading review queue..." />
        </div>
      ) : queue.isError ? (
        <div className="mt-6">
          <ErrorBanner error={queue.error} />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
          <p className="font-bold text-slate-700">No submissions found.</p>
          <p className="text-xs text-slate-400 mt-1">There are no claims matching the current status filter.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Student Scholar</th>
                <th className="px-6 py-3.5">Submission Category</th>
                <th className="px-6 py-3.5">Evidence Type</th>
                <th className="px-6 py-3.5">Submitted Date</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((c) => (
                <tr key={c.claimId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7] font-bold text-xs">
                        {c.student.fullName.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-xs">{c.student.fullName}</span>
                        <span className="text-[11px] text-slate-500 font-mono block">ID: {c.student.userId.slice(0, 12)}…</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                      {c.category.replace(/_/g, " ")}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-mono text-slate-600 text-xs">
                      {c.proofType.replace(/_/g, " ")}
                    </span>
                  </td>

                  <td className="px-6 py-4 font-mono text-slate-600">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <StatusChip status={c.status as Status} />
                  </td>

                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/mentor/queue/detail?id=${c.claimId}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#2563EB] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:from-[#124282] hover:to-[#1D4ED8] transition-all active:scale-95"
                    >
                      <span>Review</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
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
