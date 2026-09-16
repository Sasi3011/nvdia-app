"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { adminProblemsApi, type AdminProblemResponse, type UpsertProblemInput } from "../../../lib/api";
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
  Sparkles,
  ExternalLink,
  Briefcase,
  Layers
} from "lucide-react";

const STATUSES: UpsertProblemInput["status"][] = ["PUBLISHED", "DRAFT", "ARCHIVED"];
const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7] transition-colors";
const labelClass = "text-xs font-bold text-slate-700 flex items-center gap-1.5";

export default function AdminProblemsPage() {
  const queryClient = useQueryClient();
  const problems = useQuery({ 
    queryKey: ["admin", "problems"], 
    queryFn: () => adminProblemsApi.list({ page: 1, pageSize: 100 }) 
  });
  
  const [editingProblem, setEditingProblem] = useState<AdminProblemResponse | "new" | null>(null);
  const [search, setSearch] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<string>("ALL");
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");

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

  const allItems = problems.data?.items ?? [];
  const orgs = ["ALL", ...Array.from(new Set(allItems.map((p) => p.organization).filter(Boolean) as string[]))];

  const filteredItems = allItems.filter((p) => {
    const matchesSearch = 
      p.title.toLowerCase().includes(search.toLowerCase()) || 
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      (p.organization && p.organization.toLowerCase().includes(search.toLowerCase()));
    const matchesOrg = selectedOrg === "ALL" || p.organization === selectedOrg;
    const matchesLevel = selectedLevel === "ALL" || p.levelRequirement.toString() === selectedLevel;
    return matchesSearch && matchesOrg && matchesLevel;
  });

  const publishedCount = allItems.filter(p => p.status === "PUBLISHED").length;
  const draftCount = allItems.filter(p => p.status === "DRAFT").length;
  const avgLevel = allItems.length ? (allItems.reduce((acc, p) => acc + p.levelRequirement, 0) / allItems.length).toFixed(1) : "3.0";

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader
        title="Industry Problem Bank & Grand Challenges"
        description="Curate enterprise problem statements, link NVIDIA & industry partners, configure competency level prerequisites, and manage lifecycle status."
        actions={
          <button
            onClick={() => setEditingProblem("new")}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] via-[#1A5EB7] to-[#2563EB] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1D4ED8] transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Create Problem Statement</span>
          </button>
        }
      />

      {/* Problem Modal Popup */}
      {editingProblem && (
        <ProblemModal
          problem={editingProblem === "new" ? null : editingProblem}
          onDone={invalidate}
          onCancel={() => setEditingProblem(null)}
        />
      )}

      {/* KPI Metric Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Statements</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
              <Lightbulb className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{allItems.length}</span>
            <span className="text-xs font-semibold text-emerald-600">Active Bank</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Published for Students:</span>
            <span className="font-bold text-slate-800">{publishedCount} Live</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Corporate Partners</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8C401]/20 text-slate-900">
              <Building className="h-4.5 w-4.5 text-amber-700" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{orgs.length - 1 || 1}</span>
            <span className="text-xs font-semibold text-slate-500">Enterprises</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Lead Industry Sponsor:</span>
            <span className="font-bold text-[#1755A7]">NVIDIA AI</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Draft Pipelines</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{draftCount}</span>
            <span className="text-xs font-bold text-amber-700">In Review</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Archived Challenges:</span>
            <span className="font-bold text-slate-800">{allItems.filter(p => p.status === "ARCHIVED").length}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Competency Gate</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#1755A7]">Level {avgLevel}</span>
            <span className="text-xs font-bold text-slate-500">avg requisite</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Target Scholar Cohort:</span>
            <span className="font-bold text-slate-800">AI Builder (L3+)</span>
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
          {/* Org Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
            <Building className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
            >
              {orgs.map((o) => (
                <option key={o} value={o}>
                  {o === "ALL" ? "All Organizations" : o}
                </option>
              ))}
            </select>
          </div>

          {/* Level Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
            <ShieldCheck className="h-3.5 w-3.5 text-[#1755A7]" />
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
            >
              <option value="ALL">All Competency Levels</option>
              <option value="1">Level 1 - AI Explorer</option>
              <option value="2">Level 2 - AI Practitioner</option>
              <option value="3">Level 3 - AI Builder</option>
              <option value="4">Level 4 - AI Specialist</option>
              <option value="5">Level 5 - AI Innovator</option>
              <option value="6">Level 6 - AI Grandmaster</option>
            </select>
          </div>
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
          <p className="text-xs text-slate-400 mt-1">Click "Create Problem Statement" to publish your first grand challenge.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Problem Statement & Scope</th>
                <th className="px-6 py-3.5">Organization / Sponsor</th>
                <th className="px-6 py-3.5 text-center">Requisite Level</th>
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
                      {p.organization || "Sri Eshwar NVIDIA Lab"}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 font-bold text-slate-900 text-xs bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#1755A7]" />
                      Level {p.levelRequirement}+
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <StatusBadge status={p.status} />
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setEditingProblem(p)}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-[#1755A7] transition-all active:scale-95"
                        title="Edit problem"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                        <span>Edit</span>
                      </button>

                      {p.status !== "PUBLISHED" && (
                        <button
                          onClick={() => updateStatus.mutate({ id: p.problemId, status: "PUBLISHED", problem: p })}
                          disabled={updateStatus.isPending}
                          className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-all active:scale-95"
                          title="Publish instantly"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Publish</span>
                        </button>
                      )}

                      {p.status === "PUBLISHED" && (
                        <button
                          onClick={() => updateStatus.mutate({ id: p.problemId, status: "ARCHIVED", problem: p })}
                          disabled={updateStatus.isPending}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all active:scale-95"
                          title="Archive"
                        >
                          <Archive className="h-3.5 w-3.5" />
                          <span>Archive</span>
                        </button>
                      )}
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
  const [levelRequirement, setLevelRequirement] = useState(problem?.levelRequirement ?? 3);

  const save = useMutation({
    mutationFn: (overrideStatus?: UpsertProblemInput["status"]) => {
      const input: UpsertProblemInput = { 
        title, 
        description, 
        organization: organization || undefined, 
        status: overrideStatus ?? status, 
        levelRequirement 
      };
      return problem ? adminProblemsApi.update(problem.problemId, input) : adminProblemsApi.create(input);
    },
    onSuccess: onDone,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#1755A7] via-[#1E40AF] to-[#2563EB] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#F8C401]">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">{problem ? "Edit Problem Statement" : "Create Industry Grand Challenge"}</h3>
              <p className="text-xs text-blue-100">Specify requirements, enterprise sponsor, and eligible competency level</p>
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
          className="p-6 grid grid-cols-1 gap-4 sm:grid-cols-2 max-h-[75vh] overflow-y-auto minute-scrollbar"
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

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <span>Minimum Competency Level Requisite</span>
            </label>
            <select
              value={levelRequirement}
              onChange={(e) => setLevelRequirement(Number(e.target.value))}
              className={inputClass}
            >
              <option value={1}>Level 1 - AI Explorer</option>
              <option value={2}>Level 2 - AI Practitioner</option>
              <option value={3}>Level 3 - AI Builder (Recommended)</option>
              <option value={4}>Level 4 - AI Specialist</option>
              <option value={5}>Level 5 - AI Innovator</option>
              <option value={6}>Level 6 - AI Grandmaster</option>
            </select>
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
              <span>Comprehensive Problem Description & Expected Deliverables <span className="text-red-500">*</span></span>
            </label>
            <textarea 
              required
              rows={4} 
              placeholder="Outline the technical problem context, dataset specifications, GPU computation constraints, and expected evaluation benchmark..." 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              className={inputClass} 
            />
          </div>

          {/* Modal Sticky Actions */}
          <div className="mt-2 flex items-center justify-end gap-3 sm:col-span-2 pt-3 border-t border-slate-100">
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
    </div>
  );
}
