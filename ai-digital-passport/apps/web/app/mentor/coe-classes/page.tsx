"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { Spinner } from "../../../components/ui/Spinner";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { mentorCoeClassesApi, type ClassTeachingLogResponse } from "../../../lib/api";
import { useConfirm } from "../../../components/ui/ConfirmDialogProvider";
import {
  Sparkles,
  Calendar,
  BookOpen,
  Send,
  Pencil,
  Trash2,
  X,
  Link as LinkIcon,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7]";
const labelClass = "text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1";

function toLocalDateInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function MentorCoeClassesPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const events = useQuery({ queryKey: ["mentor", "coe-classes", "events"], queryFn: mentorCoeClassesApi.events });
  const logs = useQuery({ queryKey: ["mentor", "coe-classes", "logs"], queryFn: mentorCoeClassesApi.myLogs });

  const [editing, setEditing] = useState<ClassTeachingLogResponse | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [eventId, setEventId] = useState("");
  const [classDate, setClassDate] = useState(() => toLocalDateInput(new Date().toISOString()));
  const [topicsCovered, setTopicsCovered] = useState("");
  const [materialsUrl, setMaterialsUrl] = useState("");
  const [notes, setNotes] = useState("");

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["mentor", "coe-classes", "logs"] });

  const submit = useMutation({
    mutationFn: async () => {
      const input = { classDate: new Date(classDate).toISOString(), topicsCovered, materialsUrl: materialsUrl || undefined, notes: notes || undefined };
      if (editing) return mentorCoeClassesApi.update(editing.logId, input);
      return mentorCoeClassesApi.create({ eventId, ...input });
    },
    onSuccess: () => {
      refresh();
      closeForm();
    },
  });

  const remove = useMutation({
    mutationFn: (logId: string) => mentorCoeClassesApi.remove(logId),
    onSuccess: refresh,
  });

  function openCreate() {
    setEditing(null);
    setEventId("");
    setClassDate(toLocalDateInput(new Date().toISOString()));
    setTopicsCovered("");
    setMaterialsUrl("");
    setNotes("");
    submit.reset();
    setFormOpen(true);
  }

  function openEdit(log: ClassTeachingLogResponse) {
    setEditing(log);
    setEventId(log.eventId);
    setClassDate(toLocalDateInput(log.classDate));
    setTopicsCovered(log.topicsCovered);
    setMaterialsUrl(log.materialsUrl ?? "");
    setNotes(log.notes ?? "");
    submit.reset();
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  const rawLogs = logs.data ?? [];
  const rawEvents = events.data ?? [];

  return (
    <ConsoleShell role="MENTOR">
      <div className="space-y-6">

        {/* Top Header Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 lg:p-8 shadow-xs">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-gradient-to-br from-[#1755A7]/10 to-[#F8C401]/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-3xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1755A7]/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#1755A7]">
                  <Sparkles className="h-3.5 w-3.5 text-[#F8C401]" />
                  Faculty Teaching Record
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900">CoE Classes — What You Taught</h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Log the topics you covered in each CoE Class session. Admin sees every entry across all departments, giving them visibility into actual class content — not just attendance counts.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1755A7] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#134486] hover:shadow-md hover:shadow-[#1755A7]/20 active:scale-95"
              >
                <BookOpen className="h-4 w-4" />
                Log a Class
              </button>
            </div>
          </div>
        </div>

        {/* My Teaching Logs */}
        {logs.isLoading ? (
          <div className="flex min-h-[30vh] items-center justify-center"><Spinner label="Loading your teaching logs…" /></div>
        ) : logs.isError ? (
          <ErrorBanner error={logs.error} />
        ) : rawLogs.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-10 text-center text-sm text-slate-500">
            You haven't logged any classes yet. Click "Log a Class" to record what you taught in a CoE Class session.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">CoE Class</th>
                  <th className="px-6 py-3.5">Class Date</th>
                  <th className="px-6 py-3.5">Topics Covered</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rawLogs.map((log) => (
                  <tr key={log.logId} className="hover:bg-slate-50/70 transition-colors align-top">
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900">{log.eventTitle ?? "—"}</span>
                      {log.eventDepartment && <div className="mt-0.5 text-[11px] text-slate-400">{log.eventDepartment}{log.eventYear ? ` · ${log.eventYear}` : ""}</div>}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-slate-400" /> {new Date(log.classDate).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      <p className="text-slate-700 whitespace-pre-wrap">{log.topicsCovered}</p>
                      {log.materialsUrl && (
                        <a href={log.materialsUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 font-bold text-[#1755A7] hover:underline">
                          <LinkIcon className="h-3 w-3" /> Materials <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {log.notes && <p className="mt-1 text-[11px] text-slate-400 italic">{log.notes}</p>}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(log)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5 text-slate-500" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (await confirm({ message: "Delete this teaching log entry?", confirmLabel: "Delete" })) remove.mutate(log.logId);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-rose-200 bg-white hover:bg-rose-50"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Log / Edit Modal */}
        {formOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{editing ? "Edit Teaching Log" : "Log a CoE Class"}</h3>
                    <p className="text-[11px] text-slate-500">{editing ? editing.eventTitle : "Record what you taught"}</p>
                  </div>
                </div>
                <button type="button" onClick={closeForm} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {submit.isSuccess ? (
                <div className="p-6 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="text-base font-black text-slate-900">Saved</h4>
                  <p className="text-xs text-slate-600">Your teaching log is visible to admin.</p>
                  <button type="button" onClick={closeForm} className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#1755A7] px-4 py-2 text-xs font-bold text-white hover:bg-[#134486] transition-all">
                    Done
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submit.mutate();
                  }}
                  className="space-y-4"
                >
                  {submit.isError && <ErrorBanner error={submit.error} />}

                  {!editing && (
                    <div>
                      <label className={labelClass}>CoE Class</label>
                      <select required value={eventId} onChange={(e) => setEventId(e.target.value)} className={inputClass}>
                        <option value="" disabled>Select a CoE Class…</option>
                        {rawEvents.map((ev) => (
                          <option key={ev.eventId} value={ev.eventId}>
                            {ev.title}{ev.department ? ` — ${ev.department}` : ""}{ev.year ? ` (${ev.year})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className={labelClass}>Class Date</label>
                    <input type="date" required value={classDate} onChange={(e) => setClassDate(e.target.value)} className={inputClass} />
                  </div>

                  <div>
                    <label className={labelClass}>Topics Covered</label>
                    <textarea
                      required
                      rows={4}
                      value={topicsCovered}
                      onChange={(e) => setTopicsCovered(e.target.value)}
                      placeholder="What did you teach in this session? e.g. Introduction to CNNs, backpropagation walkthrough, live demo of image classification…"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}><LinkIcon className="h-3.5 w-3.5" /> Materials Link (optional)</label>
                    <input
                      type="url"
                      value={materialsUrl}
                      onChange={(e) => setMaterialsUrl(e.target.value)}
                      placeholder="https://drive.google.com/... or any link to slides/notebook"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Notes (optional)</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional remarks"
                      className={inputClass}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button type="button" onClick={closeForm} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submit.isPending}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#1755A7] px-4 py-2 text-xs font-bold text-white hover:bg-[#134486] transition-all shadow-xs disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {submit.isPending ? "Saving…" : editing ? "Save Changes" : "Log Class"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </ConsoleShell>
  );
}
