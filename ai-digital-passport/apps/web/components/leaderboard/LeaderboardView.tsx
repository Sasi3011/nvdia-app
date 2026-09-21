"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "../ui/Spinner";
import { LevelBadge, LEVEL_BADGE_NAMES } from "../ui/LevelBadge";

const levelIdByName = (name: string) =>
  Number(Object.entries(LEVEL_BADGE_NAMES).find(([, n]) => n === name)?.[0] ?? 1);
import { ErrorBanner } from "../ui/ErrorBanner";
import { leaderboardApi } from "../../lib/api";
import { useMe } from "../../lib/session";
import { CustomSelect } from "../ui/CustomSelect";
import { 
  Trophy, 
  Sparkles, 
  Medal, 
  Crown, 
  Search, 
  TrendingUp, 
  Users, 
  Award, 
} from "lucide-react";

export function LeaderboardView({ showSelf = false }: { showSelf?: boolean }) {
  const me = useMe(true);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");

  const summary = useQuery({ queryKey: ["leaderboard", "summary"], queryFn: leaderboardApi.summary });
  const leaderboard = useQuery({ 
    queryKey: ["leaderboard"], 
    queryFn: () => leaderboardApi.top(50) 
  });

  if (me.isLoading) {
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner label="Loading cohort rankings…" />
        </div>
    );
  }

  const items = leaderboard.data ?? [];
  const selfIdx = items.findIndex((e) => e.userId === me.data?.userId);
  const top1 = items[0];
  const top2 = items[1];
  const top3 = items[2];

  const departments = Array.from(new Set(items.map((e) => e.department))).sort();
  const rankOf = new Map(items.map((e, i) => [e.userId, i + 1]));

  const filteredItems = items.filter((entry) => {
    const matchesSearch = entry.fullName.toLowerCase().includes(search.toLowerCase()) || entry.levelName.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === "ALL" || entry.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <>
      <div className="space-y-6">
        
        {/* Top Header Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs sm:p-6 lg:p-8">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-gradient-to-br from-[#1755A7]/10 to-[#F8C401]/15 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-3xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1755A7]/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#1755A7]">
                  <Sparkles className="h-3.5 w-3.5 text-[#F8C401]" />
                  Global Cohort Rankings
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900">AI Supercomputing Scholar Leaderboard</h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Rankings calculated across verified DLI certifications, GPU compute experiments, hackathon victories, and research publications.
              </p>
            </div>

            {/* Current Scholar Quick Rank Badge */}
            {showSelf && me.data && (
              <div className="flex items-center gap-3 rounded-2xl bg-slate-900 p-4 text-white shadow-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8C401] text-slate-900 font-black">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Your Current Rank</div>
                  <div className="text-sm font-black text-white">
                    {selfIdx >= 0 ? `#${selfIdx + 1} of ${items.length}` : "Not ranked yet"} · <span className="text-[#F8C401] font-mono">{me.data.totalPoints.toLocaleString()} pts</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4 KPI Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm transition-all hover:shadow-md">
            <div className="absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#1755A7] via-[#2563EB] to-[#38BDF8]" />
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Ranked Scholars</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-black tracking-tight text-slate-900">{summary.data ? summary.data.totalStudents.toLocaleString() : "-"}</div>
            <div className="mt-3 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">Students on the leaderboard</div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm transition-all hover:shadow-md">
            <div className="absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#F8C401] via-amber-500 to-orange-500" />
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Leaderboard #1 Score</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
                <Trophy className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              {top1 ? top1.totalPoints.toLocaleString() : "-"}
            </div>
            <div className="mt-3 truncate border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">{top1?.fullName ?? "No ranked students yet"}</div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm transition-all hover:shadow-md">
            <div className="absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400" />
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{summary.data?.topLevelName ?? "Top Level"} Scholars</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
                <Award className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-black tracking-tight text-slate-900">{summary.data ? summary.data.topLevelCount.toLocaleString() : "-"}</div>
            <div className="mt-3 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
              {summary.data?.topLevelMinPoints != null ? `${summary.data.topLevelMinPoints.toLocaleString()}+ verified points` : "Highest competency level"}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm transition-all hover:shadow-md">
            <div className="absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400" />
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Average Score</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-400/15 text-indigo-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-black tracking-tight text-slate-900">{summary.data ? summary.data.averagePoints.toLocaleString() : "-"}</div>
            <div className="mt-3 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">Average points per student</div>
          </div>
        </div>

        {/* Top 3 Podium Visual */}
        {items.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            
            {/* #2 Rank Silver */}
            {top2 && (
              <div className="relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs text-center order-2 md:order-1 hover:shadow-md transition-all">
                <div className="space-y-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-700 border-2 border-slate-300 shadow-xs font-black text-lg">
                    2
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-0.5 text-xs font-bold text-slate-700">
                    <Medal className="h-3.5 w-3.5 text-slate-500" /> Silver Scholar
                  </div>
                  <h3 className="text-base font-black text-slate-900">{top2.fullName}</h3>
                  <p className="text-xs text-slate-500 font-semibold">{top2.levelName}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="font-mono text-base font-black text-slate-900">{top2.totalPoints.toLocaleString()} pts</span>
                </div>
              </div>
            )}

            {/* #1 Rank Gold (Elevated) */}
            {top1 && (
              <div className="relative flex flex-col justify-between rounded-2xl border-2 border-[#F8C401] bg-gradient-to-b from-amber-50/60 to-white p-6 sm:p-7 shadow-md text-center order-1 md:order-2 md:-translate-y-2 hover:shadow-lg transition-all">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F8C401] px-3.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-slate-900 shadow-xs">
                    <Crown className="h-3.5 w-3.5 text-slate-900" /> Top Performer
                  </span>
                </div>
                <div className="space-y-3 pt-2">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F8C401]/20 text-[#1755A7] border-2 border-[#F8C401] shadow-xs font-black text-xl">
                    <Trophy className="h-8 w-8 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">{top1.fullName}</h3>
                  <p className="text-xs text-slate-600 font-semibold">{top1.levelName}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-amber-200">
                  <span className="font-mono text-xl font-black text-amber-900">{top1.totalPoints.toLocaleString()} pts</span>
                </div>
              </div>
            )}

            {/* #3 Rank Bronze */}
            {top3 && (
              <div className="relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs text-center order-3 md:order-3 hover:shadow-md transition-all">
                <div className="space-y-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-800 border-2 border-amber-300 shadow-xs font-black text-lg">
                    3
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-0.5 text-xs font-bold text-amber-800">
                    <Medal className="h-3.5 w-3.5 text-amber-600" /> Bronze Scholar
                  </div>
                  <h3 className="text-base font-black text-slate-900">{top3.fullName}</h3>
                  <p className="text-xs text-slate-500 font-semibold">{top3.levelName}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="font-mono text-base font-black text-slate-900">{top3.totalPoints.toLocaleString()} pts</span>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="flex flex-col items-stretch gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:gap-4">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search scholar name or level..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div className="w-full sm:w-52">
            <CustomSelect
              value={selectedDept}
              onChange={setSelectedDept}
              options={[
                { label: "All Departments", value: "ALL" },
                ...departments.map((d) => ({ label: d, value: d })),
              ]}
            />
          </div>
        </div>

        {/* Full Rankings Table */}
        {leaderboard.isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Spinner label="Updating leaderboard telemetry…" />
          </div>
        ) : leaderboard.isError ? (
          <ErrorBanner error={leaderboard.error} />
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center shadow-xs">
            <p className="text-xs text-slate-500">No scholars match your search criteria.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-3 py-4 sm:px-6">Rank</th>
                    <th className="px-3 py-4 sm:px-6">Student Scholar</th>
                    <th className="px-3 py-4 sm:px-6">Competency Level</th>
                    <th className="px-3 py-4 text-right sm:px-6">Total Verified Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((entry, idx) => {
                    const isSelf = entry.userId === me.data?.userId;
                    const rankNum = rankOf.get(entry.userId) ?? idx + 1;

                    return (
                      <tr
                        key={entry.userId}
                        className={`transition-colors ${
                          isSelf
                            ? "bg-[#1755A7]/10 font-bold border-l-4 border-l-[#1755A7]"
                            : "hover:bg-slate-50/60"
                        }`}
                      >
                        <td className="px-3 py-4 sm:px-6">
                          <div className="flex items-center gap-2">
                            <span
                              className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black font-mono ${
                                rankNum === 1
                                  ? "bg-[#F8C401] text-slate-900"
                                  : rankNum === 2
                                  ? "bg-slate-200 text-slate-800"
                                  : rankNum === 3
                                  ? "bg-amber-100 text-amber-900"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              #{rankNum}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1755A7] text-white font-bold text-xs">
                              {entry.fullName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                {entry.fullName}
                                {isSelf && (
                                  <span className="rounded-full bg-[#1755A7] px-2 py-0.5 text-[9px] font-black text-white uppercase">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">{entry.department}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-4 sm:px-6">
                          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 py-0.5 pl-1 pr-2.5 text-xs font-bold text-slate-700">
                            <LevelBadge levelId={levelIdByName(entry.levelName)} size={22} />
                            {entry.levelName}
                          </span>
                        </td>

                        <td className="px-3 py-4 text-right sm:px-6">
                          <span className="font-mono text-sm font-black text-[#1755A7]">
                            {entry.totalPoints.toLocaleString()} pts
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
