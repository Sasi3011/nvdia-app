"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, CheckCircle2, Clock, XCircle, Upload, Globe2, MapPin, Pencil, Plus, RefreshCw, Trash2, Trophy, X, Search, Medal, Users, UserPlus } from "lucide-react";
import {
  externalHackathonsApi,
  type ExternalHackathon,
  type HackathonResponse,
  type HackathonResultType,
  type HackathonTeamMember,
} from "../../lib/api";
import { useSession } from "../../lib/session";
import { ErrorBanner } from "../ui/ErrorBanner";
import { Spinner } from "../ui/Spinner";
import { useConfirm } from "../ui/ConfirmDialogProvider";
import { safeUrl } from "../../lib/safe-url";

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

export const ExternalHackathons = forwardRef<ExternalHackathonsHandle, { canManage: boolean; hideHeaderActions?: boolean; internalHackathons?: HackathonResponse[]; onRegisterInternal?: (h: HackathonResponse) => void }>(
  ({ canManage, hideHeaderActions, internalHackathons = [], onRegisterInternal }, ref) => {
    const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [source, setSource] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<ExternalHackathon | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const list = useQuery({ queryKey: ["hackathons", "external"], queryFn: externalHackathonsApi.list, refetchInterval: 60 * 60 * 1000 });
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
  const [proofFor, setProofFor] = useState<ExternalHackathon | null>(null);
  const [resultFor, setResultFor] = useState<{ h: ExternalHackathon; type: HackathonResultType } | null>(null);
  const register = useMutation({
    mutationFn: async ({ id, link, teamName, teamMembers }: { id: string; link: string; teamName: string; teamMembers: HackathonTeamMember[] }) =>
      externalHackathonsApi.register(id, { proofType: "DOI_LINK", proofUrl: link, teamName, teamMembers }),
    onSuccess: (r) => {
      refresh();
      setProofFor(null);
      setNotice(
        r.alreadyRegistered
          ? "You have already submitted proof for this hackathon."
          : "Registration submitted! Faculty will verify your proof. Once approved, you can submit your participation or winner proof.",
      );
    },
  });
  const submitResult = useMutation({
    mutationFn: ({ id, type, link }: { id: string; type: HackathonResultType; link: string }) =>
      externalHackathonsApi.submitResult(id, { resultType: type, proofType: "DOI_LINK", proofUrl: link }),
    onSuccess: (r) => {
      refresh();
      setResultFor(null);
      setNotice(
        r.alreadySubmitted
          ? "You have already submitted a result proof for this hackathon."
          : "Proof submitted! Faculty will verify it, and you'll get points once it is approved.",
      );
    },
  });
  const remove = useMutation({ mutationFn: (id: string) => externalHackathonsApi.remove(id), onSuccess: refresh });

  const combined = [
    ...(list.data ?? []),
    ...internalHackathons.map((h) => ({ ...h, isInternal: true as const })),
  ];

  const rows = combined.filter((h) => {
    const isInternal = "isInternal" in h;
    const hSource = isInternal ? "MANUAL" : h.source;
    const hTitle = h.title;
    const hOrganizer = isInternal ? "Internal" : (h.organizer ?? "");
    const hTags = isInternal ? h.problems.map((p) => p.title) : h.tags;

    if (source !== "ALL" && hSource !== source) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!`${hTitle} ${hOrganizer} ${hTags.join(" ")}`.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

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
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((item) => {
            if ("isInternal" in item) {
              return (
                <InternalHackathonCard
                  key={item.hackathon_id}
                  hackathon={item}
                  onRegister={() => onRegisterInternal?.(item)}
                />
              );
            }
            return (
              <HackathonCard
                key={item.external_id}
                h={item}
                canManage={canManage}
                onEdit={() => {
                  setEditing(item);
                  setShowAdd(true);
                }}
                onDelete={async () => {
                  if (await confirm({ message: "Delete this hackathon?", confirmLabel: "Delete" })) {
                    remove.mutate(item.external_id);
                  }
                }}
                onRegister={() => setProofFor(item)}
                onSubmitResult={(type) => setResultFor({ h: item, type })}
              />
            );
          })}
        </div>
      )}

      {proofFor && (
        <RegisterModal
          hackathon={proofFor}
          pending={register.isPending}
          error={register.error}
          onSubmit={(input) => register.mutate({ id: proofFor.external_id, ...input })}
          onClose={() => {
            register.reset();
            setProofFor(null);
          }}
        />
      )}

      {resultFor && (
        <ResultModal
          hackathon={resultFor.h}
          type={resultFor.type}
          pending={submitResult.isPending}
          error={submitResult.error}
          onSubmit={(link) => submitResult.mutate({ id: resultFor.h.external_id, type: resultFor.type, link })}
          onClose={() => {
            submitResult.reset();
            setResultFor(null);
          }}
        />
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
ExternalHackathons.displayName = "ExternalHackathons";

function HackathonCard({
  h, canManage, onEdit, onDelete, onRegister, onSubmitResult,
}: {
  h: ExternalHackathon; canManage: boolean; onEdit: () => void; onDelete: () => void; onRegister: () => void;
  onSubmitResult: (type: HackathonResultType) => void;
}) {
  const src = SOURCES.find((s) => s.key === h.source);
  const deadline = fmt(h.deadline_at);
  const endsAt = h.ends_at ?? h.deadline_at;
  const over = !!endsAt && new Date(endsAt).getTime() < Date.now();
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${src?.badge ?? ""}`}>
          {h.source === "MANUAL" ? "Staff pick" : (src?.label ?? h.source)}
        </span>
        {canManage && h.source === "MANUAL" && (
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
      {over ? (
        <button
          type="button"
          disabled
          className="mt-4 inline-flex cursor-not-allowed items-center justify-center gap-1.5 rounded-xl bg-slate-200 px-4 py-2 text-xs font-bold text-slate-500"
        >
          Deadline finished
        </button>
      ) : (
        <a
          href={safeUrl(h.url)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1755A7] px-4 py-2 text-xs font-bold text-white hover:bg-[#134486]"
        >
          View &amp; register <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      )}
      {!canManage && h.teamName && h.registrationStatus !== "NONE" && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
          <Users className="h-3.5 w-3.5" /> Team <span className="font-bold text-slate-700">{h.teamName}</span> · {h.teamMembers.length} member{h.teamMembers.length === 1 ? "" : "s"}
        </div>
      )}
      {!canManage && (
        h.registrationStatus === "APPROVED" ? (
          <>
            <div className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> Registration verified (+{h.register_points} pts)
            </div>
            <ResultSection h={h} onSubmitResult={onSubmitResult} />
          </>
        ) : h.registrationStatus === "PENDING" ? (
          <div className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700">
            <Clock className="h-3.5 w-3.5" /> Registration proof submitted - awaiting faculty verification
          </div>
        ) : (
          <>
            {h.registrationStatus === "REJECTED" && (
              <div className="mt-2 flex items-start gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">
                <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>Proof rejected{h.registrationFeedback ? `: ${h.registrationFeedback}` : "."} No points awarded.</span>
              </div>
            )}
            <button
              type="button"
              onClick={onRegister}
              disabled={over}
              className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#1755A7] px-4 py-2 text-xs font-bold text-[#1755A7] hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent"
            >
              <Upload className="h-3.5 w-3.5" />
              {h.registrationStatus === "REJECTED" ? "Resubmit registration" : `Register team & submit proof (+${h.register_points} pts)`}
            </button>
          </>
        )
      )}
    </div>
  );
}

// "YYYY-MM-DD" in the browser's local time (the date input works in local time).
function toLocalDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function AddModal({ existing, onClose, onAdded }: { existing: ExternalHackathon | null; onClose: () => void; onAdded: () => void }) {
  const [f, setF] = useState({
    title: existing?.title ?? "",
    url: existing?.url ?? "",
    organizer: existing?.organizer ?? "",
    location: existing?.location ?? "",
    prize: existing?.prize ?? "",
    tags: existing?.tags.join(", ") ?? "",
    deadlineAt: existing?.deadline_at ? toLocalDate(existing.deadline_at) : "",
    description: existing?.description ?? "",
    isOnline: existing?.is_online ?? false,
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
        // Deadline closes at the end of the chosen day (local time); an empty value clears it on edit.
        deadlineAt: f.deadlineAt ? new Date(`${f.deadlineAt}T23:59:59`).toISOString() : existing ? "" : undefined,
      };
      return existing ? externalHackathonsApi.update(existing.external_id, body) : externalHackathonsApi.add(body);
    },
    onSuccess: onAdded,
  });

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl max-h-[92vh] flex flex-col">
        <div className="bg-gradient-to-r from-[#1755A7] via-[#1E40AF] to-[#2563EB] px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#F8C401]">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">{existing ? "Edit Hackathon" : "Add a Hackathon"}</h3>
              <p className="text-xs text-blue-100">External event details and registration link</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors active:scale-95">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            add.mutate();
          }}
          className="p-4 sm:p-6 grid grid-cols-1 gap-4 sm:grid-cols-2 max-h-[75vh] overflow-y-auto minute-scrollbar min-h-0"
        >
          {add.error ? <div className="sm:col-span-2"><ErrorBanner error={add.error} /></div> : null}
          <div className="sm:col-span-2">
            <input required placeholder="Title *" value={f.title} onChange={(e) => set("title", e.target.value)} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <input required type="url" placeholder="Link to register (https://...) *" value={f.url} onChange={(e) => set("url", e.target.value)} className={inputClass} />
          </div>
          <input placeholder="Organizer" value={f.organizer} onChange={(e) => set("organizer", e.target.value)} className={inputClass} />
          <input placeholder="Prize (e.g. INR 1,00,000)" value={f.prize} onChange={(e) => set("prize", e.target.value)} className={inputClass} />
          <input placeholder="Location" value={f.location} onChange={(e) => set("location", e.target.value)} className={inputClass} />
          <input type="date" title="Registration / event deadline" value={f.deadlineAt} onChange={(e) => set("deadlineAt", e.target.value)} className={inputClass} />
          <div className="sm:col-span-2">
            <input placeholder="Themes, comma separated (LLM, Agents...)" value={f.tags} onChange={(e) => set("tags", e.target.value)} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <textarea rows={3} placeholder="Short description" value={f.description} onChange={(e) => set("description", e.target.value)} className={inputClass} />
          </div>
          <p className="text-[11px] text-slate-500 sm:col-span-2">Registration points come from the Scoring Matrix (Admin → Scoring).</p>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 sm:col-span-2">
            <input type="checkbox" checked={f.isOnline} onChange={(e) => set("isOnline", e.target.checked)} /> Online event
          </label>
          <div className="mt-2 flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors active:scale-95">
              Cancel
            </button>
            <button type="submit" disabled={add.isPending} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] via-[#1A5EB7] to-[#2563EB] px-6 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1D4ED8] transition-all disabled:opacity-50 active:scale-95">
              {add.isPending ? "Saving..." : existing ? "Save changes" : "Add hackathon"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

const isLink = (s: string) => /^https?:\/\/\S+$/.test(s.trim());
const MAX_TEAM = 10;

/** Step 2 on a card whose registration is verified: participation / winner proof. */
function ResultSection({ h, onSubmitResult }: { h: ExternalHackathon; onSubmitResult: (type: HackathonResultType) => void }) {
  const label = h.resultType === "WINNER" ? "Winner" : "Participation";
  if (h.resultStatus === "APPROVED") {
    return (
      <div className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
        {h.resultType === "WINNER" ? <Trophy className="h-3.5 w-3.5" /> : <Medal className="h-3.5 w-3.5" />}
        {label} verified{h.resultPointsAwarded != null ? ` (+${h.resultPointsAwarded} pts)` : ""}
      </div>
    );
  }
  if (h.resultStatus === "PENDING") {
    return (
      <div className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700">
        <Clock className="h-3.5 w-3.5" /> {label} proof submitted - awaiting faculty verification
      </div>
    );
  }
  return (
    <div className="mt-2 space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      {h.resultStatus === "REJECTED" && (
        <div className="flex items-start gap-1.5 text-[11px] font-semibold text-red-700">
          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{label} proof rejected{h.resultFeedback ? `: ${h.resultFeedback}` : "."} You can resubmit.</span>
        </div>
      )}
      <p className="text-[11px] font-semibold text-slate-600">After the event, submit your result proof:</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onSubmitResult("PARTICIPATION")}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#1755A7] bg-white px-3 py-2 text-[11px] font-bold text-[#1755A7] hover:bg-blue-50"
        >
          <Medal className="h-3.5 w-3.5" /> Participated (+{h.participation_points})
        </button>
        <button
          type="button"
          onClick={() => onSubmitResult("WINNER")}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#F8C401] px-3 py-2 text-[11px] font-bold text-slate-900 hover:bg-amber-400"
        >
          <Trophy className="h-3.5 w-3.5" /> Won (+{h.winner_points})
        </button>
      </div>
    </div>
  );
}

function ModalShell({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-sm font-black text-slate-900">{title}</h3>
            <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

function RegisterModal({
  hackathon, pending, error, onSubmit, onClose,
}: {
  hackathon: ExternalHackathon;
  pending: boolean;
  error: unknown;
  onSubmit: (input: { link: string; teamName: string; teamMembers: HackathonTeamMember[] }) => void;
  onClose: () => void;
}) {
  const session = useSession();
  // Resubmitting after a rejection starts from the team entered last time.
  const [teamName, setTeamName] = useState(hackathon.teamName ?? "");
  const [members, setMembers] = useState<HackathonTeamMember[]>(() =>
    hackathon.teamMembers.length
      ? hackathon.teamMembers
      : [{ name: session.data?.fullName ?? "", email: session.data?.email ?? "", registerNum: "", department: "" }],
  );
  const [link, setLink] = useState("");

  const setMember = (i: number, k: keyof HackathonTeamMember, v: string) =>
    setMembers((prev) => prev.map((m, j) => (j === i ? { ...m, [k]: v } : m)));
  const clean = members
    .map((m) => ({
      name: m.name.trim(),
      registerNum: m.registerNum?.trim() || undefined,
      email: m.email?.trim() || undefined,
      department: m.department?.trim() || undefined,
    }))
    .filter((m) => m.name);
  const ready = teamName.trim() && clean.length > 0 && isLink(link);

  return (
    <ModalShell title="Register your team" subtitle={hackathon.title} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ link: link.trim(), teamName: teamName.trim(), teamMembers: clean });
        }}
        className="min-h-0 space-y-4 overflow-y-auto px-6 py-5"
      >
        <p className="text-xs text-slate-600">
          Register on the hackathon site first, then add your team and a link to your registration confirmation. Faculty will verify it; you get +
          {hackathon.register_points} points once approved, and can then submit your participation or winner proof.
        </p>

        <div>
          <label className="mb-1 block text-xs font-bold text-slate-800">Team name *</label>
          <input required value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. NeuralVanguard" className={inputClass} />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800"><Users className="h-3.5 w-3.5" /> Team members *</label>
            <span className="text-[11px] text-slate-400">{members.length}/{MAX_TEAM}</span>
          </div>
          <div className="space-y-2.5">
            {members.map((m, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>{i === 0 ? "Member 1 (you / team lead)" : `Member ${i + 1}`}</span>
                  {members.length > 1 && (
                    <button type="button" onClick={() => setMembers((p) => p.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-600" aria-label="Remove member">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input required placeholder="Full name *" value={m.name} onChange={(e) => setMember(i, "name", e.target.value)} className={inputClass} />
                  <input placeholder="Register number" value={m.registerNum ?? ""} onChange={(e) => setMember(i, "registerNum", e.target.value)} className={inputClass} />
                  <input type="email" placeholder="Email" value={m.email ?? ""} onChange={(e) => setMember(i, "email", e.target.value)} className={inputClass} />
                  <input placeholder="Department" value={m.department ?? ""} onChange={(e) => setMember(i, "department", e.target.value)} className={inputClass} />
                </div>
              </div>
            ))}
          </div>
          {members.length < MAX_TEAM && (
            <button
              type="button"
              onClick={() => setMembers((p) => [...p, { name: "", registerNum: "", email: "", department: "" }])}
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-dashed border-[#1755A7]/50 px-3 py-2 text-xs font-bold text-[#1755A7] hover:bg-blue-50"
            >
              <UserPlus className="h-3.5 w-3.5" /> Add member
            </button>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-slate-800">Proof of registration *</label>
          <input type="url" required placeholder="https://drive.google.com/... (screenshot or confirmation link)" value={link} onChange={(e) => setLink(e.target.value)} className={inputClass} />
        </div>

        {error ? <ErrorBanner error={error} /> : null}
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600">
            Cancel
          </button>
          <button type="submit" disabled={!ready || pending} className="rounded-xl bg-[#1755A7] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
            {pending ? "Submitting..." : "Submit for verification"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ResultModal({
  hackathon, type, pending, error, onSubmit, onClose,
}: {
  hackathon: ExternalHackathon; type: HackathonResultType; pending: boolean; error: unknown; onSubmit: (link: string) => void; onClose: () => void;
}) {
  const [link, setLink] = useState("");
  const winner = type === "WINNER";
  const points = winner ? hackathon.winner_points : hackathon.participation_points;
  return (
    <ModalShell title={winner ? "Submit winner proof" : "Submit participation proof"} subtitle={hackathon.title} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(link.trim());
        }}
        className="space-y-4 px-6 py-5"
      >
        <p className="text-xs text-slate-600">
          {winner
            ? "Share a link to your winner certificate, results announcement or prize email."
            : "Share a link to your participation certificate or project submission confirmation."}{" "}
          Faculty will verify it; you get +{points} points once approved.
        </p>
        <input type="url" required placeholder="https://drive.google.com/... or any direct link" value={link} onChange={(e) => setLink(e.target.value)} className={inputClass} />
        {error ? <ErrorBanner error={error} /> : null}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600">
            Cancel
          </button>
          <button type="submit" disabled={!isLink(link) || pending} className="rounded-xl bg-[#1755A7] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
            {pending ? "Submitting..." : "Submit for verification"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function InternalHackathonCard({ hackathon: hack, onRegister }: { hackathon: HackathonResponse; onRegister: () => void }) {
  const over = new Date(hack.ends_at).getTime() < Date.now();
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-[#1755A7]/40">
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
          Added by staff
        </span>
        <span className="text-[11px] font-bold">{hack.teams.length} team{hack.teams.length === 1 ? "" : "s"}</span>
      </div>
      <h3 className="mt-3 text-sm font-black leading-snug text-slate-900">{hack.title}</h3>
      <p className="mt-2 text-xs text-slate-600 leading-relaxed line-clamp-3">{hack.description}</p>
      
      <div className="mt-3 space-y-1 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {new Date(hack.starts_at).toLocaleDateString()} – {new Date(hack.ends_at).toLocaleDateString()}
        </div>
        {hack.theme && (
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            {hack.theme}
          </div>
        )}
      </div>

      {hack.problems.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {hack.problems.map((p) => (
            <span key={p.problem_id} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {p.title}
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onRegister}
        className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1755A7] px-4 py-2 text-xs font-bold text-white hover:bg-[#134486] transition-all"
      >
        Register Team <ArrowUpRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
