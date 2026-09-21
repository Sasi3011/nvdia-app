"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { STARTUP_STAGES } from "@ai-digital-passport/shared-types";
import {
  CheckCircle2,
  Clock,
  Cpu,
  ExternalLink,
  Eye,
  FileText,
  Rocket,
  Search,
  TrendingUp,
  X,
  XCircle,
} from "lucide-react";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { CustomSelect } from "../../../components/ui/CustomSelect";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { API_BASE_URL, adminStartupsApi, type AdminStartupListItem, type AdminStartupMilestone } from "../../../lib/api";
import { STARTUP_STAGE_FORMS } from "../../../lib/startup-stages";

const PAGE_SIZE = 15;

const STATUS_STYLE = {
  PENDING: { label: "Pending", cls: "border-amber-200 bg-amber-50 text-amber-700", icon: Clock },
  APPROVED: { label: "Approved", cls: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  REJECTED: { label: "Rejected", cls: "border-red-200 bg-red-50 text-red-700", icon: XCircle },
} as const;

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-";

function KpiCard({ label, value, hint, icon: Icon, bar, tone }: { label: string; value: number; hint: string; icon: typeof Rocket; bar: string; tone: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm transition-all hover:border-[#1755A7]/40 hover:shadow-md">
      <div className={`absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${bar}`} />
      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 text-3xl font-black tracking-tight text-slate-900">{value.toLocaleString()}</div>
      <div className="mt-3 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">{hint}</div>
    </div>
  );
}

export default function AdminStartupsPage() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [stage, setStage] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [viewId, setViewId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setPage(1), [debounced, stage, status]);

  const list = useQuery({
    queryKey: ["admin", "startups", { debounced, stage, status, page }],
    queryFn: () =>
      adminStartupsApi.list({
        page,
        pageSize: PAGE_SIZE,
        search: debounced || undefined,
        stage: stage === "ALL" ? undefined : Number(stage),
        status: status === "ALL" ? undefined : status,
      }),
    placeholderData: (prev) => prev,
  });

  const summary = list.data?.summary;
  const items = list.data?.items ?? [];
  const total = list.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader
        title="Startup Launchpad"
        description="Every student startup, its stage progress, and the milestones submitted for mentor review."
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Startups" value={summary?.total ?? 0} hint="Projects started by students" icon={Rocket} bar="from-[#1755A7] via-[#2563EB] to-[#38BDF8]" tone="bg-[#1755A7]/10 text-[#1755A7]" />
        <KpiCard label="GPU Validated" value={summary?.gpuValidated ?? 0} hint="Passed the GPU validation stage" icon={Cpu} bar="from-emerald-500 via-emerald-400 to-teal-400" tone="bg-emerald-500/15 text-emerald-600" />
        <KpiCard label="Pending Reviews" value={summary?.pendingReviews ?? 0} hint="Milestones awaiting a mentor" icon={Clock} bar="from-[#F8C401] via-amber-500 to-orange-500" tone="bg-amber-500/15 text-amber-600" />
        <KpiCard label="New in 30 Days" value={summary?.newLast30Days ?? 0} hint="Startups created recently" icon={TrendingUp} bar="from-indigo-400 via-purple-400 to-pink-400" tone="bg-indigo-400/15 text-indigo-600" />
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-black text-slate-900">Stage pipeline</h2>
        <p className="text-xs text-slate-500">Startups by their current approved stage. Click a stage to filter the table.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {STARTUP_STAGES.map((s) => {
            const count = summary?.stageCounts[String(s.stage)] ?? 0;
            const active = stage === String(s.stage);
            return (
              <button
                key={s.stage}
                type="button"
                onClick={() => setStage(active ? "ALL" : String(s.stage))}
                className={`rounded-xl border p-3 text-left transition-colors ${active ? "border-[#1755A7] bg-[#1755A7]/5" : "border-slate-200 bg-slate-50/60 hover:bg-white"}`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stage {s.stage}</div>
                <div className="mt-0.5 text-[13px] font-bold text-slate-900">{s.name}</div>
                <div className="mt-2 text-2xl font-black text-[#1755A7]">{count}</div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-6 flex flex-col items-stretch gap-3 md:flex-row md:items-center">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search startup, student or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7]"
          />
        </div>
        <div className="w-full md:w-48">
          <CustomSelect
            value={stage}
            onChange={setStage}
            options={[{ label: "All stages", value: "ALL" }, ...STARTUP_STAGES.map((s) => ({ label: `${s.stage}. ${s.name}`, value: String(s.stage) }))]}
          />
        </div>
        <div className="w-full md:w-52">
          <CustomSelect
            value={status}
            onChange={setStatus}
            options={[
              { label: "Any milestone status", value: "ALL" },
              { label: "Has pending milestone", value: "PENDING" },
              { label: "Has approved milestone", value: "APPROVED" },
              { label: "Has rejected milestone", value: "REJECTED" },
            ]}
          />
        </div>
      </div>

      {list.isLoading ? (
        <div className="flex h-64 items-center justify-center"><Spinner label="Loading startups..." /></div>
      ) : list.isError ? (
        <div className="mt-6"><ErrorBanner error={list.error} /></div>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Rocket className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm font-bold text-slate-700">{summary?.total ? "No startups match these filters." : "No startups yet."}</p>
          <p className="mt-1 text-xs text-slate-400">Startups appear here once students create them in the Startup Launchpad.</p>
        </div>
      ) : (
        <>
        <div className="mt-6 space-y-3 md:hidden">
          {items.map((p) => (
            <button
              key={p.projectId}
              type="button"
              onClick={() => setViewId(p.projectId)}
              className="block w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 break-words text-[13px] font-bold text-slate-900">{p.title}</div>
                <span className="inline-flex shrink-0 rounded-full border border-[#1755A7]/20 bg-[#1755A7]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#1755A7]">
                  {p.currentStage}. {p.currentStageName}
                </span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">{p.lead.fullName} &middot; {p.lead.department} &middot; {p.lead.cohortYear}</div>
              <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[11px] font-bold">
                <span className="rounded-md border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-emerald-700" title="Approved">{p.milestones.approved}</span>
                <span className="rounded-md border border-amber-200/60 bg-amber-50 px-2 py-0.5 text-amber-700" title="Pending">{p.milestones.pending}</span>
                <span className="rounded-md border border-red-200/60 bg-red-50 px-2 py-0.5 text-red-700" title="Rejected">{p.milestones.rejected}</span>
                {p.gpuValidated && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-sans text-[10px] font-bold text-emerald-700">
                    <Cpu className="h-3 w-3" /> GPU validated
                  </span>
                )}
                <span className="ml-auto font-sans text-[11px] font-medium text-slate-400">{fmtDate(p.updatedAt)}</span>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Startup</th>
                <th className="px-5 py-3.5">Lead Student</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Stage</th>
                <th className="px-5 py-3.5 text-center">Milestones</th>
                <th className="px-5 py-3.5 text-center">GPU</th>
                <th className="px-5 py-3.5">Updated</th>
                <th className="px-5 py-3.5 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((p) => (
                <ProjectRow key={p.projectId} p={p} onView={() => setViewId(p.projectId)} />
              ))}
            </tbody>
          </table>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:mt-0 mt-3">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-[11px] font-semibold text-slate-500 sm:px-5">
            <span>{total} startup{total === 1 ? "" : "s"}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((n) => n - 1)}
                className="rounded-lg border border-slate-200 px-3 py-2 font-bold text-slate-700 disabled:opacity-40"
              >
                Previous
              </button>
              <span>Page {page} of {pages}</span>
              <button
                type="button"
                disabled={page >= pages}
                onClick={() => setPage((n) => n + 1)}
                className="rounded-lg border border-slate-200 px-3 py-2 font-bold text-slate-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
        </>
      )}

      {viewId && <StartupDetailModal projectId={viewId} onClose={() => setViewId(null)} />}
    </ConsoleShell>
  );
}

function ProjectRow({ p, onView }: { p: AdminStartupListItem; onView: () => void }) {
  return (
    <tr className="transition-colors hover:bg-slate-50/70">
      <td className="px-5 py-4">
        <button type="button" onClick={onView} className="text-left text-[13px] font-bold text-slate-900 transition-colors hover:text-[#1755A7]">
          {p.title}
        </button>
      </td>
      <td className="px-5 py-4">
        <div className="font-semibold text-slate-800">{p.lead.fullName}</div>
        <div className="text-[11px] text-slate-400">{p.lead.email}</div>
      </td>
      <td className="px-5 py-4 text-slate-700">
        {p.lead.department}
        <span className="text-slate-400"> &middot; {p.lead.cohortYear}</span>
      </td>
      <td className="px-5 py-4">
        <span className="inline-flex rounded-full border border-[#1755A7]/20 bg-[#1755A7]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#1755A7]">
          {p.currentStage}. {p.currentStageName}
        </span>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center justify-center gap-1.5 font-mono text-[11px] font-bold">
          <span className="rounded-md border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-emerald-700" title="Approved">{p.milestones.approved}</span>
          <span className="rounded-md border border-amber-200/60 bg-amber-50 px-2 py-0.5 text-amber-700" title="Pending">{p.milestones.pending}</span>
          <span className="rounded-md border border-red-200/60 bg-red-50 px-2 py-0.5 text-red-700" title="Rejected">{p.milestones.rejected}</span>
        </div>
      </td>
      <td className="px-5 py-4 text-center">
        {p.gpuValidated ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            <Cpu className="h-3 w-3" /> Validated
          </span>
        ) : (
          <span className="text-[11px] text-slate-400">Not yet</span>
        )}
      </td>
      <td className="whitespace-nowrap px-5 py-4 text-slate-600">{fmtDate(p.updatedAt)}</td>
      <td className="px-5 py-4 text-right">
        <button
          type="button"
          onClick={onView}
          title="View startup"
          aria-label={`View ${p.title}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white transition-all hover:bg-slate-50"
        >
          <Eye className="h-3.5 w-3.5 text-slate-500" />
        </button>
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: AdminStartupMilestone["status"] }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${s.cls}`}>
      <s.icon className="h-3 w-3" /> {s.label}
    </span>
  );
}

function StartupDetailModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const detail = useQuery({ queryKey: ["admin", "startups", "detail", projectId], queryFn: () => adminStartupsApi.detail(projectId) });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const p = detail.data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-[#1755A7] via-[#1E40AF] to-[#2563EB] px-4 py-4 text-white sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#F8C401]">
              <Rocket className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold">{p?.title ?? "Startup details"}</h3>
              {p && <p className="truncate text-xs text-blue-100">Stage {p.currentStage}: {p.currentStageName}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-white/20">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto p-4 sm:p-6">
          {detail.isLoading ? (
            <div className="flex h-40 items-center justify-center"><Spinner label="Loading startup..." /></div>
          ) : detail.isError ? (
            <ErrorBanner error={detail.error} />
          ) : p ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Info label="Lead Student" value={p.lead.fullName} />
                <Info label="Register No." value={p.lead.registerNum} />
                <Info label="Department" value={`${p.lead.department} · ${p.lead.cohortYear}`} />
                <Info label="Email" value={p.lead.email} />
                <Info label="GPU Validated" value={p.gpuValidated ? "Yes" : "Not yet"} />
                <Info label="Started" value={fmtDate(p.createdAt)} />
                <Info label="Last Updated" value={fmtDate(p.updatedAt)} />
                <Info label="Milestones" value={String(p.milestones.length)} />
              </div>

              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Stage progress</h4>
                <ol className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {STARTUP_STAGES.map((s) => {
                    const done = s.stage <= p.currentStage;
                    return (
                      <li
                        key={s.stage}
                        className={`rounded-xl border p-2.5 text-center ${done ? "border-[#1755A7]/30 bg-[#1755A7]/5" : "border-slate-200 bg-slate-50/60"}`}
                      >
                        <div className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black ${done ? "bg-[#1755A7] text-white" : "bg-slate-200 text-slate-500"}`}>
                          {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.stage}
                        </div>
                        <div className={`mt-1.5 text-[10px] font-bold leading-tight ${done ? "text-[#1755A7]" : "text-slate-400"}`}>{s.name}</div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Milestone submissions</h4>
                {p.milestones.length === 0 ? (
                  <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-center text-xs font-semibold text-slate-400">
                    No milestones submitted yet.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {p.milestones.map((m) => (
                      <MilestoneCard key={m.milestoneId} m={m} />
                    ))}
                  </div>
                )}
                <p className="mt-3 text-[11px] text-slate-400">Read-only view. Approving or rejecting milestones is done by mentors.</p>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-1 break-words text-xs font-bold text-slate-900">{value}</div>
    </div>
  );
}

function MilestoneCard({ m }: { m: AdminStartupMilestone }) {
  const form = STARTUP_STAGE_FORMS.find((f) => f.stage === m.targetStage);
  const known = form?.fields.filter((f) => m.fields[f.key]) ?? [];
  const knownKeys = new Set(known.map((f) => f.key));
  const extra = Object.entries(m.fields).filter(([k, v]) => v && !knownKeys.has(k));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[13px] font-bold text-slate-900">
          Stage {m.targetStage}: {m.stageName}
        </div>
        <StatusBadge status={m.status} />
      </div>
      <div className="mt-1 text-[11px] text-slate-400">
        Submitted {fmtDate(m.submittedAt)}
        {m.reviewedAt && ` · Reviewed ${fmtDate(m.reviewedAt)}${m.reviewerName ? ` by ${m.reviewerName}` : ""}`}
      </div>

      {(known.length > 0 || extra.length > 0) && (
        <dl className="mt-3 space-y-2 text-xs">
          {known.map((f) => (
            <div key={f.key}>
              <dt className="font-bold text-slate-700">{f.label}</dt>
              <dd className="whitespace-pre-wrap break-words text-slate-600">{m.fields[f.key]}</dd>
            </div>
          ))}
          {extra.map(([k, v]) => (
            <div key={k}>
              <dt className="font-bold text-slate-700">{k}</dt>
              <dd className="whitespace-pre-wrap break-words text-slate-600">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      {(m.evidenceUrl || m.documents.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {m.evidenceUrl && (
            <a
              href={m.evidenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-[#1755A7] hover:bg-slate-50"
            >
              <ExternalLink className="h-3 w-3" /> Evidence link
            </a>
          )}
          {m.documents.map((d) => (
            <a
              key={d.fileKey}
              href={`${API_BASE_URL}/uploads/files/${d.fileKey}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-[#1755A7] hover:bg-slate-50"
            >
              <FileText className="h-3 w-3" /> {d.fileName}
            </a>
          ))}
        </div>
      )}

      {m.feedback && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700">
          <span className="font-bold">Mentor feedback: </span>
          {m.feedback}
        </div>
      )}
    </div>
  );
}
