"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, CheckCircle2, Globe2, MapPin, Pencil, Plus, RefreshCw, Trash2, Trophy, X, Search } from "lucide-react";
import { externalHackathonsApi, type ExternalHackathon } from "../../lib/api";
import { ErrorBanner } from "../ui/ErrorBanner";
import { Spinner } from "../ui/Spinner";

const SOURCES: { key: string; label: string; badge: string }[] = [
  { key: "ALL", label: "All", badge: "" },
  { key: "DEVPOST", label: "Devpost", badge: "bg-sky-50 text-sky-700 border-sky-200" },
  { key: "UNSTOP", label: "Unstop", badge: "bg-orange-50 text-orange-700 border-orange-200" },
  { key: "DEVFOLIO", label: "Devfolio", badge: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { key: "MANUAL", label: "Added by staff", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7]";

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null;

export interface ExternalHackathonsHandle {
  sync: () => void;
  showAdd: () => void;
  isSyncing: boolean;
}

export const ExternalHackathons = forwardRef<ExternalHackathonsHandle, { canManage: boolean; hideHeaderActions?: boolean }>(
  ({ canManage, hideHeaderActions }, ref) => {
    const queryClient = useQueryClient();
  const [source, setSource] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<ExternalHackathon | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const list = useQuery({ queryKey: ["hackathons", "external"], queryFn: externalHackathonsApi.list });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["hackathons", "external"] });

  const sync = useMutation({
    mutationFn: externalHackathonsApi.sync,
    onSuccess: (r) => {
      refresh();
      setNotice(
        `Found ${r.fetched} AI/LLM hackathons, saved ${r.saved}.` + (r.errors.length ? ` Issues: ${r.errors.join("; ")}` : ""),
      );
    },
  });
  const register = useMutation({
    mutationFn: (id: string) => externalHackathonsApi.register(id),
    onSuccess: (r) => {
      refresh();
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setNotice(r.alreadyRegistered ? "You have already registered for this hackathon." : `Registered! +${r.pointsAwarded} points added to your passport.`);
    },
  });
  const remove = useMutation({ mutationFn: (id: string) => externalHackathonsApi.remove(id), onSuccess: refresh });

  const rows = (list.data ?? []).filter(
    (h) =>
      (source === "ALL" || h.source === source) &&
      (!search.trim() || `${h.title} ${h.organizer ?? ""} ${h.tags.join(" ")}`.toLowerCase().includes(search.toLowerCase())),
  );

  useImperativeHandle(ref, () => ({
    sync: () => sync.mutate(),
    showAdd: () => setShowAdd(true),
    isSyncing: sync.isPending,
  }));

  return (
    <section className="space-y-4">
      {canManage && !hideHeaderActions && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => sync.mutate()}
              disabled={sync.isPending}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${sync.isPending ? "animate-spin" : ""}`} />
              {sync.isPending ? "Fetching..." : "Fetch latest"}
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1755A7] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#134486]"
            >
              <Plus className="h-3.5 w-3.5" /> Add hackathon
            </button>
          </div>
        </div>
      )}

      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">{notice}</div>}
      {sync.error ? <ErrorBanner error={sync.error} /> : null}
      {remove.error ? <ErrorBanner error={remove.error} /> : null}
      {register.error ? <ErrorBanner error={register.error} /> : null}

      <div className="flex flex-wrap items-center gap-4 mt-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, organizer, theme..."
            className={`${inputClass} pl-9 w-full`}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          {SOURCES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSource(s.key)}
              className={`rounded-full border px-3 py-1 text-[11px] font-bold transition-colors ${
                source === s.key ? "border-[#1755A7] bg-[#1755A7] text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {list.isLoading ? (
        <Spinner />
      ) : list.error ? (
        <ErrorBanner error={list.error} />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-xs text-slate-500">
          No hackathons found.{canManage ? " Click \"Fetch latest\" to pull from Devpost, Unstop and Devfolio, or add one yourself." : ""}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((h) => (
            <HackathonCard
              key={h.external_id}
              h={h}
              canManage={canManage}
              onEdit={() => setEditing(h)}
              onDelete={() => {
                if (window.confirm(`Remove "${h.title}" from the portal?`)) remove.mutate(h.external_id);
              }}
              onRegister={() => register.mutate(h.external_id)}
              registering={register.isPending && register.variables === h.external_id}
            />
          ))}
        </div>
      )}

      {(showAdd || editing) && (
        <AddModal
          existing={editing}
          onClose={() => {
            setShowAdd(false);
            setEditing(null);
          }}
          onAdded={() => {
            setShowAdd(false);
            setEditing(null);
            refresh();
          }}
        />
      )}
    </section>
  );
});

function HackathonCard({
  h, canManage, onEdit, onDelete, onRegister, registering,
}: {
  h: ExternalHackathon; canManage: boolean; onEdit: () => void; onDelete: () => void; onRegister: () => void; registering: boolean;
}) {
  const src = SOURCES.find((s) => s.key === h.source);
  const deadline = fmt(h.deadline_at);
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${src?.badge ?? ""}`}>
          {h.source === "MANUAL" ? "Staff pick" : (src?.label ?? h.source)}
        </span>
        {canManage && (
          <div className="flex items-center gap-2.5">
            <button type="button" onClick={onEdit} aria-label="Edit" className="text-slate-400 hover:text-[#1755A7]">
              <Pencil className="h-4 w-4" />
            </button>
            <button type="button" onClick={onDelete} aria-label="Remove" className="text-slate-400 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      <h3 className="mt-3 text-sm font-black leading-snug text-slate-900">{h.title}</h3>
      {h.organizer && <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{h.organizer}</p>}
      {h.description && <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600">{h.description}</p>}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {h.tags.slice(0, 4).map((t) => (
          <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            {t}
          </span>
        ))}
      </div>
      <div className="mt-3 space-y-1 text-[11px] text-slate-500">
        {(h.location || h.is_online) && (
          <div className="flex items-center gap-1.5">
            {h.is_online ? <Globe2 className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
            {h.is_online ? "Online" : h.location}
          </div>
        )}
        {h.prize && (
          <div className="flex items-center gap-1.5 font-semibold text-amber-700">
            <Trophy className="h-3.5 w-3.5" />
            {h.prize}
          </div>
        )}
        {deadline && <div>Closes: <span className="font-semibold text-slate-700">{deadline}</span></div>}
      </div>
      <a
        href={h.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1755A7] px-4 py-2 text-xs font-bold text-white hover:bg-[#134486]"
      >
        View &amp; register <ArrowUpRight className="h-3.5 w-3.5" />
      </a>
      {!canManage && (
        h.registered ? (
          <div className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Registered
          </div>
        ) : (
          <button
            type="button"
            onClick={onRegister}
            disabled={registering}
            className="mt-2 rounded-xl border border-[#1755A7] px-4 py-2 text-xs font-bold text-[#1755A7] hover:bg-blue-50 disabled:opacity-60"
          >
            {registering ? "Saving..." : `I have registered (+${h.register_points} pts)`}
          </button>
        )
      )}
    </div>
  );
}

function AddModal({ existing, onClose, onAdded }: { existing: ExternalHackathon | null; onClose: () => void; onAdded: () => void }) {
  const [f, setF] = useState({
    title: existing?.title ?? "",
    url: existing?.url ?? "",
    organizer: existing?.organizer ?? "",
    location: existing?.location ?? "",
    prize: existing?.prize ?? "",
    tags: existing?.tags.join(", ") ?? "",
    deadlineAt: existing?.deadline_at ? existing.deadline_at.slice(0, 10) : "",
    description: existing?.description ?? "",
    isOnline: existing?.is_online ?? false,
    registerPoints: existing?.register_points ?? 20,
  });
  const set = (k: keyof typeof f, v: string | boolean | number) => setF((p) => ({ ...p, [k]: v }));

  const add = useMutation({
    mutationFn: () => {
      const body = {
        title: f.title,
        url: f.url,
        organizer: f.organizer,
        location: f.location,
        prize: f.prize,
        description: f.description,
        isOnline: f.isOnline,
        tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean),
        registerPoints: f.registerPoints,
        ...(f.deadlineAt ? { deadlineAt: new Date(f.deadlineAt).toISOString() } : {}),
      };
      return existing ? externalHackathonsApi.update(existing.external_id, body) : externalHackathonsApi.add(body);
    },
    onSuccess: onAdded,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          add.mutate();
        }}
        className="max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">{existing ? "Edit hackathon" : "Add a hackathon"}</h3>
          <button type="button" onClick={onClose} aria-label="Close"><X className="h-4 w-4 text-slate-500" /></button>
        </div>
        {add.error ? <ErrorBanner error={add.error} /> : null}
        <input required placeholder="Title *" value={f.title} onChange={(e) => set("title", e.target.value)} className={inputClass} />
        <input required type="url" placeholder="Link to register (https://...) *" value={f.url} onChange={(e) => set("url", e.target.value)} className={inputClass} />
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Organizer" value={f.organizer} onChange={(e) => set("organizer", e.target.value)} className={inputClass} />
          <input placeholder="Prize (e.g. INR 1,00,000)" value={f.prize} onChange={(e) => set("prize", e.target.value)} className={inputClass} />
          <input placeholder="Location" value={f.location} onChange={(e) => set("location", e.target.value)} className={inputClass} />
          <input type="date" title="Registration / event deadline" value={f.deadlineAt} onChange={(e) => set("deadlineAt", e.target.value)} className={inputClass} />
        </div>
        <input placeholder="Themes, comma separated (LLM, Agents...)" value={f.tags} onChange={(e) => set("tags", e.target.value)} className={inputClass} />
        <textarea rows={3} placeholder="Short description" value={f.description} onChange={(e) => set("description", e.target.value)} className={inputClass} />
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          Points for students who register
          <input type="number" min={0} max={1000} value={f.registerPoints} onChange={(e) => set("registerPoints", Number(e.target.value))} className={`${inputClass} w-24`} />
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <input type="checkbox" checked={f.isOnline} onChange={(e) => set("isOnline", e.target.checked)} /> Online event
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={add.isPending} className="rounded-xl bg-[#1755A7] px-4 py-2 text-xs font-bold text-white hover:bg-[#134486] disabled:opacity-60">
            {add.isPending ? "Saving..." : existing ? "Save changes" : "Add hackathon"}
          </button>
        </div>
      </form>
    </div>
  );
}
