"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, Search, ExternalLink, Users, BookOpen, Eye, X, Calendar, Mail, Link as LinkIcon } from "lucide-react";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { adminCoeClassLogsApi, type AdminClassTeachingLogResponse } from "../../../lib/api";
import { safeUrl } from "../../../lib/safe-url";

const detailLabel = "text-[10px] font-bold uppercase tracking-wider text-slate-400";

// Faculty-authored record of what was taught in each CoE Class session —
// a separate page from CoE Classes/QR management, since it's content
// review, not event scheduling. Every mentor's submission across every
// department shows up here; department is display metadata only.
export default function FacultyTeachingLogsPage() {
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<AdminClassTeachingLogResponse | null>(null);
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

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const loggedThisWeek = rows.filter((l) => new Date(l.createdAt) >= since).length;
  const facultyCount = new Set(rows.map((l) => l.mentorEmail).filter(Boolean)).size;
  const classCount = new Set(rows.map((l) => l.eventId)).size;

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader
        title="Faculty Teaching Logs"
        description="What each mentor taught in their CoE Class sessions, across every department."
      />

      {/* Top 3 Metric Cards — same visual language as the CoE Classes page */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Card 1: Total Teaching Logs */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#1755A7] via-[#2563EB] to-[#38BDF8]" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold text-slate-500">Total Teaching Logs</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1755A7]/15 to-[#2563EB]/10 text-[#1755A7]">
              <GraduationCap className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{rows.length}</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
              {loggedThisWeek} this week
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Search results:</span>
            <span className="font-bold text-slate-800">{filtered.length} matching</span>
          </div>
        </div>

        {/* Card 2: Faculty Who Logged */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold text-slate-500">Faculty Who Logged</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-400/10 text-emerald-600">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{facultyCount}</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Mentors
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Avg logs per faculty:</span>
            <span className="font-bold text-slate-800">{facultyCount ? (rows.length / facultyCount).toFixed(1) : "0"}</span>
          </div>
        </div>

        {/* Card 3: Classes Covered */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#F8C401] via-amber-500 to-orange-500" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold text-slate-500">Classes Covered</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 text-amber-600">
              <BookOpen className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{classCount}</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
              CoE Classes
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Distinct topics logged:</span>
            <span className="font-bold text-slate-800">{rows.length}</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search class, mentor, department, topic…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7] transition-colors"
          />
        </div>
      </div>

      <div className="mt-6">
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
                  <th className="px-6 py-3.5 text-right">Actions</th>
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
                        <a href={safeUrl(l.materialsUrl)} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 font-bold text-[#1755A7] hover:underline">
                          Materials <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setViewing(l)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-[#1755A7]/40"
                        title="View details"
                      >
                        <Eye className="h-3.5 w-3.5 text-[#1755A7]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {viewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setViewing(null)}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-[#1755A7] via-[#1E40AF] to-[#2563EB] px-4 py-4 text-white sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#F8C401]">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">{viewing.eventTitle ?? "Teaching Log"}</h3>
                  <p className="text-xs text-blue-100">
                    {[viewing.eventDepartment, viewing.eventYear, viewing.eventSessionType].filter(Boolean).join(" · ") || "CoE Class"}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setViewing(null)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white minute-scrollbar">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className={detailLabel}>Faculty</div>
                  <div className="mt-1 text-xs font-bold text-slate-900">{viewing.mentorName ?? "—"}</div>
                  {viewing.mentorDepartment && <div className="text-[11px] text-slate-500">{viewing.mentorDepartment}</div>}
                  {viewing.mentorEmail && (
                    <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-500">
                      <Mail className="h-3 w-3" /> {viewing.mentorEmail}
                    </div>
                  )}
                </div>
                <div>
                  <div className={detailLabel}>Class Date</div>
                  <div className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-slate-900">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" /> {new Date(viewing.classDate).toLocaleDateString()}
                  </div>
                  <div className="text-[11px] text-slate-500">Logged {new Date(viewing.createdAt).toLocaleString()}</div>
                </div>
              </div>

              <div>
                <div className={detailLabel}>Co-Faculty</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {viewing.coMentors?.length ? viewing.coMentors.map((m) => (
                    <span key={m.id} className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-200">
                      {m.name}
                    </span>
                  )) : <span className="text-xs text-slate-400">—</span>}
                </div>
              </div>

              <div>
                <div className={detailLabel}>Topics Covered</div>
                <p className="mt-1 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs text-slate-700 whitespace-pre-wrap">{viewing.topicsCovered}</p>
              </div>

              {viewing.materialsUrl && (
                <div>
                  <div className={detailLabel}>Materials</div>
                  <a href={safeUrl(viewing.materialsUrl)} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 break-all text-xs font-bold text-[#1755A7] hover:underline">
                    <LinkIcon className="h-3 w-3 shrink-0" /> {viewing.materialsUrl} <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </div>
              )}

              {viewing.notes && (
                <div>
                  <div className={detailLabel}>Notes</div>
                  <p className="mt-1 text-xs text-slate-600 whitespace-pre-wrap">{viewing.notes}</p>
                </div>
              )}

              <div className="flex justify-end border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setViewing(null)} className="rounded-xl bg-[#1755A7] px-4 py-2 text-xs font-bold text-white hover:bg-[#134486] transition-all">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConsoleShell>
  );
}
