"use client";

import { useQuery } from "@tanstack/react-query";
import { Award, CheckCircle2, Clock, Inbox, TrendingUp, Trophy } from "lucide-react";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { AdminAwardRequests } from "../../../components/modules/AdminAwardRequests";
import { AwardBadge } from "../../../components/ui/AwardBadge";
import { awardsApi } from "../../../lib/api";

export default function AdminAwardsPage() {
  const awards = useQuery({ queryKey: ["awards", "catalog"], queryFn: awardsApi.list });
  const requests = useQuery({ queryKey: ["admin", "award-requests"], queryFn: awardsApi.adminRequests });

  const reqs = requests.data ?? [];
  const pending = reqs.filter((r) => r.status === "NOMINATED").length;
  const approved = reqs.filter((r) => r.status === "CONFIRMED").length;

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader
        title="Awards"
        description="Manage the awards catalog and review student/staff nominations."
      />

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI: Awards */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#1755A7] via-[#2563EB] to-[#38BDF8]" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold text-slate-500">Awards Catalog</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1755A7]/15 to-[#2563EB]/10 text-[#1755A7]">
              <Trophy className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {awards.data?.length ?? 0}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
              Active Awards
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Available to grant</span>
            <span className="font-bold text-slate-800">All Students</span>
          </div>
        </div>

        {/* KPI: Requests Received */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-amber-400/40 hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#F8C401] via-[#F59E0B] to-[#EA580C]" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold text-slate-500">Requests Received</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#F8C401]/25 to-[#EA580C]/15">
              <Inbox className="h-4 w-4 text-amber-600" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight bg-gradient-to-r from-[#1755A7] to-[#2563EB] bg-clip-text text-transparent">
              {reqs.length}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-slate-500">
              Total
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>All time</span>
            <span className="font-bold text-slate-800">Nominations</span>
          </div>
        </div>

        {/* KPI: Pending Review */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-indigo-400/40 hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold text-slate-500">Pending Review</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400/20 to-purple-400/15">
              <Clock className="h-4 w-4 text-indigo-600" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {pending}
            </span>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              Needs Action
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Status</span>
            <span className="font-bold text-slate-800">Awaiting Approval</span>
          </div>
        </div>

        {/* KPI: Approved / Winners */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-emerald-400/40 hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold text-slate-500">Approved Winners</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-400/15">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700 tracking-tight">
              {approved}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
              <TrendingUp className="h-3 w-3" /> Confirmed
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Points granted</span>
            <span className="font-bold text-slate-800">Successfully</span>
          </div>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-black text-slate-900 mb-1 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[#1755A7]" />
          Award Catalog
        </h2>
        <p className="text-xs text-slate-500 mb-5">Overview of all active awards and their request status.</p>
        
        {awards.isLoading ? (
          <div className="py-8"><Spinner label="Loading awards..." /></div>
        ) : awards.isError ? (
          <div className="mt-3"><ErrorBanner error={awards.error} /></div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(awards.data ?? []).map((a) => {
              const mine = reqs.filter((r) => r.awardId === a.awardId);
              const open = mine.filter((r) => r.status === "NOMINATED").length;
              return (
                <div key={a.awardId} className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-[#1755A7]/40 hover:shadow-md transition-all active:scale-95">
                  <div>
                    <div className="flex items-center justify-between">
                      <AwardBadge awardId={a.awardId} name={a.name} size={52} />
                      {open > 0 && (
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                          {open} Pending
                        </span>
                      )}
                    </div>
                    <h3 className="mt-4 text-sm font-bold text-slate-900 group-hover:text-[#1755A7] transition-colors line-clamp-2">
                      {a.name}
                    </h3>
                  </div>
                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold text-slate-500">
                    <span>Total requests</span>
                    <span className="text-slate-800">{mine.length}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <AdminAwardRequests />
    </ConsoleShell>
  );
}
