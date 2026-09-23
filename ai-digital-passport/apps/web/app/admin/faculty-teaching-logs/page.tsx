"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, Search, ExternalLink } from "lucide-react";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { adminCoeClassLogsApi } from "../../../lib/api";

// Faculty-authored record of what was taught in each CoE Class session —
// a separate page from CoE Classes/QR management, since it's content
// review, not event scheduling. Every mentor's submission across every
// department shows up here; department is display metadata only.
export default function FacultyTeachingLogsPage() {
  const [search, setSearch] = useState("");
  const logs = useQuery({ queryKey: ["admin", "coe-classes", "logs"], queryFn: adminCoeClassLogsApi.list });
  const rows = logs.data ?? [];
  const filtered = rows.filter((l) => {
    const q = search.toLowerCase();
    return (
      (l.eventTitle ?? "").toLowerCase().includes(q) ||
      (l.mentorName ?? "").toLowerCase().includes(q) ||
      (l.eventDepartment ?? "").toLowerCase().includes(q) ||
      l.topicsCovered.toLowerCase().includes(q)
    );
  });

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader
        title="Faculty Teaching Logs"
        description="What each mentor taught in their CoE Class sessions, across every department."
      />

      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-[#1755A7]" />
            <span className="text-xs font-bold text-slate-600">{rows.length} log{rows.length === 1 ? "" : "s"} recorded</span>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search class, mentor, department, topic…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none"
            />
          </div>
        </div>

        {logs.isLoading ? (
          <div className="flex min-h-[30vh] items-center justify-center"><Spinner label="Loading teaching logs…" /></div>
        ) : logs.isError ? (
          <ErrorBanner error={logs.error} />
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-10 text-center text-sm text-slate-500">
            {rows.length === 0 ? "No faculty have logged a class yet." : "No teaching logs match your search."}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">CoE Class</th>
                  <th className="px-6 py-3.5">Faculty</th>
                  <th className="px-6 py-3.5">Class Date</th>
                  <th className="px-6 py-3.5">Topics Covered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((l) => (
                  <tr key={l.logId} className="hover:bg-slate-50/70 transition-colors align-top">
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900">{l.eventTitle ?? "—"}</span>
                      {l.eventDepartment && <div className="mt-0.5 text-[11px] text-slate-400">{l.eventDepartment}{l.eventYear ? ` · ${l.eventYear}` : ""}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-800">{l.mentorName ?? "—"}</span>
                      {l.mentorDepartment && <div className="mt-0.5 text-[11px] text-slate-400">{l.mentorDepartment}</div>}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600 whitespace-nowrap">{new Date(l.classDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 max-w-md">
                      <p className="text-slate-700 whitespace-pre-wrap">{l.topicsCovered}</p>
                      {l.materialsUrl && (
                        <a href={l.materialsUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 font-bold text-[#1755A7] hover:underline">
                          Materials <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ConsoleShell>
  );
}
