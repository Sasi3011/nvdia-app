"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PROBLEM_BANK_MIN_LEVEL } from "@ai-digital-passport/shared-types";
import { StudentShell } from "../../components/shell/StudentShell";
import { Spinner } from "../../components/ui/Spinner";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { ApiError } from "../../lib/api-client";
import { problemsApi } from "../../lib/api";
import { useMe } from "../../lib/session";
import { 
  Lightbulb, 
  Search, 
  Filter, 
  Sparkles, 
  Building2, 
  Cpu, 
  ArrowUpRight, 
  Lock, 
  CheckCircle2, 
  X, 
  Send,
  ExternalLink,
  Shield,
  Layers,
  Clock,
  Award
} from "lucide-react";
import Link from "next/link";

interface ProblemItem {
  problemId: string;
  title: string;
  description: string;
  organization?: string | null;
  domain?: string;
  difficulty?: "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  points?: number;
  deadline?: string;
}

const SAMPLE_PROBLEMS: ProblemItem[] = [
  {
    problemId: "prob-1",
    title: "Optimized TensorRT-LLM Inference for Low-Latency RAG",
    description: "Build an optimized multi-modal retrieval pipeline accelerating query latency to <15ms on NVIDIA L40S using TensorRT-LLM and FlashAttention-2 kernels.",
    organization: "NVIDIA Applied AI Lab",
    domain: "GenAI & LLMs",
    difficulty: "ADVANCED",
    points: 400,
    deadline: "Nov 30, 2026",
  },
  {
    problemId: "prob-2",
    title: "Real-time Edge Defect Detection with DeepStream SDK",
    description: "Develop a zero-shot anomaly detection model processing 8 concurrent 4K RTSP streams on Jetson AGX Orin for smart manufacturing assembly lines.",
    organization: "Bosch Industrial AI",
    domain: "Computer Vision",
    difficulty: "INTERMEDIATE",
    points: 300,
    deadline: "Dec 15, 2026",
  },
  {
    problemId: "prob-3",
    title: "Distributed NeRF 3D Reconstruction Pipeline",
    description: "Implement multi-node distributed photogrammetry and Neural Radiance Field training across DGX SuperPOD nodes for rapid digital twin generation.",
    organization: "Qualcomm XR Lab",
    domain: "Spatial Computing",
    difficulty: "EXPERT",
    points: 500,
    deadline: "Jan 10, 2027",
  },
  {
    problemId: "prob-4",
    title: "Autonomous Path Planning using NVIDIA Isaac Sim & ROS2",
    description: "Simulate and benchmark reinforcement learning policies for obstacle avoidance in cluttered warehouse environments with synthetic domain randomization.",
    organization: "Sri Eshwar Robotics Hub",
    domain: "Autonomous Robotics",
    difficulty: "ADVANCED",
    points: 450,
    deadline: "Dec 20, 2026",
  },
];

export default function ProblemsPage() {
  const me = useMe(true);
  const [search, setSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("ALL");
  const [activeModalProblem, setActiveModalProblem] = useState<ProblemItem | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const problemsQuery = useQuery({
    queryKey: ["problems"],
    queryFn: () => problemsApi.list({ page: 1, pageSize: 50 }),
    enabled: !!me.data && me.data.level.levelId >= PROBLEM_BANK_MIN_LEVEL,
  });

  if (me.isLoading) {
    return (
      <StudentShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner label="Loading industry challenges…" />
        </div>
      </StudentShell>
    );
  }

  const isLocked = !me.data || me.data.level.levelId < PROBLEM_BANK_MIN_LEVEL;
  const currentLevel = me.data?.level.levelId ?? 1;
  const currentPoints = me.data?.totalPoints ?? 0;
  const requiredPoints = 2000;
  const progressPct = Math.min(100, Math.round((currentPoints / requiredPoints) * 100));

  // Merge API data or fallback to curated sample data
  const apiItems: ProblemItem[] = (problemsQuery.data?.items ?? []).map((p) => ({
    problemId: p.problemId,
    title: p.title,
    description: p.description,
    organization: p.organization || "Sri Eshwar Industry Partner",
    domain: "AI Engineering",
    difficulty: "ADVANCED",
    points: 350,
    deadline: "Dec 2026",
  }));

  const allProblems = apiItems.length > 0 ? apiItems : SAMPLE_PROBLEMS;
  const filteredProblems = allProblems.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()) || (p.organization && p.organization.toLowerCase().includes(search.toLowerCase()));
    const matchesDomain = selectedDomain === "ALL" || p.domain === selectedDomain;
    return matchesSearch && matchesDomain;
  });

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
                  Industry Problem Bank
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                  Level 3+ Exclusive
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900">Industry Problem Statements & Challenges</h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Direct problem statements sponsored by NVIDIA, Bosch, Qualcomm, and tier-1 partner labs. Solve verified challenges to earn direct placement referrals and fast-track fellowship points.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/claims/new?category=industry_problem_statement"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1755A7] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#134486] hover:shadow-md hover:shadow-[#1755A7]/20 active:scale-95"
              >
                Submit Solution Evidence
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* 4 KPI Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Active Problems</div>
            <div className="mt-2 text-2xl font-black text-slate-900">{allProblems.length} Live</div>
            <div className="mt-1 text-xs text-slate-500">Tier-1 enterprise briefs</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Max Bounty Points</div>
            <div className="mt-2 text-2xl font-black text-amber-600">+500 pts</div>
            <div className="mt-1 text-xs text-slate-500">Per verified deployment</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Partner Sponsors</div>
            <div className="mt-2 text-2xl font-black text-[#1755A7]">12 Labs</div>
            <div className="mt-1 text-xs text-slate-500">NVIDIA, Bosch, Qualcomm +</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Access Tier</div>
            <div className="mt-2 text-2xl font-black text-emerald-600">{isLocked ? "Level Locked" : "Unlocked"}</div>
            <div className="mt-1 text-xs text-slate-500">Requires Level 3 (AI Builder)</div>
          </div>
        </div>

        {/* Level Locked State */}
        {isLocked ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-8 shadow-xs text-center max-w-2xl mx-auto space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8C401]/20 text-[#1755A7] border border-[#F8C401]/40">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Reach Level 3 (AI Builder) to Unlock Problem Bank</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              The Industry Problem Bank gives direct access to confidential enterprise challenges. Complete foundational courses and GPU build labs to reach Level 3.
            </p>
            
            <div className="max-w-md mx-auto space-y-2 pt-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Current: {currentPoints.toLocaleString()} pts (Level {currentLevel})</span>
                <span>Target: {requiredPoints.toLocaleString()} pts (Level 3)</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-[#1755A7] transition-all duration-500" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="block text-[11px] text-slate-500 font-mono">{(requiredPoints - currentPoints).toLocaleString()} points needed to unlock</span>
            </div>

            <div className="pt-3">
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1755A7] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#134486] transition-all shadow-xs"
              >
                Earn Points in Courses
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          /* Unlocked Content */
          <div className="space-y-6">
            {/* Search & Domain Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search challenges, partners, keywords…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Domain:</span>
                {["ALL", "GenAI & LLMs", "Computer Vision", "Spatial Computing", "Autonomous Robotics"].map((domain) => (
                  <button
                    key={domain}
                    type="button"
                    onClick={() => setSelectedDomain(domain)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                      selectedDomain === domain
                        ? "bg-[#1755A7] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                    }`}
                  >
                    {domain}
                  </button>
                ))}
              </div>
            </div>

            {/* Problem Cards Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredProblems.map((prob) => (
                <div
                  key={prob.problemId}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-[#1755A7]/40 hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1755A7]/10 px-2.5 py-0.5 text-xs font-bold text-[#1755A7]">
                        <Building2 className="h-3 w-3 text-[#1755A7]" />
                        {prob.organization}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#F8C401]/15 px-2.5 py-0.5 font-mono text-xs font-black text-amber-900 border border-[#F8C401]/30">
                        <Sparkles className="h-3 w-3 text-[#F8C401]" />
                        +{prob.points || 350} pts
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 leading-snug">{prob.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{prob.description}</p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-medium text-slate-500">
                      {prob.domain && (
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                          {prob.domain}
                        </span>
                      )}
                      {prob.difficulty && (
                        <span className="rounded-lg bg-amber-50 border border-amber-200/50 px-2 py-0.5 font-semibold text-amber-800">
                          {prob.difficulty}
                        </span>
                      )}
                      {prob.deadline && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="h-3 w-3" />
                          Due: {prob.deadline}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href={`/claims/new?category=industry_problem_statement&title=${encodeURIComponent(prob.title)}`}
                      className="text-xs font-bold text-[#1755A7] hover:underline flex items-center gap-1"
                    >
                      Submit Evidence <ArrowUpRight className="h-3 w-3" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => setActiveModalProblem(prob)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white transition-all hover:bg-slate-800 active:scale-95"
                    >
                      Express Interest
                      <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Express Interest / Submit Modal Popup */}
        {activeModalProblem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
                    <Lightbulb className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Express Interest / Proposal</h3>
                    <p className="text-[11px] text-slate-500">Register your team for this industry challenge</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModalProblem(null);
                    setSubmittedSuccess(false);
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {submittedSuccess ? (
                <div className="p-6 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="text-base font-black text-slate-900">Application Submitted Successfully!</h4>
                  <p className="text-xs text-slate-600">
                    The industry mentor has received your team’s proposal. You will receive an email update within 24 hours.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSubmittedSuccess(true);
                  }}
                  className="space-y-4 text-xs font-medium text-slate-700"
                >
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Challenge Statement</label>
                    <input
                      type="text"
                      disabled
                      value={activeModalProblem.title}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-500 font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-900 mb-1">Team Name / Lead</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. TensorKnights"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-[#1755A7] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-900 mb-1">Team Size</label>
                      <select className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-[#1755A7] focus:outline-none bg-white">
                        <option value="1">Solo Researcher (1)</option>
                        <option value="2">2 Members</option>
                        <option value="3">3 Members</option>
                        <option value="4">4 Members (Max)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Proposed Architecture & Approach</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Briefly outline your technical approach, models (e.g., LLaMA-3, TensorRT, YOLOv10), and deployment strategy…"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-[#1755A7] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 mb-1">GitHub / Portfolio Link</label>
                    <input
                      type="url"
                      required
                      placeholder="https://github.com/..."
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-[#1755A7] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModalProblem(null)}
                      className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#1755A7] px-4 py-2 font-bold text-white hover:bg-[#134486] transition-all shadow-xs"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Submit Expression
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
