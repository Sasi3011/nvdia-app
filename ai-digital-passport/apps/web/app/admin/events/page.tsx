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

// Page 25 — Event & QR Management (spec 02 Section 6.4).
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
          <Button variant="primary" onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? "Cancel" : "New event"}
          </Button>
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
        <p className="mt-4 text-body text-text-muted">No events yet.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-6 desktop:grid-cols-2">
          <ConsoleCard className="divide-y divide-navy-700 p-0">
            {events.data.map((e) => (
              <button
                key={e.eventId}
                onClick={() => setSelectedId(e.eventId)}
                className={"flex w-full items-center justify-between px-6 py-4 text-left hover:bg-surface-muted " + (e.eventId === selectedId ? "bg-surface-muted" : "")}
              >
                <div>
                  <div className="text-body text-ink">{e.title}</div>
                  <div className="font-mono text-caption text-text-muted">
                    {e.category.replace(/_/g, " ")} · {new Date(e.startsAt).toLocaleDateString()} · {e.sessions.length} session
                    {e.sessions.length === 1 ? "" : "s"}
                  </div>
                </div>
              </button>
            ))}
          </ConsoleCard>

          {selected ? (
            <EventDetail event={selected} onChanged={() => queryClient.invalidateQueries({ queryKey: ["admin", "events"] })} />
          ) : (
            <p className="text-body text-text-muted">Select an event to manage its sessions.</p>
          )}
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
    <ConsoleCard className="mb-6">
      <form
        className="grid grid-cols-1 gap-3 tablet:grid-cols-2"
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
        <input required placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
          <option value="tech_eve_masterclass">Tech Eve / Masterclass attendance</option>
          <option value="gpu_friday_lab">GPU Hands-on Friday Lab</option>
        </select>
        <input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
        <input required type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputClass} />
        <input required type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputClass} />
        <Button type="submit" variant="primary" disabled={create.isPending} className="tablet:col-span-2">
          {create.isPending ? "Creating…" : "Create event"}
        </Button>
      </form>
    </ConsoleCard>
  );
}

function EventDetail({ event, onChanged }: { event: AdminEventResponse; onChanged: () => void }) {
  const [showAddSession, setShowAddSession] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <ConsoleCard>
        <div className="flex items-center justify-between">
          <h2 className="text-h2 text-ink">{event.title}</h2>
          <Button variant="secondary" onClick={() => setShowAddSession((v) => !v)}>
            {showAddSession ? "Cancel" : "Add session"}
          </Button>
        </div>
        {event.description ? <p className="mt-2 text-body text-text-muted">{event.description}</p> : null}

        {showAddSession ? (
          <AddSessionForm eventId={event.eventId} onCreated={() => { setShowAddSession(false); onChanged(); }} />
        ) : null}

        <div className="mt-4 flex flex-col gap-2">
          {event.sessions.length === 0 ? (
            <p className="text-body text-text-muted">No sessions yet.</p>
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
      className="mt-4 flex flex-col gap-3 border-t border-navy-700 pt-4"
      onSubmit={(e) => {
        e.preventDefault();
        create.mutate();
      }}
    >
      {create.isError ? <ErrorBanner error={create.error} /> : null}
      <input required placeholder="Session title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
      <input required type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputClass} />
      <input required type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputClass} />
      <Button type="submit" variant="primary" disabled={create.isPending}>
        {create.isPending ? "Adding…" : "Add session"}
      </Button>
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
    <div className={"flex items-center justify-between rounded-card border border-navy-700 px-4 py-3 " + (selected ? "bg-surface-muted" : "")}>
      <button onClick={onSelect} className="text-left">
        <div className="text-body text-ink">{session.title}</div>
        <div className="font-mono text-caption text-text-muted">{new Date(session.startsAt).toLocaleString()}</div>
      </button>
      <div className="flex items-center gap-2">
        <span className={"text-caption " + (session.qrActive ? "text-accent" : "text-text-muted")}>
          {session.qrActive ? "QR active" : "Inactive"}
        </span>
        {session.qrActive ? (
          <Button variant="destructive" disabled={deactivate.isPending} onClick={() => deactivate.mutate()}>
            Stop
          </Button>
        ) : (
          <Button variant="primary" disabled={activate.isPending} onClick={() => activate.mutate()}>
            Start
          </Button>
        )}
      </div>
    </div>
  );
}

const inputClass = "rounded-card border border-border bg-surface px-3 py-2 text-body text-ink placeholder:text-text-muted";
