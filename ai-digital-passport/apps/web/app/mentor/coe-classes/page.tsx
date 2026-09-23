"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
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
import Select from "react-select";
import { EventsManager } from "../../admin/events/page";

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
  const [coMentorIds, setCoMentorIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"MANAGE" | "LOGS">("LOGS");

  const mentors = useQuery({ queryKey: ["users", "mentors"], queryFn: mentorCoeClassesApi.listMentors });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["mentor", "coe-classes", "logs"] });

  const submit = useMutation({
    mutationFn: async () => {
      const input = { classDate: new Date(classDate).toISOString(), topicsCovered, materialsUrl: materialsUrl || undefined, notes: notes || undefined, coMentorIds: coMentorIds.length > 0 ? coMentorIds : undefined };
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
    setCoMentorIds([]);
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
    setCoMentorIds(log.coMentors?.map(m => m.id) ?? []);
    submit.reset();
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  const rawLogs = logs.data ?? [];
  const rawEvents = events.data ?? [];

  const tabs = (
    <div className="flex items-center gap-6 pr-4">
      <button
        onClick={() => setActiveTab("LOGS")}
        className={`pb-4 -mb-4 text-sm font-bold transition-colors border-b-2 ${activeTab === "LOGS" ? "border-[#1755A7] text-[#1755A7]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
      >
        My Teaching Logs
      </button>
      <button
        onClick={() => setActiveTab("MANAGE")}
        className={`pb-4 -mb-4 text-sm font-bold transition-colors border-b-2 ${activeTab === "MANAGE" ? "border-[#1755A7] text-[#1755A7]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
      >
        Manage CoE Classes
      </button>
    </div>
  );

  const logAction = (
    <button
      type="button"
      onClick={openCreate}
      className="inline-flex items-center gap-2 rounded-xl bg-[#1755A7] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#134486] hover:shadow-md hover:shadow-[#1755A7]/20 active:scale-95"
    >
      <BookOpen className="h-4 w-4" />
      Log a Class
    </button>
  );

  return (
    <ConsoleShell role="MENTOR">
      <div className="space-y-6">

        {activeTab === "MANAGE" ? (
           <div><EventsManager customSearchAreaContent={tabs} /></div>
        ) : (
          <>
        {/* My Teaching Logs */}
        <ConsolePageHeader
          title="CoE Classes & Dynamic QR Sessions"
          description="Schedule Tech Eves masterclasses, GPU hands-on Friday labs, and project live rotating QR attendance check-ins."
          actions={
            <div className="flex items-center gap-2.5">
              {logAction}
            </div>
          }
        />

        {/* Top 3 Metric Cards for Teaching Logs */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Card 1: Total Classes Logged */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#1755A7] via-[#2563EB] to-[#38BDF8]" />
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-semibold text-slate-500">Classes Logged</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1755A7]/15 to-[#2563EB]/10 text-[#1755A7]">
                <BookOpen className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">{rawLogs.length}</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#1755A7]">
                Total
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
              <span>This Month:</span>
              <span className="font-bold text-slate-800">{rawLogs.filter(l => new Date(l.classDate).getMonth() === new Date().getMonth()).length} Classes</span>
            </div>
          </div>

          {/* Card 2: Co-Faculty */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400" />
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-semibold text-slate-500">Collaborators</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-400/10 text-emerald-600">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">{new Set(rawLogs.flatMap(l => l.coMentors?.map(m => m.id) ?? [])).size}</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Co-Faculty
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
              <span>Teaching Together</span>
              <span className="font-bold text-[#1755A7]">In your classes</span>
            </div>
          </div>

          {/* Card 3: Events Taught */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#F8C401] via-amber-500 to-orange-500" />
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-semibold text-slate-500">Unique CoE Events</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 text-amber-600">
                <Calendar className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">{new Set(rawLogs.map(l => l.eventId)).size}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
              <span>Different events you taught</span>
              <span className="font-bold text-amber-600">Across {new Set(rawLogs.map(l => l.eventDepartment)).size} Departments</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex flex-1 items-center gap-6">
            {tabs}
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
                  <th className="px-6 py-3.5">Co-Faculty</th>
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
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {log.coMentors?.length ? log.coMentors.map(m => (
                          <span key={m.id} className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-200">
                            {m.name}
                          </span>
                        )) : <span className="text-[11px] text-slate-400">—</span>}
                      </div>
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
        </>
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
                    <label className={labelClass}>Co-Faculty</label>
                    <Select
                      isMulti
                      options={mentors.data?.map(m => ({ value: m.id, label: m.name })) ?? []}
                      value={mentors.data?.filter(m => coMentorIds.includes(m.id)).map(m => ({ value: m.id, label: m.name })) ?? []}
                      onChange={(selected) => setCoMentorIds((selected as { value: string, label: string }[]).map(s => s.value))}
                      className="text-xs"
                      classNames={{
                        control: (state) => `!border-slate-200 !rounded-xl !min-h-[42px] ${state.isFocused ? '!border-[#1755A7] !shadow-[0_0_0_1px_#1755A7]' : ''}`,
                        valueContainer: () => "!px-3.5",
                        placeholder: () => "!text-slate-400",
                      }}
                      placeholder="Select co-faculty if they also taught this class"
                    />
                  </div>

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
