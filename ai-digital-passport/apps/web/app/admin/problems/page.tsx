"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { adminProblemsApi, uploadsApi, type AdminProblemResponse, type FileAttachment, type UpsertProblemInput } from "../../../lib/api";
import { AttachmentViewer } from "../../../components/shared/AttachmentViewer";
import { useConfirm } from "../../../components/ui/ConfirmDialogProvider";
import { 
  Lightbulb, 
  Building, 
  ShieldCheck, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  CheckCircle2, 
  Archive, 
  Eye,
  Sparkles,
  ExternalLink,
  Briefcase,
  Layers,
  Upload
} from "lucide-react";

const STATUSES: UpsertProblemInput["status"][] = ["PUBLISHED", "DRAFT", "ARCHIVED"];
const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7] transition-colors";
const labelClass = "text-xs font-bold text-slate-700 flex items-center gap-1.5";

export default function AdminProblemsPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const problems = useQuery({
    queryKey: ["admin", "problems"], 
    queryFn: () => adminProblemsApi.list({ page: 1, pageSize: 100 }) 
  });
  
  const [editingProblem, setEditingProblem] = useState<AdminProblemResponse | "new" | null>(null);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<string>("ALL");
  const [viewing, setViewing] = useState<AdminProblemResponse | null>(null);

  const invalidate = () => {
    setEditingProblem(null);
    queryClient.invalidateQueries({ queryKey: ["admin", "problems"] });
  };

  const updateStatus = useMutation({
    mutationFn: ({ id, status, problem }: { id: string; status: UpsertProblemInput["status"]; problem: AdminProblemResponse }) =>
      adminProblemsApi.update(id, {
        title: problem.title,
        description: problem.description,
        organization: problem.organization ?? undefined,
        levelRequirement: problem.levelRequirement,
        status,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "problems"] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminProblemsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "problems"] }),
  });

  const allItems = problems.data?.items ?? [];
  const orgs = ["ALL", ...Array.from(new Set(allItems.map((p) => p.organization).filter(Boolean) as string[]))];

  const filteredItems = allItems.filter((p) => {
    const matchesSearch = 
      p.title.toLowerCase().includes(search.toLowerCase()) || 
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      (p.organization && p.organization.toLowerCase().includes(search.toLowerCase()));
    const matchesOrg = selectedOrg === "ALL" || p.organization === selectedOrg;
    return matchesSearch && matchesOrg;
  });

  const orgCounts = allItems.reduce<Record<string, number>>((acc, p) => (p.organization ? { ...acc, [p.organization]: (acc[p.organization] ?? 0) + 1 } : acc), {});
  const topOrg = Object.entries(orgCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  const publishedCount = allItems.filter(p => p.status === "PUBLISHED").length;
  const draftCount = allItems.filter(p => p.status === "DRAFT").length;

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader
        title="Industry Problem Bank & Grand Challenges"
        description="Manage industry problem statements and their status."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setImporting(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-all active:scale-95"
          >
            <Upload className="h-4 w-4 text-[#1755A7]" />
            <span>Import from File</span>
          </button>
          <button
            onClick={() => setEditingProblem("new")}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] via-[#1A5EB7] to-[#2563EB] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1D4ED8] transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Create Problem Statement</span>
          </button>
          </div>
        }
      />

      {importing && (
        <ImportModal
          onDone={() => {
            setImporting(false);
            queryClient.invalidateQueries({ queryKey: ["admin", "problems"] });
          }}
          onCancel={() => setImporting(false)}
        />
      )}

      {/* Problem Modal Popup */}
      {editingProblem && (
        <ProblemModal
          problem={editingProblem === "new" ? null : editingProblem}
          onDone={invalidate}
          onCancel={() => setEditingProblem(null)}
        />
      )}

      {viewing && <ProblemViewModal problem={viewing} onClose={() => setViewing(null)} />}

      {(updateStatus.isError || remove.isError) && (
        <div className="mt-4">
          <ErrorBanner error={updateStatus.error ?? remove.error} />
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
          <div className="absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#1755A7] via-[#2563EB] to-[#38BDF8]" />
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Statements</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1755A7]/15 to-[#2563EB]/10 text-[#1755A7]">
              <Lightbulb className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{problems.data?.total ?? allItems.length}</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
              Active Bank
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
            <span>Published for Students:</span>
            <span className="font-bold text-slate-800">{publishedCount} Live</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
          <div className="absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#1755A7] via-[#F8C401] to-[#EA580C]" />
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Corporate Partners</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#F8C401]/25 to-[#EA580C]/15 text-amber-600">
              <Building className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="bg-gradient-to-r from-[#1755A7] to-[#2563EB] bg-clip-text text-3xl font-black tracking-tight text-transparent">{orgs.length - 1}</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-slate-500">
              Enterprises
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
            <span>Most problems:</span>
            <span className="font-bold text-[#1755A7]">{topOrg ? `${topOrg[0]} (${topOrg[1]})` : "-"}</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-amber-400/40 hover:shadow-md transition-all">
          <div className="absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#38BDF8] via-[#F59E0B] to-[#EA580C]" />
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Draft Pipelines</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-400/15 text-amber-600">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-slate-900">{draftCount}</span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">In Review</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
            <span>Archived Challenges:</span>
            <span className="font-bold text-slate-800">{allItems.filter(p => p.status === "ARCHIVED").length}</span>
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search problems by title, description or enterprise..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
        </div>
      </div>

      {/* Main Problems Table */}
      {problems.isLoading ? (
        <div className="mt-8 flex h-64 items-center justify-center">
          <Spinner label="Loading industry problem bank..." />
        </div>
      ) : problems.isError ? (
        <div className="mt-6">
          <ErrorBanner error={problems.error} />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Lightbulb className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm font-bold text-slate-700">No problem statements found.</p>
          <p className="text-xs text-slate-400 mt-1">Click &quot;Create Problem Statement&quot; to publish your first grand challenge.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Problem Statement & Scope</th>
                <th className="px-6 py-3.5">Organization / Sponsor</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((p) => (
                <tr key={p.problemId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3.5 max-w-md">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
                        <Lightbulb className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-[13px]">{p.title}</span>
                        <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{p.description}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 font-bold text-slate-800 text-xs bg-slate-100 px-3 py-1 rounded-xl">
                      <Building className="h-3.5 w-3.5 text-[#1755A7]" />
                      {p.organization || "-"}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <StatusBadge status={p.status} />
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setViewing(p)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border transition-all active:scale-95 disabled:opacity-50 border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                        title="View details"
                        aria-label="View details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingProblem(p)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border transition-all active:scale-95 disabled:opacity-50 border-slate-200 bg-white text-[#1755A7] hover:bg-slate-50 hover:border-[#1755A7]"
                        title="Edit problem"
                        aria-label="Edit problem"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>

                      {p.status !== "PUBLISHED" && (
                        <button
                          type="button"
                          onClick={() => updateStatus.mutate({ id: p.problemId, status: "PUBLISHED", problem: p })}
                          disabled={updateStatus.isPending}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border transition-all active:scale-95 disabled:opacity-50 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          title="Publish"
                          aria-label="Publish"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {p.status !== "ARCHIVED" && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (await confirm({ message: "Archive this problem? Students will no longer see it.", confirmLabel: "Archive" })) {
                              updateStatus.mutate({ id: p.problemId, status: "ARCHIVED", problem: p });
                            }
                          }}
                          disabled={updateStatus.isPending}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border transition-all active:scale-95 disabled:opacity-50 border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                          title="Archive"
                          aria-label="Archive"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={async () => {
                          if (await confirm({ message: "Permanently delete this problem statement? This cannot be undone.", confirmLabel: "Delete" })) remove.mutate(p.problemId);
                        }}
                        disabled={remove.isPending}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border transition-all active:scale-95 disabled:opacity-50 border-slate-200 bg-white text-red-500 hover:bg-red-50 hover:border-red-200"
                        title="Delete"
                        aria-label="Delete"
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

function StatusBadge({ status }: { status: string }) {
  if (status === "PUBLISHED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
        Published
      </span>
    );
  }
  if (status === "ARCHIVED") {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
        Archived
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[11px] font-bold text-amber-700">
      Draft
    </span>
  );
}

function ProblemViewModal({ problem, onClose }: { problem: AdminProblemResponse; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div className={`flex max-h-[88vh] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ${problem.attachment ? "max-w-4xl" : "max-w-2xl"}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between bg-gradient-to-r from-[#1755A7] via-[#1E40AF] to-[#2563EB] px-6 py-4 text-white">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#F8C401]">
              <Lightbulb className="h-5 w-5" />
            </div>
            <h3 className="truncate text-sm font-bold">{problem.title}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 overflow-y-auto p-4 text-xs sm:p-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Industry</div>
              <div className="mt-1 font-bold text-slate-900">{problem.organization || "-"}</div>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lifecycle Status</div>
              <div className="mt-1"><StatusBadge status={problem.status} /></div>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Level Requirement</div>
              <div className="mt-1 font-bold text-slate-900">Level {problem.levelRequirement}+</div>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Created</div>
              <div className="mt-1 font-bold text-slate-900">{new Date(problem.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
          {problem.description && (
            <div className="rounded-xl border border-slate-200/80 bg-white p-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Problem Description</h4>
              <p className="mt-2 whitespace-pre-wrap leading-relaxed text-slate-700">{problem.description}</p>
            </div>
          )}
          {problem.attachment && <AttachmentViewer attachment={problem.attachment} />}
        </div>
      </div>
    </div>
  );
}

function ProblemModal({
  problem,
  onDone,
  onCancel,
}: {
  problem: AdminProblemResponse | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(problem?.title ?? "");
  const [description, setDescription] = useState(problem?.description ?? "");
  const [organization, setOrganization] = useState(problem?.organization ?? "");
  const [status, setStatus] = useState<UpsertProblemInput["status"]>(problem?.status ?? "PUBLISHED");

  const [existingFile, setExistingFile] = useState<FileAttachment | null>(problem?.attachment ?? null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const hasFile = !!existingFile || !!newFile;

  const save = useMutation({
    mutationFn: async (overrideStatus?: UpsertProblemInput["status"]) => {
      let attachment: FileAttachment | null | undefined;
      if (newFile) attachment = await uploadProblemFile(newFile);
      else if (problem?.attachment && !existingFile) attachment = null;
      const input: UpsertProblemInput = {
        title,
        description,
        organization: organization || undefined,
        status: overrideStatus ?? status,
        levelRequirement: 1,
        attachment,
      };
      return problem ? adminProblemsApi.update(problem.problemId, input) : adminProblemsApi.create(input);
    },
    onSuccess: onDone,
  });

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#1755A7] via-[#1E40AF] to-[#2563EB] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#F8C401]">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">{problem ? "Edit Problem Statement" : "Create Industry Grand Challenge"}</h3>
              <p className="text-xs text-blue-100">Specify the sponsor organization, title and problem statement</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onCancel} 
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form
          className="p-4 sm:p-6 grid grid-cols-1 gap-4 sm:grid-cols-2 max-h-[75vh] overflow-y-auto minute-scrollbar"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          {save.isError && (
            <div className="sm:col-span-2">
              <ErrorBanner error={save.error} />
            </div>
          )}

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className={labelClass}>
              <span>Problem Statement Title <span className="text-red-500">*</span></span>
            </label>
            <input 
              required 
              placeholder="E.g. NVIDIA Omniverse Digital Twin for Robotic Assembly" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className={inputClass} 
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <span>Enterprise / Sponsor Organization</span>
            </label>
            <input 
              placeholder="E.g. NVIDIA, Siemens, L&T, Sri Eshwar Lab" 
              value={organization} 
              onChange={(e) => setOrganization(e.target.value)} 
              className={inputClass} 
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className={labelClass}>
              <span>Lifecycle Status</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`rounded-xl border py-2.5 text-xs font-bold transition-all ${
                    status === s
                      ? "border-[#1755A7] bg-blue-50 text-[#1755A7] shadow-2xs"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className={labelClass}>
              <span>Comprehensive Problem Description & Expected Deliverables {!hasFile && <span className="text-red-500">*</span>}</span>
            </label>
            <textarea 
              required={!hasFile}
              rows={4} 
              placeholder="Outline the technical problem context, dataset specifications, GPU computation constraints, and expected evaluation benchmark..." 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              className={inputClass} 
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className={labelClass}>
              <span>Attached File (PDF, Excel, Word...)</span>
            </label>
            {existingFile && !newFile && (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                <span className="truncate font-semibold text-slate-800">{existingFile.fileName}</span>
                <button type="button" onClick={() => setExistingFile(null)} className="shrink-0 font-bold text-rose-600 hover:underline">
                  Remove
                </button>
              </div>
            )}
            <input
              type="file"
              accept={PROBLEM_FILE_ACCEPT}
              onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
              className={inputClass}
            />
            <p className="text-[11px] text-slate-500">{existingFile && !newFile ? "Choose a file to replace the current one." : "Optional. The file is kept as uploaded and shown as-is."}</p>
          </div>

          {/* Modal Sticky Actions */}
          <div className="mt-2 flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3 pt-3 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onCancel}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors active:scale-95"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={save.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] via-[#1A5EB7] to-[#2563EB] px-6 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1D4ED8] transition-all disabled:opacity-50 active:scale-95"
            >
              {save.isPending ? "Saving..." : problem ? "Save Changes" : "Create Statement"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

type ImportStatus = "PUBLISHED" | "DRAFT" | "ARCHIVED";

const PROBLEM_FILE_ACCEPT = ".pdf,.xlsx,.xls,.csv,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp";

const EXT_MIME: Record<string, string> = {
  pdf: "application/pdf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  csv: "text/csv",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = String(reader.result ?? "");
      resolve(r.includes(",") ? r.slice(r.indexOf(",") + 1) : r);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Uploads the original file to the app's file storage and returns the reference saved on the problem.
async function uploadProblemFile(file: File): Promise<FileAttachment> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  // Browsers report .csv as an Excel type on Windows and leave some types blank, so trust the extension.
  const mimeType = EXT_MIME[ext] ?? (file.type || "application/octet-stream");
  const uploaded = await uploadsApi.uploadPdf({
    fileName: file.name,
    mimeType,
    sizeBytes: file.size,
    base64Data: await fileToBase64(file),
    entityType: "industry_problem",
  });
  return { fileKey: uploaded.fileKey, fileName: uploaded.fileName, mimeType: uploaded.mimeType, sizeBytes: uploaded.sizeBytes };
}

function ImportModal({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [organization, setOrganization] = useState("");
  const [status, setStatus] = useState<ImportStatus | "">("");

  const save = useMutation({
    mutationFn: async () => {
      const attachment = await uploadProblemFile(file as File);
      return adminProblemsApi.importFile({
        title: title.trim(),
        description: description.trim() || undefined,
        organization: organization.trim(),
        status: status as ImportStatus,
        attachment,
      });
    },
    onSuccess: onDone,
  });

  const ready = !!file && !!title.trim() && !!organization.trim() && !!status;

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#1755A7] via-[#1E40AF] to-[#2563EB] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#F8C401]">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Import Problem File</h3>
              <p className="text-xs text-blue-100">Upload a PDF, Excel, Word or other file. It is kept as-is and shown exactly as uploaded.</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onCancel} 
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Form Body */}
        <div className="p-4 sm:p-6 grid grid-cols-1 gap-4 sm:grid-cols-2 max-h-[75vh] overflow-y-auto minute-scrollbar">
          {save.isError && (
            <div className="sm:col-span-2">
              <ErrorBanner error={save.error} />
            </div>
          )}

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className={labelClass}>
              <span>File <span className="text-red-500">*</span></span>
            </label>
            <input
              type="file"
              accept={PROBLEM_FILE_ACCEPT}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                // Default the title to the file name without its extension.
                if (f) setTitle((cur) => cur || f.name.replace(/\.[^.]+$/, ""));
              }}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className={labelClass}>
              <span>Problem Title <span className="text-red-500">*</span></span>
            </label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Problem title" className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className={labelClass}>
              <span>Industry name <span className="text-red-500">*</span></span>
            </label>
            <input value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="E.g. NVIDIA, Siemens" className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className={labelClass}>
              <span>Lifecycle Status <span className="text-red-500">*</span></span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s as ImportStatus)}
                  className={`rounded-xl border py-2.5 text-xs font-bold transition-all ${
                    status === s
                      ? "border-[#1755A7] bg-blue-50 text-[#1755A7] shadow-2xs"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className={labelClass}>
              <span>Short description (optional)</span>
            </label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
          </div>

          {/* Modal Sticky Actions */}
          <div className="mt-2 flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3 pt-3 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onCancel}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors active:scale-95"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!ready || save.isPending}
              onClick={() => save.mutate()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] via-[#1A5EB7] to-[#2563EB] px-6 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1D4ED8] transition-all disabled:opacity-50 active:scale-95"
            >
              {save.isPending ? "Importing..." : "Import File"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
