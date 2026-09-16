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

      {/* Create Event Modal Popup */}
      {showCreateModal && (
        <CreateEventModal
          onCreated={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ["admin", "events"] });
          }}
          onClose={() => setShowCreateModal(false)}
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
      ) : selected ? (
        <div className="mt-6">
          <EventDetail 
            event={selected} 
            onChanged={() => queryClient.invalidateQueries({ queryKey: ["admin", "events"] })} 
            onBack={() => setSelectedId(null)} 
          />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Event Title & Agenda</th>
                <th className="px-6 py-3.5">Category & Track</th>
                <th className="px-6 py-3.5">Venue & Location</th>
                <th className="px-6 py-3.5">Schedule Timing</th>
                <th className="px-6 py-3.5 text-center">Sessions</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.map((e) => (
                <tr key={e.eventId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-[13px]">{e.title}</span>
                        {e.description && (
                          <p className="mt-0.5 text-xs text-slate-500 line-clamp-1 max-w-md">{e.description}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 capitalize">
                      {e.category.replace(/_/g, " ")}
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
                      <span className="flex items-center gap-1.5 text-slate-900 font-bold">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {new Date(e.startsAt).toLocaleDateString()}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(e.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(e.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 font-mono font-bold text-slate-800 text-xs">
                      {e.sessions.length}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedId(e.eventId)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-[#1755A7] transition-all"
                    >
                      <span>Manage QR</span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    </button>
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
  const [category, setCategory] = useState(eventToEdit?.category ?? "tech_eve_masterclass");
  const [location, setLocation] = useState(eventToEdit?.location ?? "Sri Eshwar NVIDIA AI Centre, Lab 3");
  const [description, setDescription] = useState(eventToEdit?.description ?? "");
  const [startsAt, setStartsAt] = useState(eventToEdit?.startsAt ? new Date(eventToEdit.startsAt).toISOString().slice(0, 16) : "");
  const [endsAt, setEndsAt] = useState(eventToEdit?.endsAt ? new Date(eventToEdit.endsAt).toISOString().slice(0, 16) : "");

  const create = useMutation({
    mutationFn: () => adminEventsApi.create({ 
      title, 
      category, 
      location: location || undefined, 
      startsAt, 
      endsAt,
      description: description || undefined 
    }),
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
              <span>Event Category Track</span>
            </label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              {EVENT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label} (+{c.pts} pts)
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <span>Venue / Lab Location</span>
            </label>
            <input 
              placeholder="E.g. NVIDIA AI Supercomputing Center / Hall A" 
              value={location} 
              onChange={(e) => setLocation(e.target.value)} 
              className={inputClass} 
            />
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

function EventDetail({ event, onChanged, onBack }: { event: AdminEventResponse; onChanged: () => void; onBack: () => void }) {
  const [showAddSession, setShowAddSession] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(event.sessions[0]?.sessionId ?? null);

  return (
    <div className="flex flex-col gap-6">
      {/* Edit Event Modal */}
      {showEditEvent && (
        <CreateEventModal
          eventToEdit={event}
          onCreated={() => {
            setShowEditEvent(false);
            onChanged();
          }}
          onClose={() => setShowEditEvent(false)}
        />
      )}

      {/* Add Session Modal */}
      {showAddSession && (
        <AddSessionModal
          eventId={event.eventId}
          onCreated={() => {
            setShowAddSession(false);
            onChanged();
          }}
          onClose={() => setShowAddSession(false)}
        />
      )}

      {/* Event Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <button 
              onClick={onBack} 
              className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 active:scale-95"
              title="Back to list"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#1755A7]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#1755A7] uppercase tracking-wider">
                  {event.category.replace(/_/g, " ")}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">{event.title}</h2>
              {event.description && <p className="mt-1 text-xs text-slate-500 max-w-2xl">{event.description}</p>}
              
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#1755A7]" /> 
                  {new Date(event.startsAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {new Date(event.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {event.location && (
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <MapPin className="h-3.5 w-3.5 text-[#1755A7]" /> 
                    {event.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAddSession(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#2563EB] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1D4ED8] transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Add QR Session</span>
            </button>
          </div>
        </div>

        {/* Sessions List */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Event QR Sessions ({event.sessions.length})
          </h3>

          {event.sessions.length === 0 ? (
            <p className="text-xs text-slate-400">No sessions yet. Click "Add QR Session" above to project live attendance QR codes.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {event.sessions.map((s) => (
                <SessionCard
                  key={s.sessionId}
                  session={s}
                  selected={s.sessionId === activeSessionId}
                  onSelect={() => setActiveSessionId(s.sessionId === activeSessionId ? null : s.sessionId)}
                  onChanged={onChanged}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Live QR Projector View */}
      {activeSessionId && (
        <div className="mt-2">
          <LiveQrDisplay sessionId={activeSessionId} />
        </div>
      )}
    </div>
  );
}

function AddSessionModal({ 
  eventId, 
  onCreated, 
  onClose 
}: { 
  eventId: string; 
  onCreated: () => void; 
  onClose: () => void; 
}) {
  const [title, setTitle] = useState("Session 1: Hands-on Attendance");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const create = useMutation({
    mutationFn: () => adminEventsApi.createSession(eventId, { title, startsAt, endsAt }),
    onSuccess: onCreated,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-[#1755A7] via-[#1E40AF] to-[#2563EB] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#F8C401]">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Add Live QR Attendance Session</h3>
              <p className="text-xs text-blue-100">Project dynamic anti-spoofing QR check-in token</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          className="p-6 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          {create.isError && <ErrorBanner error={create.error} />}

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <span>Session Label <span className="text-red-500">*</span></span>
            </label>
            <input 
              required 
              placeholder="E.g. Morning Keynote / Afternoon Lab" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className={inputClass} 
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                <span>Session Starts <span className="text-red-500">*</span></span>
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
                <span>Session Ends <span className="text-red-500">*</span></span>
              </label>
              <input 
                required 
                type="datetime-local" 
                value={endsAt} 
                onChange={(e) => setEndsAt(e.target.value)} 
                className={inputClass} 
              />
            </div>
          </div>

          <div className="mt-2 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#2563EB] px-5 py-2 text-xs font-bold text-white shadow-2xs hover:from-[#124282] hover:to-[#1D4ED8] transition-all active:scale-95 disabled:opacity-50"
            >
              {create.isPending ? "Creating…" : "Save QR Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SessionCard({
  session,
  selected,
  onSelect,
  onChanged,
}: {
  session: AdminEventSessionResponse;
  selected: boolean;
  onSelect: () => void;
  onChanged: () => void;
}) {
  const activate = useMutation({ mutationFn: () => adminEventsApi.activate(session.sessionId), onSuccess: onChanged });
  const deactivate = useMutation({ mutationFn: () => adminEventsApi.deactivate(session.sessionId), onSuccess: onChanged });

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      selected 
        ? "border-[#1755A7] bg-blue-50/20 ring-1 ring-[#1755A7]/40 shadow-xs" 
        : "border-slate-200 bg-white hover:border-slate-300"
    }`}>
      <div className="flex items-center justify-between">
        <button onClick={onSelect} className="text-left flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-slate-900 truncate">{session.title}</span>
            {session.qrActive ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-500">
                Inactive
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-mono">
            {new Date(session.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(session.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </button>

        <div className="flex items-center gap-2 shrink-0 ml-3">
          {session.qrActive ? (
            <button 
              disabled={deactivate.isPending} 
              onClick={() => deactivate.mutate()}
              className="inline-flex items-center gap-1 rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50 active:scale-95"
            >
              <StopCircle className="h-3.5 w-3.5" /> Stop
            </button>
          ) : (
            <button 
              disabled={activate.isPending} 
              onClick={() => activate.mutate()}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50 active:scale-95"
            >
              <PlayCircle className="h-3.5 w-3.5" /> Start QR
            </button>
          )}

          <button
            type="button"
            onClick={onSelect}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors active:scale-95 ${
              selected ? "bg-[#1755A7] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {selected ? "Projecting" : "Project"}
          </button>
        </div>
      </div>
    </div>
  );
}
