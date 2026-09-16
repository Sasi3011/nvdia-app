"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsoleCard } from "../../../components/console/ConsoleCard";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { LiveQrDisplay } from "../../../components/admin/LiveQrDisplay";
import { Button } from "../../../components/ui/Button";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { adminEventsApi, type AdminEventResponse, type AdminEventSessionResponse } from "../../../lib/api";
import { Calendar, Clock, MapPin, Plus, QrCode, StopCircle, PlayCircle, Layers, ArrowLeft } from "lucide-react";

export default function AdminEventsPage() {
  const queryClient = useQueryClient();
  const events = useQuery({ queryKey: ["admin", "events"], queryFn: adminEventsApi.list });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const selected = events.data?.find((e) => e.eventId === selectedId) ?? null;

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader
        title="Event & QR Management"
        description="Create live events and manage their attendance QR sessions."
        actions={
          <button 
            onClick={() => setShowCreate((v) => !v)}
            className="flex items-center gap-2 rounded-lg bg-[#1A56DB] px-4 py-2 text-[14px] font-medium text-white transition-all hover:bg-[#1E429F]"
          >
            {showCreate ? "Cancel" : <><Plus className="h-4 w-4" /> New event</>}
          </button>
        }
      />

      {showCreate ? (
        <CreateEventForm
          onCreated={() => {
            setShowCreate(false);
            queryClient.invalidateQueries({ queryKey: ["admin", "events"] });
          }}
        />
      ) : null}

      {events.isLoading ? (
        <Spinner />
      ) : events.isError ? (
        <ErrorBanner error={events.error} />
      ) : !events.data || events.data.length === 0 ? (
        <p className="mt-4 text-[14px] text-text-muted">No events yet.</p>
      ) : selected ? (
        <div className="mt-6">
          <EventDetail event={selected} onChanged={() => queryClient.invalidateQueries({ queryKey: ["admin", "events"] })} onBack={() => setSelectedId(null)} />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-surface-muted text-[12px] font-bold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-6 py-4">Event Name</th>
                <th className="px-6 py-4">Category & Location</th>
                <th className="px-6 py-4">Schedule</th>
                <th className="px-6 py-4 text-center">Sessions</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.data.map((e) => (
                <tr key={e.eventId} className="group transition-colors hover:bg-blue-50/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1A56DB]/10 text-[#1A56DB]">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <span className="font-bold text-ink">{e.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-start gap-1">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-bold uppercase text-gray-600">{e.category.replace(/_/g, " ")}</span>
                      {e.location ? <span className="flex items-center gap-1.5 text-[12px] font-medium text-text-muted"><MapPin className="h-3.5 w-3.5" /> {e.location}</span> : null}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1.5 font-medium text-ink"><Clock className="h-4 w-4 text-gray-400" /> {new Date(e.startsAt).toLocaleDateString()}</span>
                      <span className="text-[12px] text-text-muted">{new Date(e.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(e.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted font-bold text-ink">{e.sessions.length}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedId(e.eventId)}
                      className="inline-flex items-center justify-center rounded-lg bg-[#1A56DB] px-5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-[#1E429F]"
                    >
                      Manage
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

function CreateEventForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("tech_eve_masterclass");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const create = useMutation({
    mutationFn: () => adminEventsApi.create({ title, category, location: location || undefined, startsAt, endsAt }),
    onSuccess: onCreated,
  });

  return (
    <ConsoleCard className="mb-8 rounded-2xl border-border bg-white shadow-sm p-6">
      <h3 className="mb-4 text-[18px] font-bold text-ink">Create New Event</h3>
      <form
        className="grid grid-cols-1 gap-4 tablet:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        {create.isError ? (
          <div className="tablet:col-span-2">
            <ErrorBanner error={create.error} />
          </div>
        ) : null}
        
        <div className="flex flex-col gap-1.5 tablet:col-span-2">
          <label className="text-[13px] font-bold text-ink">Event Title</label>
          <input required placeholder="E.g. AI Masterclass 2026" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-ink">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            <option value="tech_eve_masterclass">Tech Eve / Masterclass attendance</option>
            <option value="gpu_friday_lab">GPU Hands-on Friday Lab</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-ink">Location</label>
          <input placeholder="Room 101 or Virtual" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-ink">Start Time</label>
          <input required type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-ink">End Time</label>
          <input required type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputClass} />
        </div>

        <div className="mt-2 flex justify-end tablet:col-span-2">
          <Button type="submit" variant="primary" disabled={create.isPending} className="w-full tablet:w-auto">
            {create.isPending ? "Creating…" : "Create Event"}
          </Button>
        </div>
      </form>
    </ConsoleCard>
  );
}

function EventDetail({ event, onChanged, onBack }: { event: AdminEventResponse; onChanged: () => void; onBack: () => void }) {
  const [showAddSession, setShowAddSession] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <ConsoleCard className="rounded-2xl border-border bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-4 tablet:flex-row tablet:items-start tablet:justify-between">
          <div className="flex items-start gap-4">
            <button 
              onClick={onBack} 
              className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-muted transition-colors hover:bg-gray-200"
              title="Back to list"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-[22px] font-bold text-ink">{event.title}</h2>
              {event.description ? <p className="mt-2 text-[14px] text-text-muted">{event.description}</p> : null}
              <div className="mt-4 flex items-center gap-4 text-[13px] font-medium text-text-muted">
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-[#1A56DB]" /> {new Date(event.startsAt).toLocaleDateString()}</span>
                {event.location ? <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-[#1A56DB]" /> {event.location}</span> : null}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowAddSession((v) => !v)}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-surface-muted px-4 py-2 text-[13px] font-bold text-ink transition-colors hover:bg-gray-200"
          >
            {showAddSession ? "Cancel" : <><Plus className="h-4 w-4" /> Add session</>}
          </button>
        </div>

        {showAddSession ? (
          <AddSessionForm eventId={event.eventId} onCreated={() => { setShowAddSession(false); onChanged(); }} />
        ) : null}

        <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6">
          <h3 className="mb-2 text-[16px] font-bold text-ink">Sessions ({event.sessions.length})</h3>
          {event.sessions.length === 0 ? (
            <p className="text-[14px] text-text-muted">No sessions yet. Add one to start generating attendance QRs.</p>
          ) : (
            event.sessions.map((s) => (
              <SessionRow
                key={s.sessionId}
                session={s}
                selected={s.sessionId === activeSessionId}
                onSelect={() => setActiveSessionId(s.sessionId === activeSessionId ? null : s.sessionId)}
                onChanged={onChanged}
              />
            ))
          )}
        </div>
      </ConsoleCard>

      {activeSessionId ? <LiveQrDisplay sessionId={activeSessionId} /> : null}
    </div>
  );
}

function AddSessionForm({ eventId, onCreated }: { eventId: string; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const create = useMutation({
    mutationFn: () => adminEventsApi.createSession(eventId, { title, startsAt, endsAt }),
    onSuccess: onCreated,
  });

  return (
    <form
      className="mt-4 flex flex-col gap-4 rounded-xl border border-border bg-surface-muted/30 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        create.mutate();
      }}
    >
      <h4 className="text-[14px] font-bold text-ink">New Session</h4>
      {create.isError ? <ErrorBanner error={create.error} /> : null}
      
      <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
        <div className="flex flex-col gap-1.5 tablet:col-span-2">
          <input required placeholder="Session title (e.g. Morning Keynote)" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <input required type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <input required type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputClass} />
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={create.isPending}>
          {create.isPending ? "Adding…" : "Save Session"}
        </Button>
      </div>
    </form>
  );
}

function SessionRow({
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
    <div className={`flex flex-col gap-4 tablet:flex-row tablet:items-center tablet:justify-between rounded-xl border p-4 transition-all ${
      selected ? "border-[#1A56DB] bg-blue-50/30 ring-1 ring-[#1A56DB]" : "border-border bg-white hover:border-gray-300"
    }`}>
      <button onClick={onSelect} className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <div className="text-[15px] font-bold text-ink">{session.title}</div>
          {session.qrActive ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex items-center gap-2 text-[13px] font-medium text-text-muted">
          <Clock className="h-3.5 w-3.5" />
          {new Date(session.startsAt).toLocaleString()}
        </div>
      </button>
      
      <div className="flex items-center gap-3 border-t border-border pt-3 tablet:border-none tablet:pt-0">
        {session.qrActive ? (
          <button 
            disabled={deactivate.isPending} 
            onClick={() => deactivate.mutate()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-[13px] font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 tablet:w-auto"
          >
            <StopCircle className="h-4 w-4" /> Stop QR
          </button>
        ) : (
          <button 
            disabled={activate.isPending} 
            onClick={() => activate.mutate()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-[13px] font-bold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50 tablet:w-auto"
          >
            <PlayCircle className="h-4 w-4" /> Start QR
          </button>
        )}
      </div>
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-border bg-white px-3 py-2.5 text-[14px] text-ink placeholder:text-gray-400 focus:border-[#1A56DB] focus:outline-none focus:ring-1 focus:ring-[#1A56DB]";
