"use client";
import { useState } from "react";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalHackathons } from "../../components/modules/ExternalHackathons";
import { StudentShell } from "../../components/shell/StudentShell";
import { useScoringPoints } from "../../lib/use-scoring-points";
import { externalHackathonsApi, hackathonsApi, type HackathonResponse } from "../../lib/api";
import {
  Sparkles,
  Calendar,
  Users,
  CheckCircle2,
  Trophy,
  TrendingUp,
  Flag,
  X,
  Send,
  ArrowUpRight,
} from "lucide-react";

export default function HackathonsPage() {
  const queryClient = useQueryClient();
  const winPoints = useScoringPoints("industry_hackathon_win");

  const hackathons = useQuery({ queryKey: ["hackathons"], queryFn: hackathonsApi.list });
  const internalItems = hackathons.data ?? [];

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

        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Hackathons & Team Challenges
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Register a team for an admin-published hackathon, or participate in external ones.
            </p>
          </div>
          <Link
            href="/claims/new?category=industry_hackathon_win"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] via-[#1A5EB7] to-[#2563EB] px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1D4ED8] transition-all active:scale-95 shrink-0"
          >
            <Sparkles className="h-4 w-4 text-[#F8C401]" />
            <span>Submit Hackathon Win</span>
          </Link>
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

        <ExternalHackathons
          canManage={false}
          internalHackathons={internalItems}
          onRegisterInternal={setActiveHackathon}
        />

        {/* Team Registration Modal */}
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
                  {registerTeam.isError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                      Error registering team. Please try again.
                    </div>
                  )}

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
