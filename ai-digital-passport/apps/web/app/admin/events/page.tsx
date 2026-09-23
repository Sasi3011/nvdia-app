"use client";

import { useState, useEffect, useRef } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { LiveQrDisplay } from "../../../components/admin/LiveQrDisplay";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { useConfirm } from "../../../components/ui/ConfirmDialogProvider";
import { QR_REFRESH_SECONDS } from "@ai-digital-passport/shared-types";
import { adminEventsApi, adminScoringApi, type AdminEventInput, type AdminEventResponse, type AdminEventSessionResponse } from "../../../lib/api";
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
  Filter,
  Sliders,
  ChevronDown,
  Trash2,
  Eye,
  Share2
} from "lucide-react";
import { CustomSelect } from "../../../components/ui/CustomSelect";
import { CustomDateTimePicker } from "../../../components/ui/CustomDateTimePicker";

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7] transition-colors";
const labelClass = "text-xs font-bold text-slate-700 flex items-center gap-1.5";

const YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const VENUE_OPTIONS = ["IT Centre", "Code Studio", "Collab Space", "Full Stack Lab"];

// "YYYY-MM-DDTHH:mm" in the browser's local time, which is what the date picker works in.
function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function EventActions({ e, onView, onEdit, onDelete }: { e: AdminEventResponse; onView: () => void; onEdit: () => void; onDelete: () => void }) {
  const btn = "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white transition-all";
  return (
    <div className="flex items-center justify-end gap-2">
      <button type="button" onClick={onView} className={`${btn} hover:bg-slate-50 hover:border-slate-300`} title="View" aria-label="View class">
        <Eye className="h-3.5 w-3.5 text-slate-500" />
      </button>
      <button
        type="button"
        onClick={() => {
          const eventDate = new Date(e.startsAt).toLocaleDateString();
          const eventTime = new Date(e.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const venue = e.location ? `\nVenue: ${e.location}` : "";
          const text = `Join the upcoming event: ${e.title}\nDate: ${eventDate}\nTime: ${eventTime}${venue}`;
          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
        }}
        className={`${btn} hover:bg-[#25D366]/10 hover:border-[#25D366]/30`}
        title="Share via WhatsApp"
        aria-label="Share via WhatsApp"
      >
        <Share2 className="h-3.5 w-3.5 text-[#25D366]" />
      </button>
      <button type="button" onClick={onEdit} className={`${btn} hover:bg-slate-50`} title="Edit" aria-label="Edit class">
        <Sliders className="h-3.5 w-3.5 text-[#1755A7]" />
      </button>
      <button type="button" onClick={onDelete} className={`${btn} hover:bg-red-50 hover:border-red-200`} title="Delete" aria-label="Delete class">
        <Trash2 className="h-3.5 w-3.5 text-red-500" />
      </button>
    </div>
  );
}

export default function AdminEventsPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const events = useQuery({ queryKey: ["admin", "events"], queryFn: adminEventsApi.list });

  // A CoE Class edit/create/delete needs to show up everywhere it's read
  // from: the admin list itself, every mentor's "log a class" event picker,
  // and both the admin and mentor teaching-log tables (they embed the
  // event's title/department/year). Invalidating by these key prefixes
  // covers every one of those query keys in this session.
  const invalidateEventRelated = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "events"] });
    queryClient.invalidateQueries({ queryKey: ["mentor", "coe-classes"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "coe-classes"] });
  };

  const remove = useMutation({
    mutationFn: (eventId: string) => adminEventsApi.delete(eventId),
    onSuccess: invalidateEventRelated,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AdminEventResponse | null>(null);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [yearFilter, setYearFilter] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const list = events.data ?? [];
  const selected = list.find((e) => e.eventId === selectedId) ?? null;

  const totalSessions = list.reduce((acc, e) => acc + (e.sessions?.length || 0), 0);
  const activeSessions = list.reduce((acc, e) => acc + (e.sessions?.filter(s => s.qrActive)?.length || 0), 0);

  const now = Date.now();
  const upcomingEvents = list.filter((e) => new Date(e.startsAt).getTime() > now).length;
  const totalCheckIns = list.reduce((acc, e) => acc + (e.checkIns ?? 0), 0);
  const classesWithCheckIns = list.filter((e) => (e.checkIns ?? 0) > 0).length;

  const filteredEvents = list.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) || 
                          e.category.toLowerCase().includes(search.toLowerCase()) ||
                          (e.location && e.location.toLowerCase().includes(search.toLowerCase()));
    
    const eventYear = e.year ?? "";
    const matchesYear = yearFilter ? eventYear === yearFilter : true;
    
    return matchesSearch && matchesYear;
  });

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader
        title="CoE Classes & Dynamic QR Sessions"
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
            invalidateEventRelated();
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
          onChanged={invalidateEventRelated}
          onClose={() => setSelectedId(null)} 
        />
      )}

      {/* Top 3 Event Management Metric Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Card 1: Scheduled Events */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#1755A7] via-[#2563EB] to-[#38BDF8]" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold text-slate-500">Scheduled Events</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1755A7]/15 to-[#2563EB]/10 text-[#1755A7]">
              <Calendar className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{list.length}</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
              {upcomingEvents} upcoming
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Total Check-in Sessions:</span>
            <span className="font-bold text-slate-800">{totalSessions} Sessions</span>
          </div>
        </div>

        {/* Card 2: Live QR Projectors */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold text-slate-500">Live QR Projectors</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-400/10 text-emerald-600">
              <Radio className="h-4.5 w-4.5 animate-pulse" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{activeSessions}</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Broadcasting
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Dynamic Key Refresh:</span>
            <span className="font-bold text-[#1755A7]">Every {QR_REFRESH_SECONDS} Seconds</span>
          </div>
        </div>

        {/* Card 3: Total Attendance */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#F8C401] via-amber-500 to-orange-500" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold text-slate-500">Total Check-ins</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 text-amber-600">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{totalCheckIns.toLocaleString()}</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
              Verified Scans
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Classes with check-ins:</span>
            <span className="font-bold text-slate-800">{classesWithCheckIns} of {list.length}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      {!selected && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search scheduled events or venues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7]"
            />
          </div>
          
          <div ref={filterRef} className="relative ml-auto">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex w-36 items-center justify-between gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold shadow-xs transition-colors ${showFilters || yearFilter ? "border-[#1755A7] bg-[#1755A7]/5 text-[#1755A7]" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" /> 
                Filters {yearFilter && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1755A7] text-[9px] text-white">1</span>}
              </div>
              <ChevronDown className="h-3 w-3 opacity-50 ml-1" />
            </button>
            
            {showFilters && (
              <div className="absolute right-0 top-full mt-2 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-10">
                <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Filter by Year</div>
                <button
                  onClick={() => { setYearFilter(null); setShowFilters(false); }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${!yearFilter ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  All Years
                </button>
                {YEAR_OPTIONS.map(year => (
                  <button
                    key={year}
                    onClick={() => { setYearFilter(year); setShowFilters(false); }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${yearFilter === year ? "bg-[#1755A7]/10 text-[#1755A7]" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {remove.isError && <div className="mt-4"><ErrorBanner error={remove.error} /></div>}

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
        <>
        <div className="mt-6 space-y-3 md:hidden">
          {filteredEvents.map((e) => (
            <div key={e.eventId} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 break-words text-[13px] font-bold text-slate-900">{e.title}</h3>
                <span className="inline-flex shrink-0 min-w-[28px] items-center justify-center rounded-md border border-emerald-200/50 bg-emerald-100/50 px-2 py-1 font-mono text-[11px] font-bold text-emerald-600" title="Checked in">
                  {e.checkIns ?? 0}
                </span>
              </div>
              <div className="mt-2 space-y-1 text-[11px] font-semibold text-slate-600">
                <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-400" />{new Date(e.startsAt).toLocaleDateString()}{e.year ? ` · ${e.year}` : ""}</div>
                <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-slate-400" />
                  {new Date(e.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(e.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {e.sessionType ? ` · ${e.sessionType === "Forenoon" ? "FN" : "AN"}` : ""}
                </div>
                <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#1755A7]" />{e.location || "-"}</div>
              </div>
              <div className="mt-3 border-t border-slate-100 pt-3">
                <EventActions
                  e={e}
                  onView={() => setSelectedId(e.eventId)}
                  onEdit={() => setEditingEvent(e)}
                  onDelete={async () => { if (await confirm({ message: "Are you sure you want to delete this event?", confirmLabel: "Delete" })) remove.mutate(e.eventId); }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Title</th>
                <th className="px-6 py-3.5">Year</th>
                <th className="px-6 py-3.5">Venue & Location</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Time</th>
                <th className="px-6 py-3.5 text-center">Attendance</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.map((e) => (
                <tr key={e.eventId} className="hover:bg-slate-50/40 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-start gap-3.5">
                      <div>
                        <span className="font-bold text-slate-900 text-[13px] text-left truncate max-w-[200px] block" title={e.title}>
                          {e.title.length > 20 ? e.title.substring(0, 20) + "..." : e.title}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <span className="text-xs font-bold text-slate-900">
                      {e.year || "-"}
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <MapPin className="h-3.5 w-3.5 text-[#1755A7]" />
                      {e.location || "-"}
                    </span>
                  </td>

                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {new Date(e.startsAt).toLocaleDateString()}
                    </div>
                  </td>

                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-slate-900 font-bold">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        {new Date(e.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(e.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="inline-flex items-center rounded bg-[#1755A7]/10 px-1.5 py-0.5 text-[10px] font-black uppercase text-[#1755A7]">
                        {e.sessionType ? (e.sessionType === "Forenoon" ? "FN" : "AN") : ""}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-5 text-center">
                    <span className="inline-flex min-w-[28px] items-center justify-center rounded-md border border-emerald-200/50 bg-emerald-100/50 px-2 py-1 font-mono text-[11px] font-bold text-emerald-600" title="Checked in">
                      {e.checkIns ?? 0}
                    </span>
                  </td>

                  <td className="px-6 py-5 text-right">
                    <EventActions
                      e={e}
                      onView={() => setSelectedId(e.eventId)}
                      onEdit={() => setEditingEvent(e)}
                      onDelete={async () => { if (await confirm({ message: "Are you sure you want to delete this event?", confirmLabel: "Delete" })) remove.mutate(e.eventId); }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
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
  const rules = useQuery({ queryKey: ["admin", "scoring", "rules"], queryFn: adminScoringApi.listRules });
  const eventRules = (rules.data ?? []).filter((r) => r.category !== "hackathon_registration");
  const [title, setTitle] = useState(eventToEdit?.title ?? "");
  const category = eventToEdit?.category || eventRules[0]?.category || "";
  const noCategory = !rules.isLoading && !category;
  const [sessionType, setSessionType] = useState(eventToEdit?.sessionType ?? "Forenoon");
  const [year, setYear] = useState(eventToEdit?.year ?? "");
  const [location, setLocation] = useState(eventToEdit?.location ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const [description, setDescription] = useState(eventToEdit?.description ?? "");
  const [startsAt, setStartsAt] = useState(eventToEdit?.startsAt ? toLocalInput(eventToEdit.startsAt) : "");
  const [endsAt, setEndsAt] = useState(eventToEdit?.endsAt ? toLocalInput(eventToEdit.endsAt) : "");

  const create = useMutation({
    mutationFn: () => {
      const payload: Partial<AdminEventInput> = {
        title,
        category,
        location: location || undefined,
        year: year || undefined,
        sessionType: sessionType || undefined,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        description,
      };
      return eventToEdit
        ? adminEventsApi.update(eventToEdit.eventId, payload)
        : adminEventsApi.create(payload as AdminEventInput);
    },
    onSuccess: onCreated,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-[#1755A7] via-[#1E40AF] to-[#2563EB] px-4 py-4 text-white sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#F8C401]">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">{eventToEdit ? "Edit Institutional Event" : "Schedule New Institutional Event"}</h3>
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
          className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 pb-8 minute-scrollbar sm:grid-cols-6 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (noCategory) {
              setFormError("No scoring category is configured yet. Add one in Scoring Matrix before scheduling a class.");
              return;
            }
            if (!sessionType || !year || !location || !startsAt || !endsAt) {
              setFormError("Please fill in all mandatory fields (Session Type, Year, Venue, Start and End time).");
              return;
            }
            if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
              setFormError("End time must be after the start time.");
              return;
            }
            setFormError(null);
            create.mutate();
          }}
        >
          {noCategory && !formError && (
            <div className="sm:col-span-6 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              No scoring category exists yet, so classes cannot be scheduled. Add one under Scoring Matrix first.
            </div>
          )}
          {formError && (
            <div className="sm:col-span-6 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{formError}</div>
          )}
          {create.isError && (
            <div className="sm:col-span-6">
              <ErrorBanner error={create.error} />
            </div>
          )}
          
          <div className="flex flex-col gap-1.5 sm:col-span-6">
            <label className={labelClass}>
              <span>Event Title <span className="text-red-500">*</span></span>
            </label>
            <input 
              required 
              placeholder="E.g. NVIDIA TensorRT-LLM Masterclass & Deployment Lab" 
              value={title} 
              onChange={(e) => {
                const val = e.target.value;
                setTitle(val ? val.charAt(0).toUpperCase() + val.slice(1) : "");
              }} 
              className={inputClass} 
            />
          </div>



          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className={labelClass}>
              <span>Session Type <span className="text-red-500">*</span></span>
            </label>
            <CustomSelect
              value={sessionType}
              onChange={setSessionType}
              options={[
                { label: "Forenoon", value: "Forenoon" },
                { label: "Afternoon", value: "Afternoon" }
              ]}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className={labelClass}>
              <span>Year <span className="text-red-500">*</span></span>
            </label>
            <CustomSelect
              value={year}
              onChange={setYear}
              options={[
                { label: "Select Year...", value: "" },
                ...YEAR_OPTIONS.map((y) => ({ label: y, value: y })),
              ]}
            />
          </div>



          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className={labelClass}>
              <span>Venue / Lab Location <span className="text-red-500">*</span></span>
            </label>
            <CustomSelect
              value={location}
              onChange={setLocation}
              options={[
                { label: "Select Venue...", value: "" },
                ...VENUE_OPTIONS.map((v) => ({ label: v, value: v })),
              ]}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-3">
            <label className={labelClass}>
              <span>Starts At <span className="text-red-500">*</span></span>
            </label>
            <CustomDateTimePicker
              value={startsAt}
              onChange={setStartsAt}
              className="h-10"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-3">
            <label className={labelClass}>
              <span>Ends At <span className="text-red-500">*</span></span>
            </label>
            <CustomDateTimePicker
              value={endsAt}
              onChange={setEndsAt}
              className="h-10"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-6">
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
          <div className="mt-2 flex flex-col-reverse gap-3 border-t border-slate-100 pt-3 sm:col-span-6 sm:flex-row sm:items-center sm:justify-end">
            <button 
              type="button" 
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors active:scale-95 sm:py-2.5"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={create.isPending || noCategory}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#2563EB] px-6 py-3 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1E40AF] transition-all disabled:opacity-50 active:scale-95 sm:py-2.5"
            >
              {create.isPending
                ? eventToEdit ? "Saving Changes..." : "Creating Event..."
                : eventToEdit ? "Save Changes" : "Create & Schedule Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EventDetailModal({ event, onChanged, onClose }: { event: AdminEventResponse; onChanged: () => void; onClose: () => void }) {
  const sessionId = event.sessions[0]?.sessionId;
  const [activeTab, setActiveTab] = useState<"QR" | "ROSTER">("QR");
  const roster = useQuery({
    queryKey: ["admin", "events", "roster", event.eventId],
    queryFn: () => adminEventsApi.roster(event.eventId),
    enabled: activeTab === "ROSTER",
  });
  const rosterRows = roster.data ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 bg-white px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="break-words text-base font-bold text-slate-900 sm:text-lg">{event.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1 rounded-full bg-[#1755A7]/10 px-2 py-0.5 text-[10px] font-bold text-[#1755A7] uppercase">
                {event.sessionType || "Class"}
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
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-slate-50 p-4 sm:p-6">
          {event.description && (
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shrink-0">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Event Agenda & Description</h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6 flex shrink-0 items-center gap-4 overflow-x-auto border-b border-slate-200">
            <button
              onClick={() => setActiveTab("QR")}
              className={`pb-2.5 text-xs font-bold transition-colors border-b-2 ${activeTab === "QR" ? "border-[#1755A7] text-[#1755A7]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              Live QR Check-in
            </button>
            <button
              onClick={() => setActiveTab("ROSTER")}
              className={`pb-2.5 text-xs font-bold transition-colors border-b-2 ${activeTab === "ROSTER" ? "border-[#1755A7] text-[#1755A7]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              Attendance Roster
            </button>
          </div>

          {activeTab === "QR" ? (
            sessionId ? (
              <div className="w-full">
                <LiveQrDisplay sessionId={sessionId} startsAt={event.startsAt} endsAt={event.endsAt} />
              </div>
            ) : (
              <div className="text-center p-12 bg-white rounded-xl border border-slate-200 shadow-sm mt-4">
                <QrCode className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <p className="text-sm font-bold text-slate-700">No QR session available for this event.</p>
                <p className="text-xs text-slate-400 mt-1">Contact an administrator to initialize the QR session.</p>
              </div>
            )
          ) : (
            <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-xs font-bold text-slate-700">Student Attendance List</h3>
                <span className="text-[11px] font-bold text-slate-500">{rosterRows.length} checked in</span>
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full min-w-[520px] text-left text-xs">
                  <thead className="bg-white sticky top-0 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500 shadow-sm">
                    <tr>
                      <th className="px-6 py-3">Student Name</th>
                      <th className="px-6 py-3">Roll No</th>
                      <th className="px-6 py-3">Department</th>
                      <th className="px-6 py-3 text-right">Check-in Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {roster.isLoading ? (
                      <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">Loading...</td></tr>
                    ) : rosterRows.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">No check-ins yet.</td></tr>
                    ) : (
                      rosterRows.map((r) => (
                        <tr key={r.userId} className="hover:bg-slate-50/50">
                          <td className="px-6 py-3 font-bold text-slate-800">{r.fullName}</td>
                          <td className="px-6 py-3 text-slate-500 font-medium">{r.registerNum}</td>
                          <td className="px-6 py-3 text-slate-500 font-medium">{r.department}</td>
                          <td className="px-6 py-3 text-right text-slate-500 font-medium">
                            {new Date(r.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
