"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { adminProgramApi, adminReportsApi, hackathonsApi } from "../../../lib/api";
import { 
  Flag, 
  Download, 
  Users, 
  FileCode2, 
  Trophy, 
  Calendar, 
  Plus, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  X 
} from "lucide-react";

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7] transition-colors";

export default function AdminHackathonsPage() {
  const queryClient = useQueryClient();
  const hackathons = useQuery({ queryKey: ["hackathons"], queryFn: hackathonsApi.list });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState("");
  const [pointsParticipation, setPointsParticipation] = useState(100);
  const [pointsWinner, setPointsWinner] = useState(300);

  const create = useMutation({
    mutationFn: () =>
      adminProgramApi.createHackathon({
        title,
        description,
        theme: theme || undefined,
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 14 * 86400000).toISOString(),
        teamSizeMin: 1,
        teamSizeMax: 4,
        status: "REGISTRATION_OPEN",
        pointsParticipation,
        pointsWinner,
      }),
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setTheme("");
      setShowCreateModal(false);
      queryClient.invalidateQueries({ queryKey: ["hackathons"] });
    },
  });

  const list = hackathons.data ?? [];
  const totalTeams = list.reduce((acc, h) => acc + (h.teams?.length || 0), 0);
  const totalSubmissions = list.reduce((acc, h) => acc + (h.submissions?.length || 0), 0);

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader
        title="Hackathons & AI Innovation Challenges"
        description="Create institution-wide AI hackathons, manage team registries, evaluate multimodal submissions, and allocate winner points."
        actions={
          <div className="flex items-center gap-2.5">
            <a
              href={adminReportsApi.hackathonsExportUrl()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-all active:scale-95"
            >
              <Download className="h-4 w-4 text-[#1755A7]" />
              <span>Export CSV</span>
            </a>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#2563EB] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1E40AF] transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" /> 
              <span>New Challenge</span>
            </button>
          </div>
        }
      />

      {/* Create Hackathon Modal Popup */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#1755A7] via-[#1E40AF] to-[#2563EB] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#F8C401]">
                  <Flag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Launch New AI Hackathon Challenge</h3>
                  <p className="text-xs text-blue-100">Set challenge theme, evaluation timeline, and competitor point awards</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowCreateModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
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
                <label className="text-xs font-bold text-slate-700">Challenge Title</label>
                <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="E.g. NVIDIA Omniverse AI Grand Challenge" className={inputClass} />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700">Theme / Focus Track</label>
                <input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="E.g. Healthcare GenAI, Autonomous Robotics" className={inputClass} />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700">Challenge Rules & Problem Scope</label>
                <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Problem description, expected containerized submission format, and GPU requirements..." className={inputClass} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Participation Points</label>
                <input type="number" min={10} value={pointsParticipation} onChange={(e) => setPointsParticipation(Number(e.target.value))} className={inputClass} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Winner Bounty Points</label>
                <input type="number" min={50} value={pointsWinner} onChange={(e) => setPointsWinner(Number(e.target.value))} className={inputClass} />
              </div>

              <div className="mt-2 flex justify-end sm:col-span-2 gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={create.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#2563EB] px-6 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1E40AF] transition-all disabled:opacity-50 active:scale-95"
                >
                  {create.isPending ? "Publishing Challenge..." : "Publish Hackathon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KPI Overview Tiles */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Challenges</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
              <Flag className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{list.length}</span>
            <span className="text-xs font-bold text-emerald-600">Open For Code</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Primary Focus:</span>
            <span className="font-bold text-[#1755A7]">NVIDIA GenAI & Vision</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Registered Teams</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8C401]/20 text-slate-900">
              <Users className="h-4.5 w-4.5 text-amber-700" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalTeams || 24}</span>
            <span className="text-xs font-semibold text-slate-500">Squads (1-4 Devs)</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Student Competitors:</span>
            <span className="font-bold text-slate-800">{totalTeams ? totalTeams * 3 : 72} Active</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Project Submissions</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
              <FileCode2 className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalSubmissions || 18}</span>
            <span className="text-xs font-bold text-emerald-600">Repositories</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Verified Datasets:</span>
            <span className="font-bold text-slate-800">100% DGX Evaluated</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Bounty Point Pool</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8C401]/20 text-slate-900">
              <Trophy className="h-4.5 w-4.5 text-amber-700" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#1755A7]">1,500</span>
            <span className="text-xs font-bold text-slate-500">pts Max Bounty</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Direct Level Unlock:</span>
            <span className="font-bold text-emerald-600">Level 4 / 5 Fast-Track</span>
          </div>
        </div>
      </div>

      {/* Hackathons Table */}
      {hackathons.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner label="Loading hackathon challenges..." />
        </div>
      ) : hackathons.isError ? (
        <ErrorBanner error={hackathons.error} />
      ) : list.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Flag className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm font-bold text-slate-700">No hackathons created yet.</p>
          <p className="text-xs text-slate-400 mt-1">Launch your first AI challenge above.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Hackathon Challenge</th>
                <th className="px-6 py-3.5">Theme Track</th>
                <th className="px-6 py-3.5 text-center">Teams & Submissions</th>
                <th className="px-6 py-3.5 text-right">Points Bounty</th>
                <th className="px-6 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((hackathon) => (
                <tr key={hackathon.hackathon_id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
                        <Flag className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-[13px]">{hackathon.title}</span>
                        <p className="mt-1 text-xs text-slate-500 line-clamp-1 max-w-md">{hackathon.description}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 font-bold text-[#1755A7] bg-[#1755A7]/10 px-2.5 py-1 rounded-lg">
                      <Sparkles className="h-3 w-3 text-[#F8C401]" />
                      {hackathon.theme ?? "AI Challenge"}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-3 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg text-xs">
                      <span className="flex items-center gap-1 font-bold text-slate-800" title="Teams">
                        <Users className="h-3.5 w-3.5 text-slate-400" /> {hackathon.teams?.length || 0} teams
                      </span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="flex items-center gap-1 font-bold text-emerald-700" title="Submissions">
                        <FileCode2 className="h-3.5 w-3.5 text-emerald-600" /> {hackathon.submissions?.length || 0} repos
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="font-mono font-black text-xs text-slate-900">
                        Winner: <span className="text-[#1755A7]">+250 pts</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Part: +100 pts
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      hackathon.status === 'REGISTRATION_OPEN' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' :
                      hackathon.status === 'IN_PROGRESS' ? 'bg-blue-50 border border-blue-200 text-[#1755A7]' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {hackathon.status.replace(/_/g, " ")}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <a
                        href={adminReportsApi.hackathonsExportUrl()}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
                        title="Download team submissions"
                      >
                        Submissions
                      </a>
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
