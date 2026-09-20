"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { LiveQrDisplay } from "../../../components/admin/LiveQrDisplay";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { adminEventsApi, type AdminEventResponse, type AdminEventSessionResponse } from "../../../lib/api";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  QrCode, 
  StopCircle, 
  PlayCircle, 
  ArrowLeft, 
  Radio, 
  Users, 
  CheckCircle2, 
  Sparkles,
  Layers,
  ChevronRight,
  X,
  Search,
  Sliders,
  Trash2
} from "lucide-react";

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7] transition-colors";
const labelClass = "text-xs font-bold text-slate-700 flex items-center gap-1.5";

const EVENT_CATEGORIES = [
  { value: "tech_eve_masterclass", label: "Tech Eve / AI Masterclass", pts: 40 },
  { value: "gpu_friday_lab", label: "GPU Hands-on Friday Lab", pts: 30 },
  { value: "guest_expert_session", label: "NVIDIA Industry Keynote", pts: 50 },
  { value: "code_sprint_workshop", label: "Grand Challenge Workshop", pts: 60 },
  { value: "mentorship_circle", label: "Research Mentorship Circle", pts: 35 },
];

export default function AdminEventsPage() {
  const queryClient = useQueryClient();
  const events = useQuery({ queryKey: ["admin", "events"], queryFn: adminEventsApi.list });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AdminEventResponse | null>(null);
  const [search, setSearch] = useState("");

  const list = events.data ?? [];
  const selected = list.find((e) => e.eventId === selectedId) ?? null;

  const totalSessions = list.reduce((acc, e) => acc + (e.sessions?.length || 0), 0);
  const activeSessions = list.reduce((acc, e) => acc + (e.sessions?.filter(s => s.qrActive)?.length || 0), 0);

  const filteredEvents = list.filter((e) => 
    e.title.toLowerCase().includes(search.toLowerCase()) || 
    e.category.toLowerCase().includes(search.toLowerCase()) ||
    (e.location && e.location.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader
        title="Event Scheduling & Dynamic QR Sessions"
        description="Schedule Tech Eves masterclasses, GPU hands-on Friday labs, and project live rotating QR attendance check-ins."
        actions={
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#2563EB] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1E40AF] transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Schedule New Event</span>
            </button>
          </div>
        }
      />

      {/* Create / Edit Event Modal Popup */}
      {(showCreateModal || editingEvent) && (
        <CreateEventModal
          eventToEdit={editingEvent || undefined}
          onCreated={() => {
            setShowCreateModal(false);
            setEditingEvent(null);
            queryClient.invalidateQueries({ queryKey: ["admin", "events"] });
          }}
          onClose={() => {
            setShowCreateModal(false);
            setEditingEvent(null);
          }}
        />
      )}

      {/* Event Detail Modal */}
      {selected && (
        <EventDetailModal 
          event={selected} 
          onChanged={() => queryClient.invalidateQueries({ queryKey: ["admin", "events"] })} 
          onClose={() => setSelectedId(null)} 
        />
      )}

      {/* Top 4 Event Management Metric Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Scheduled Events</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
              <Calendar className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{list.length}</span>
            <span className="text-xs font-bold text-emerald-600">Active Calendar</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Total Check-in Sessions:</span>
            <span className="font-bold text-slate-800">{totalSessions} Sessions</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Live QR Projectors</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Radio className="h-4.5 w-4.5 animate-pulse text-emerald-600" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{activeSessions}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Broadcasting
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Dynamic Key Refresh:</span>
            <span className="font-bold text-[#1755A7]">Every 15 Seconds</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Weekly Tech Eves</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8C401]/20 text-slate-900">
              <Sparkles className="h-4.5 w-4.5 text-amber-700" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">Every Tuesday</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Hands-on Friday Labs:</span>
            <span className="font-bold text-slate-800">Weekly Scheduled</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Anti-Spoofing Protocol</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
              <QrCode className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#1755A7]">SEC-04</span>
            <span className="text-xs font-bold text-emerald-600">Active</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Location & Session Lock:</span>
            <span className="font-bold text-slate-800">Enforced</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      {!selected && (
        <div className="mt-6 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search scheduled events or venues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7]"
            />
          </div>
        </div>
      )}

      {/* Main Content: Events Table or Selected Detail View */}
      {events.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner label="Loading events calendar..." />
        </div>
      ) : events.isError ? (
        <ErrorBanner error={events.error} />
      ) : filteredEvents.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Calendar className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm font-bold text-slate-700">No events found.</p>
          <p className="text-xs text-slate-400 mt-1">Click "Schedule New Event" above to create one.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Event Title & Agenda</th>
                <th className="px-6 py-3.5">Points</th>
                <th className="px-6 py-3.5">Class</th>
                <th className="px-6 py-3.5">Venue & Location</th>
                <th className="px-6 py-3.5">Schedule Timing</th>
                <th className="px-6 py-3.5 text-center">Attendance</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.map((e) => (
                <tr key={e.eventId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3.5">
                      <div>
                        <button onClick={() => setSelectedId(e.eventId)} className="font-bold text-slate-900 text-[13px] text-left hover:text-[#1755A7] transition-colors">{e.title}</button>
                        {e.description && (
                          <p className="mt-0.5 text-xs text-slate-500 line-clamp-1 max-w-md">{e.description}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                      +{(e as any).points ?? 40} pts
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-900">
                      {(e as any).department || "CSE"}-
                      {((e as any).year || "2nd Year").replace("1st Year", "I").replace("2nd Year", "II").replace("3rd Year", "III").replace("4th Year", "IV")}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <MapPin className="h-3.5 w-3.5 text-[#1755A7]" />
                      {e.location || "NVIDIA Supercomputing Lab"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5 font-medium">
                      <div className="flex items-center gap-2 text-slate-900 font-bold">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {new Date(e.startsAt).toLocaleDateString()}
                        </span>
                        <span className="inline-flex items-center rounded bg-[#1755A7]/10 px-1 py-0.5 text-[9px] font-black uppercase text-[#1755A7]">
                          {((e as any).sessionType || "Forenoon") === "Forenoon" ? "FN" : "AN"}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(e.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(e.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2 font-mono text-[11px] font-bold">
                      <span className="flex items-center justify-center min-w-[32px] px-2 py-1 rounded bg-emerald-100 text-emerald-700" title="Present">
                        {(e as any).presentCount ?? 0}
                      </span>
                      <span className="flex items-center justify-center min-w-[32px] px-2 py-1 rounded bg-red-100 text-red-700" title="Absent">
                        {(e as any).absentCount ?? 0}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setEditingEvent(e)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-slate-50 hover:text-[#1755A7] hover:border-[#1755A7] transition-all"
                        title="Edit"
                      >
                        <Sliders className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
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

function CreateEventModal({ 
  eventToEdit, 
  onCreated, 
  onClose 
}: { 
  eventToEdit?: AdminEventResponse; 
  onCreated: () => void; 
  onClose: () => void; 
}) {
  const [title, setTitle] = useState(eventToEdit?.title ?? "");
  const [points, setPoints] = useState((eventToEdit as any)?.points ?? 40);
  const [sessionType, setSessionType] = useState((eventToEdit as any)?.sessionType ?? "Forenoon");
  const [year, setYear] = useState((eventToEdit as any)?.year ?? "");
  const [department, setDepartment] = useState((eventToEdit as any)?.department ?? "");
  const [location, setLocation] = useState(eventToEdit?.location ?? "IT Centre");
  const [description, setDescription] = useState(eventToEdit?.description ?? "");
  const [startsAt, setStartsAt] = useState(eventToEdit?.startsAt ? new Date(eventToEdit.startsAt).toISOString().slice(0, 16) : "");
  const [endsAt, setEndsAt] = useState(eventToEdit?.endsAt ? new Date(eventToEdit.endsAt).toISOString().slice(0, 16) : "");

  const create = useMutation({
    mutationFn: () => adminEventsApi.create({ 
      title, 
      category: "custom", // mocked for API requirements
      location: location || undefined, 
      startsAt, 
      endsAt,
      description: description || undefined 
    } as any), // Type cast to any since we might pass additional fields to API later
    onSuccess: onCreated,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#1755A7] via-[#1E40AF] to-[#2563EB] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#F8C401]">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Schedule New Institutional Event</h3>
              <p className="text-xs text-blue-100">Configure event parameters, location tagging, and time boundaries</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form
          className="p-6 grid grid-cols-1 gap-4 sm:grid-cols-2 max-h-[75vh] overflow-y-auto minute-scrollbar"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          {create.isError && (
            <div className="sm:col-span-2">
              <ErrorBanner error={create.error} />
            </div>
          )}
          
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className={labelClass}>
              <span>Event Title <span className="text-red-500">*</span></span>
            </label>
            <input 
              required 
              placeholder="E.g. NVIDIA TensorRT-LLM Masterclass & Deployment Lab" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className={inputClass} 
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <span>Points</span>
            </label>
            <input 
              type="number"
              value={points} 
              onChange={(e) => setPoints(Number(e.target.value))} 
              className={inputClass} 
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <span>Session Type</span>
            </label>
            <select value={sessionType} onChange={(e) => setSessionType(e.target.value)} className={inputClass}>
              <option value="Forenoon">Forenoon</option>
              <option value="Afternoon">Afternoon</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <span>Year</span>
            </label>
            <select value={year} onChange={(e) => setYear(e.target.value)} className={inputClass}>
              <option value="">Select Year...</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <span>Department</span>
            </label>
            <select value={department} onChange={(e) => setDepartment(e.target.value)} className={inputClass}>
              <option value="">Select Department...</option>
              <option value="CSE">CSE</option>
              <option value="IT">IT</option>
              <option value="AI & DS">AI & DS</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="MECH">MECH</option>
              <option value="CIVIL">CIVIL</option>
              <option value="All Departments">All Departments</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <span>Venue / Lab Location</span>
            </label>
            <select value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass}>
              <option value="IT Centre">IT Centre</option>
              <option value="Code Studio">Code Studio</option>
              <option value="Collab Space">Collab Space</option>
              <option value="Full Stack Lab">Full Stack Lab</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <span>Starts At <span className="text-red-500">*</span></span>
            </label>
            <input 
              required 
              type="datetime-local" 
              value={startsAt} 
              onChange={(e) => setStartsAt(e.target.value)} 
              className={inputClass} 
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <span>Ends At <span className="text-red-500">*</span></span>
            </label>
            <input 
              required 
              type="datetime-local" 
              value={endsAt} 
              onChange={(e) => setEndsAt(e.target.value)} 
              className={inputClass} 
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className={labelClass}>
              <span>Event Description & Agenda</span>
            </label>
            <textarea 
              rows={3} 
              placeholder="Detailed learning agenda, prerequisites, and instructions for student attendees..." 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              className={inputClass} 
            />
          </div>

          {/* Modal Sticky Actions */}
          <div className="mt-2 flex items-center justify-end gap-3 sm:col-span-2 pt-3 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors active:scale-95"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={create.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#2563EB] px-6 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1E40AF] transition-all disabled:opacity-50 active:scale-95"
            >
              {create.isPending ? "Creating Event..." : "Create & Schedule Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EventDetailModal({ event, onChanged, onClose }: { event: AdminEventResponse; onChanged: () => void; onClose: () => void }) {
  const sessionId = event.sessions[0]?.sessionId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{event.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1 rounded-full bg-[#1755A7]/10 px-2 py-0.5 text-[10px] font-bold text-[#1755A7] uppercase">
                {(event as any).sessionType || "Forenoon"}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-[#1755A7]" /> 
                {new Date(event.startsAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                {new Date(event.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {event.location && (
                <span className="flex items-center gap-1 text-slate-700">
                  <MapPin className="h-3.5 w-3.5 text-[#1755A7]" /> 
                  {event.location}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 bg-slate-50 flex-1 flex flex-col">
          {event.description && (
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Event Agenda & Description</h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          {sessionId ? (
            <div className="w-full">
              <LiveQrDisplay sessionId={sessionId} />
            </div>
          ) : (
            <div className="text-center p-12 bg-white rounded-xl border border-slate-200 shadow-sm mt-4">
              <QrCode className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <p className="text-sm font-bold text-slate-700">No QR session available for this event.</p>
              <p className="text-xs text-slate-400 mt-1">Contact an administrator to initialize the QR session.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
