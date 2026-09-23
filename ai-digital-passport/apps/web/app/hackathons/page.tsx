"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalHackathons } from "../../components/modules/ExternalHackathons";
import { StudentShell } from "../../components/shell/StudentShell";
import { Spinner } from "../../components/ui/Spinner";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { useScoringPoints } from "../../lib/use-scoring-points";
import { externalHackathonsApi, hackathonsApi, type HackathonResponse } from "../../lib/api";
import {
  Flag,
  Sparkles,
  Calendar,
  Users,
  ArrowUpRight,
  CheckCircle2,
  X,
  Send,
  Layers,
  Trophy,
  TrendingUp,
} from "lucide-react";

export default function HackathonsPage() {
  const queryClient = useQueryClient();
  const winPoints = useScoringPoints("industry_hackathon_win");

  // Internal, admin-published hackathons with real team registration.
  const hackathons = useQuery({ queryKey: ["hackathons"], queryFn: hackathonsApi.list });
  const items = hackathons.data ?? [];

  // External hackathons — same table & the exact same list() call the admin/mentor
  // "Add hackathon" form writes to and the admin Hackathons page's own KPI cards
  // are computed from, so anything either role adds shows up here identically.
  const external = useQuery({ queryKey: ["hackathons", "external"], queryFn: externalHackathonsApi.list });
  const extList = external.data ?? [];
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const isOver = (h: { ends_at: string | null; deadline_at: string | null }) => {
    const end = h.ends_at ?? h.deadline_at;
    return !!end && new Date(end).getTime() < now;
  };
  const activeExternalCount = extList.filter((h) => !isOver(h)).length;
  const myRegistrations = extList.filter((h) => h.registered).length;
  const myApproved = extList.filter((h) => h.registrationStatus === "APPROVED").length;
  const upcoming = extList.filter((h) => h.deadline_at && new Date(h.deadline_at).getTime() >= now);
  const closingSoon = upcoming.filter((h) => new Date(h.deadline_at as string).getTime() - now <= 7 * DAY).length;
  const extLoading = external.isLoading;
  const show = (n: number | string) => (extLoading ? "…" : n);

  const [activeHackathon, setActiveHackathon] = useState<HackathonResponse | null>(null);
  const [teamName, setTeamName] = useState("");
  const [problemId, setProblemId] = useState("");

  const registerTeam = useMutation({
    mutationFn: (input: { hackathonId: string; name: string; problemId?: string }) =>
      hackathonsApi.createTeam(input.hackathonId, { name: input.name, problemId: input.problemId || undefined, memberIds: [] }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hackathons"] }),
  });

  function closeModal() {
    setActiveHackathon(null);
    setTeamName("");
    setProblemId("");
    registerTeam.reset();
  }

  return (
    <StudentShell>
      <div className="space-y-6">

        {/* Top Header Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 lg:p-8 shadow-xs">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-gradient-to-br from-[#1755A7]/10 to-[#F8C401]/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-3xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1755A7]/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#1755A7]">
                  <Sparkles className="h-3.5 w-3.5 text-[#F8C401]" />
                  AI Innovation & Hackathons
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900">Hackathons & Team Challenges</h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Every hackathon added here by admin or by a faculty mentor shows up below automatically. Register a team for an admin-published hackathon, or register for an external one.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/claims/new?category=industry_hackathon_win"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1755A7] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#134486] hover:shadow-md hover:shadow-[#1755A7]/20 active:scale-95"
              >
                Submit Hackathon Win Evidence
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* KPI cards — same visual language as the admin/mentor Hackathons page,
            computed from the exact same externalHackathonsApi.list() call. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
            <div className="absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#1755A7] via-[#2563EB] to-[#38BDF8]" />
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Active Hackathons</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1755A7]/15 to-[#2563EB]/10 text-[#1755A7]">
                <Trophy className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-slate-900">{show(activeExternalCount)}</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
                <TrendingUp className="h-3 w-3" /> Live
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
              <span>Total recorded</span>
              <span className="font-bold text-slate-800">{show(extList.length)}</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
            <div className="absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#1755A7] via-[#F8C401] to-[#EA580C]" />
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">My Registrations</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#F8C401]/25 to-[#EA580C]/15 text-amber-600">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="bg-gradient-to-r from-[#1755A7] to-[#2563EB] bg-clip-text text-3xl font-black tracking-tight text-transparent">{show(myRegistrations)}</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
                <CheckCircle2 className="h-3 w-3" /> {show(myApproved)} approved
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
              <span>Max bounty</span>
              <span className="font-bold text-slate-800">{winPoints != null ? `+${winPoints} pts` : "—"}</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-amber-400/40 hover:shadow-md transition-all">
            <div className="absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#38BDF8] via-[#F59E0B] to-[#EA580C]" />
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Upcoming Deadlines</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-400/15 text-amber-600">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-slate-900">{show(upcoming.length)}</span>
              {closingSoon > 0 && (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Closing soon</span>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
              <span>Next 7 days</span>
              <span className="font-bold text-slate-800">{show(closingSoon)} {closingSoon === 1 ? "event" : "events"}</span>
            </div>
          </div>
        </div>

        {/* Internal Hackathons — admin-published, with real team registration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Admin-Published Hackathons</h2>
          </div>

          {hackathons.isLoading ? (
            <div className="flex min-h-[20vh] items-center justify-center"><Spinner label="Loading hackathons…" /></div>
          ) : hackathons.isError ? (
            <ErrorBanner error={hackathons.error} />
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-10 text-center text-sm text-slate-500">
              No hackathons have been published yet. Check the list below for hackathons added by admin or faculty mentors.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {items.map((hack) => (
                <div
                  key={hack.hackathon_id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs transition-all hover:border-[#1755A7]/40 hover:shadow-md"
                >
                  <div>
                    <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-800 text-white flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                        {hack.status}
                      </span>
                      <span className="text-[11px] font-bold">{hack.teams.length} team{hack.teams.length === 1 ? "" : "s"}</span>
                    </div>

                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="text-base font-black text-slate-900 leading-snug">{hack.title}</h3>
                        <p className="mt-2 text-xs text-slate-600 leading-relaxed line-clamp-3">{hack.description}</p>
                      </div>

                      <div className="space-y-2 border-y border-slate-100 py-3 text-xs">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="flex items-center gap-1.5 font-medium"><Calendar className="h-3.5 w-3.5 text-slate-400" /> Timeline</span>
                          <span className="font-bold text-slate-900">
                            {new Date(hack.starts_at).toLocaleDateString()} – {new Date(hack.ends_at).toLocaleDateString()}
                          </span>
                        </div>
                        {hack.theme && (
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="flex items-center gap-1.5 font-medium"><Layers className="h-3.5 w-3.5 text-slate-400" /> Theme</span>
                            <span className="font-bold text-slate-900">{hack.theme}</span>
                          </div>
                        )}
                      </div>

                      {hack.problems.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Problem Tracks:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {hack.problems.map((p) => (
                              <span key={p.problem_id} className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                                {p.title}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 pt-0">
                    <button
                      type="button"
                      onClick={() => setActiveHackathon(hack)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1755A7] py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#134486] active:scale-95"
                    >
                      Register Team
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* External Hackathons — identical table/component the admin and mentor Hackathons
            pages use (components/modules/ExternalHackathons.tsx), read-only here. Anything
            an admin OR a mentor adds/syncs lands in the same table and appears below. */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-[#1755A7]" />
            <h2 className="text-lg font-black text-slate-900 tracking-tight">External Hackathons</h2>
          </div>
          <ExternalHackathons canManage={false} />
        </div>

        {/* Team Registration Modal — calls hackathonsApi.createTeam, persists to HackathonTeam */}
        {activeHackathon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
                    <Flag className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Register Team</h3>
                    <p className="text-[11px] text-slate-500">{activeHackathon.title}</p>
                  </div>
                </div>
                <button type="button" onClick={closeModal} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {registerTeam.isSuccess ? (
                <div className="p-6 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="text-base font-black text-slate-900">Team Registered</h4>
                  <p className="text-xs text-slate-600">
                    You've been registered as team lead. You can submit your project from your team once ready.
                  </p>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#1755A7] px-4 py-2 text-xs font-bold text-white hover:bg-[#134486] transition-all"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    registerTeam.mutate({ hackathonId: activeHackathon.hackathon_id, name: teamName, problemId });
                  }}
                  className="space-y-4 text-xs font-medium text-slate-700"
                >
                  {registerTeam.isError && <ErrorBanner error={registerTeam.error} />}

                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Team Name</label>
                    <input
                      type="text"
                      required
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="e.g. NeuralVanguard"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-[#1755A7] focus:outline-none"
                    />
                  </div>

                  {activeHackathon.problems.length > 0 && (
                    <div>
                      <label className="block font-bold text-slate-900 mb-1">Problem Track (optional)</label>
                      <select
                        value={problemId}
                        onChange={(e) => setProblemId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-[#1755A7] focus:outline-none bg-white"
                      >
                        <option value="">No specific track</option>
                        {activeHackathon.problems.map((p) => (
                          <option key={p.problem_id} value={p.problem_id}>{p.title}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Users className="h-3.5 w-3.5" /> You'll be registered as team lead. Add teammates later from your team.
                  </p>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={registerTeam.isPending}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#1755A7] px-4 py-2 font-bold text-white hover:bg-[#134486] transition-all shadow-xs disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {registerTeam.isPending ? "Registering…" : "Complete Registration"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </StudentShell>
  );
}
