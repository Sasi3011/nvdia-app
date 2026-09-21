"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, ChevronLeft, ChevronRight, Clock, Eye, Search, Users } from "lucide-react";
import { LEVEL_DEFINITIONS } from "@ai-digital-passport/shared-types";
import { staffStudentsApi } from "../../lib/api";
import { CustomSelect } from "../ui/CustomSelect";
import { ErrorBanner } from "../ui/ErrorBanner";
import { LevelBadge } from "../ui/LevelBadge";
import { Spinner } from "../ui/Spinner";

const PAGE_SIZE = 15;

function timeAgo(iso: string | null) {
  if (!iso) return "No activity yet";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function StudentList({ basePath }: { basePath: "/admin/students" | "/mentor/students" }) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [department, setDepartment] = useState("ALL");
  const [level, setLevel] = useState("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => setPage(1), [debounced, department, level]);

  const students = useQuery({
    queryKey: ["staff", "students", debounced, department, level, page],
    queryFn: () =>
      staffStudentsApi.list({
        search: debounced || undefined,
        department: department === "ALL" ? undefined : department,
        level: level === "ALL" ? undefined : Number(level),
        page,
        pageSize: PAGE_SIZE,
      }),
    placeholderData: (prev) => prev,
  });

  const data = students.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const topLevel = data?.summary.byLevel.slice().sort((a, b) => b.count - a.count)[0];

  const kpis = [
    {
      label: "Total Students",
      value: data?.summary.totalStudents ?? 0,
      sub: `${data?.departments.length ?? 0} departments`,
      icon: Users,
      bar: "from-[#1755A7] via-[#2563EB] to-[#38BDF8]",
      tone: "bg-[#1755A7]/10 text-[#1755A7]",
    },
    {
      label: "Average Points",
      value: data?.summary.averagePoints ?? 0,
      sub: "Across all students",
      icon: Award,
      bar: "from-[#F8C401] via-amber-500 to-orange-500",
      tone: "bg-amber-500/15 text-amber-600",
    },
    {
      label: "Most Common Level",
      value: topLevel ? (LEVEL_DEFINITIONS.find((l) => l.levelId === topLevel.levelId)?.levelName ?? `Level ${topLevel.levelId}`) : "-",
      sub: topLevel ? `${topLevel.count} student${topLevel.count === 1 ? "" : "s"}` : "No students yet",
      icon: Award,
      bar: "from-emerald-500 via-emerald-400 to-teal-400",
      tone: "bg-emerald-500/15 text-emerald-600",
      small: true,
    },
    {
      label: "Pending Claims",
      value: data?.summary.pendingClaims ?? 0,
      sub: "Awaiting mentor review",
      icon: Clock,
      bar: "from-indigo-400 via-purple-400 to-pink-400",
      tone: "bg-indigo-400/15 text-indigo-600",
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm transition-all hover:shadow-md">
            <div className={`absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${k.bar}`} />
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">{k.label}</span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${k.tone}`}>
                <k.icon className="h-4 w-4" />
              </div>
            </div>
            <div className={`mt-3 font-black tracking-tight text-slate-900 ${k.small ? "text-xl" : "text-3xl"}`}>{k.value}</div>
            <div className="mt-3 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col items-stretch gap-3 md:flex-row md:items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email or register number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7]"
          />
        </div>
        <div className="w-full md:w-52">
          <CustomSelect
            value={department}
            onChange={setDepartment}
            options={[{ label: "All Departments", value: "ALL" }, ...(data?.departments ?? []).map((d) => ({ label: d, value: d }))]}
          />
        </div>
        <div className="w-full md:w-52">
          <CustomSelect
            value={level}
            onChange={setLevel}
            options={[{ label: "All Levels", value: "ALL" }, ...LEVEL_DEFINITIONS.map((l) => ({ label: `L${l.levelId} - ${l.levelName}`, value: String(l.levelId) }))]}
          />
        </div>
      </div>

      {students.isLoading ? (
        <div className="flex h-64 items-center justify-center"><Spinner label="Loading students..." /></div>
      ) : students.isError ? (
        <div className="mt-6"><ErrorBanner error={students.error} /></div>
      ) : !data || data.items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Users className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm font-bold text-slate-700">No students found.</p>
          <p className="mt-1 text-xs text-slate-400">Try a different search or filter.</p>
        </div>
      ) : (
        <>
        <div className="mt-6 space-y-3 md:hidden">
          {data.items.map((s) => (
            <Link
              key={s.userId}
              href={`${basePath}/detail?id=${s.userId}`}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <LevelBadge levelId={s.levelId} size={44} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-bold text-slate-900">{s.fullName}</div>
                <div className="truncate font-mono text-[11px] text-slate-400">{s.registerNum} &middot; {s.department} &middot; {s.cohortYear}</div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] font-semibold">
                  <span className="text-slate-800">{s.totalPoints} pts</span>
                  <span className="font-mono">
                    <span className="text-emerald-600">{s.claims.approved}</span>
                    <span className="text-slate-300"> / </span>
                    <span className="text-amber-600">{s.claims.pending}</span>
                    <span className="text-slate-300"> / </span>
                    <span className="text-red-600">{s.claims.rejected}</span>
                  </span>
                  <span className="text-slate-400">{timeAgo(s.lastActivityAt)}</span>
                </div>
              </div>
              <Eye className="h-4 w-4 shrink-0 text-slate-400" />
            </Link>
          ))}
        </div>
        <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Student</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Level</th>
                <th className="px-6 py-3.5 text-center">Points</th>
                <th className="px-6 py-3.5 text-center">Claims (A / P / R)</th>
                <th className="px-6 py-3.5">Last Activity</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((s) => (
                <tr key={s.userId} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-6 py-3.5">
                    <Link href={`${basePath}/detail?id=${s.userId}`} className="text-[13px] font-bold text-slate-900 transition-colors hover:text-[#1755A7]">
                      {s.fullName}
                    </Link>
                    <div className="mt-0.5 font-mono text-[11px] text-slate-400">{s.registerNum} &middot; {s.email}</div>
                  </td>
                  <td className="px-6 py-3.5 font-semibold text-slate-700">{s.department} &middot; {s.cohortYear}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <LevelBadge levelId={s.levelId} size={36} />
                      <span className="font-bold text-slate-800">{s.levelName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-center text-sm font-black text-slate-900">{s.totalPoints}</td>
                  <td className="px-6 py-3.5 text-center font-mono text-[11px] font-bold">
                    <span className="text-emerald-600">{s.claims.approved}</span>
                    <span className="text-slate-300"> / </span>
                    <span className="text-amber-600">{s.claims.pending}</span>
                    <span className="text-slate-300"> / </span>
                    <span className="text-red-600">{s.claims.rejected}</span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-500">{timeAgo(s.lastActivityAt)}</td>
                  <td className="px-6 py-3.5 text-right">
                    <Link
                      href={`${basePath}/detail?id=${s.userId}`}
                      title="View progress"
                      aria-label={`View progress of ${s.fullName}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50 hover:text-[#1755A7]"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-[11px] font-semibold text-slate-500 sm:px-6">
            <span>{data.total} student{data.total === 1 ? "" : "s"}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                aria-label="Previous page"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Next page"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white disabled:opacity-40"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
        </>
      )}
    </>
  );
}
