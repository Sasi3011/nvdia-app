"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ConsolePageHeader } from "../console/ConsolePageHeader";
import { ExternalHackathons, type ExternalHackathonsHandle } from "./ExternalHackathons";
import { HackathonApplications } from "./HackathonApplications";
import { externalHackathonsApi } from "../../lib/api";
import { Plus, RefreshCw, Trophy, Calendar, Users, TrendingUp } from "lucide-react";

// The full Hackathons screen (KPIs, list with add/edit/delete/fetch, and
// Student Applications with proof verification). Shared by the admin and
// faculty portals - both roles have the same access (external-hackathons.controller).
export function HackathonsManager() {
  const externalRef = useRef<ExternalHackathonsHandle>(null);
  const [tab, setTab] = useState<"LIST" | "APPLICATIONS">("LIST");

  const hackathons = useQuery({ queryKey: ["hackathons", "external"], queryFn: externalHackathonsApi.list });
  const applications = useQuery({ queryKey: ["hackathons", "applications"], queryFn: externalHackathonsApi.applications });

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const list = hackathons.data ?? [];
  const apps = applications.data ?? [];
  const isOver = (h: { ends_at: string | null; deadline_at: string | null }) => {
    const end = h.ends_at ?? h.deadline_at;
    return !!end && new Date(end).getTime() < now;
  };
  const activeCount = list.filter((h) => !isOver(h)).length;
  const addedThisMonth = list.filter((h) => {
    const d = new Date(h.created_at);
    const n = new Date(now);
    return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
  }).length;
  const totalApplications = apps.reduce((n, r) => n + r.total, 0);
  const hackathonsWithApplicants = apps.filter((r) => r.total > 0).length;
  const avgPerHackathon = list.length ? Math.round((totalApplications / list.length) * 10) / 10 : 0;
  const upcoming = list.filter((h) => h.deadline_at && new Date(h.deadline_at).getTime() >= now);
  const closingSoon = upcoming.filter((h) => new Date(h.deadline_at as string).getTime() - now <= 7 * DAY).length;
  const loading = hackathons.isLoading || applications.isLoading;
  const show = (n: number | string) => (loading ? "-" : n);

  return (
    <>
      <ConsolePageHeader
        title="Hackathons"
        description="List hackathons for students and track how many have applied to each."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {tab === "LIST" && (
              <>
                <button
                  type="button"
                  onClick={() => externalRef.current?.sync()}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Fetch latest
                </button>
                <button
                  type="button"
                  onClick={() => externalRef.current?.showAdd()}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1755A7] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#134486]"
                >
                  <Plus className="h-4 w-4" /> Add hackathon
                </button>
              </>
            )}
          </div>
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* KPI: Active Hackathons */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
          <div className="absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#1755A7] via-[#2563EB] to-[#38BDF8]" />
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Hackathons</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1755A7]/15 to-[#2563EB]/10 text-[#1755A7]">
              <Trophy className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-slate-900">{show(activeCount)}</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
              <TrendingUp className="h-3 w-3" /> +{show(addedThisMonth)} this month
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
            <span>Total recorded</span>
            <span className="font-bold text-slate-800">{show(list.length)}</span>
          </div>
        </div>

        {/* KPI: Total Participants */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
          <div className="absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#1755A7] via-[#F8C401] to-[#EA580C]" />
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Student Applications</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#F8C401]/25 to-[#EA580C]/15 text-amber-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="bg-gradient-to-r from-[#1755A7] to-[#2563EB] bg-clip-text text-3xl font-black tracking-tight text-transparent">{show(totalApplications)}</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
              <Users className="h-3 w-3" /> {show(hackathonsWithApplicants)} with applicants
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
            <span>Avg per hackathon</span>
            <span className="font-bold text-slate-800">{show(avgPerHackathon)}</span>
          </div>
        </div>

        {/* KPI: Upcoming */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-amber-400/40 hover:shadow-md transition-all">
          <div className="absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#38BDF8] via-[#F59E0B] to-[#EA580C]" />
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Upcoming Deadlines</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-400/15 text-amber-600">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-slate-900">{show(upcoming.length)}</span>
            {closingSoon > 0 && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Closing soon</span>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
            <span>Next 7 days</span>
            <span className="font-bold text-slate-800">{show(closingSoon)} {closingSoon === 1 ? "event" : "events"}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-4 overflow-x-auto border-b border-slate-200">
        {(["LIST", "APPLICATIONS"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`shrink-0 border-b-2 pb-2.5 text-xs font-bold ${tab === t ? "border-[#1755A7] text-[#1755A7]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            {t === "LIST" ? "Hackathons" : "Student Applications"}
          </button>
        ))}
      </div>

      <div className="mb-8 mt-4">
        {tab === "LIST" ? <ExternalHackathons canManage hideHeaderActions ref={externalRef} /> : <HackathonApplications />}
      </div>
    </>
  );
}
