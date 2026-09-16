"use client";

import { useState } from "react";
import Link from "next/link";
import { StudentShell } from "../../components/shell/StudentShell";
import { 
  Flag, 
  Sparkles, 
  Calendar, 
  Users, 
  Trophy, 
  ArrowUpRight, 
  CheckCircle2, 
  Layers, 
  Cpu, 
  Clock, 
  X, 
  Send,
  Zap,
  Flame,
  Award
} from "lucide-react";

interface HackathonEvent {
  id: string;
  title: string;
  tagline: string;
  status: "REGISTRATION_OPEN" | "HACKING_LIVE" | "UPCOMING";
  date: string;
  teamSize: string;
  prizePool: string;
  pointsBounty: number;
  tracks: string[];
  bannerGradient: string;
}

const HACKATHONS: HackathonEvent[] = [
  {
    id: "hack-1",
    title: "Sri Eshwar NVIDIA AI Grand Challenge 2026",
    tagline: "48-hour national flagship hackathon building generative AI, autonomous robotics, and edge solutions on NVIDIA DGX SuperPOD.",
    status: "REGISTRATION_OPEN",
    date: "Oct 24 - 26, 2026",
    teamSize: "2 - 4 Members",
    prizePool: "₹2,50,000 Cash + DGX Compute",
    pointsBounty: 350,
    tracks: ["Enterprise LLMs", "Robotics & Isaac Sim", "Vision & Edge AI", "Healthcare BioNeMo"],
    bannerGradient: "from-blue-600 to-indigo-800",
  },
  {
    id: "hack-2",
    title: "National GenAI Buildathon Sprint",
    tagline: "Fast-paced 24-hour sprint crafting high-throughput agentic workflows and local fine-tuned SLMs with TensorRT-LLM.",
    status: "REGISTRATION_OPEN",
    date: "Nov 12 - 13, 2026",
    teamSize: "1 - 3 Members",
    prizePool: "₹1,00,000 + NVIDIA Badges",
    pointsBounty: 250,
    tracks: ["Multi-Agent Orchestration", "Function Calling", "Local SLM Deployment"],
    bannerGradient: "from-amber-600 to-amber-800",
  },
  {
    id: "hack-3",
    title: "Edge AI & Smart Mobility Challenge",
    tagline: "Deploy real-time inference models onto NVIDIA Jetson Orin micro-controllers for smart city traffic and collision warning systems.",
    status: "UPCOMING",
    date: "Dec 05 - 07, 2026",
    teamSize: "2 - 4 Members",
    prizePool: "₹1,50,000 + Hardware Kits",
    pointsBounty: 300,
    tracks: ["Smart City", "Autonomous Telemetry", "Embedded Vision"],
    bannerGradient: "from-emerald-600 to-teal-800",
  },
];

export default function HackathonsPage() {
  const [activeHackathon, setActiveHackathon] = useState<HackathonEvent | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

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
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  3 Live Seasons
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900">National AI Hackathons & Grand Challenges</h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Compete against top engineering teams nationwide. Build production-grade AI prototypes on Sri Eshwar DGX Supercomputing clusters, earn up to +350 competency points, cash grants, and verified NVIDIA certificates.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/claims/new?category=industry_hackathon_win"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1755A7] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#134486] hover:shadow-md hover:shadow-[#1755A7]/20 active:scale-95"
              >
                Submit Hackathon Win / Repo
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* 4 KPI Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Prize Pool</div>
            <div className="mt-2 text-2xl font-black text-amber-600">₹5,00,000+</div>
            <div className="mt-1 text-xs text-slate-500">Cash awards & seed incubation</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Max Points Bounty</div>
            <div className="mt-2 text-2xl font-black text-[#1755A7]">+350 pts</div>
            <div className="mt-1 text-xs text-slate-500">Per accredited hackathon win</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">SuperPOD Cluster Access</div>
            <div className="mt-2 text-2xl font-black text-emerald-600">Unrestricted</div>
            <div className="mt-1 text-xs text-slate-500">Dedicated H100 GPU nodes</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Jury & Mentors</div>
            <div className="mt-2 text-2xl font-black text-slate-900">NVIDIA & IIT</div>
            <div className="mt-1 text-xs text-slate-500">Industry panel evaluation</div>
          </div>
        </div>

        {/* Hackathon Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Active & Upcoming Hackathon Seasons</h2>
            <span className="text-xs font-bold text-slate-400">Registration open for verified student scholars</span>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {HACKATHONS.map((hack) => (
              <div
                key={hack.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs transition-all hover:border-[#1755A7]/40 hover:shadow-md"
              >
                <div>
                  {/* Top Badge Strip */}
                  <div className={`p-4 bg-gradient-to-r ${hack.bannerGradient} text-white flex items-center justify-between`}>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                      <Flame className="h-3 w-3 text-amber-300" />
                      {hack.status.replace("_", " ")}
                    </span>
                    <span className="font-mono text-xs font-bold text-amber-200">
                      +{hack.pointsBounty} pts
                    </span>
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-base font-black text-slate-900 leading-snug">{hack.title}</h3>
                      <p className="mt-2 text-xs text-slate-600 leading-relaxed">{hack.tagline}</p>
                    </div>

                    <div className="space-y-2 border-y border-slate-100 py-3 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1.5 font-medium"><Calendar className="h-3.5 w-3.5 text-slate-400" /> Timeline</span>
                        <span className="font-bold text-slate-900">{hack.date}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1.5 font-medium"><Users className="h-3.5 w-3.5 text-slate-400" /> Squad Size</span>
                        <span className="font-bold text-slate-900">{hack.teamSize}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1.5 font-medium"><Trophy className="h-3.5 w-3.5 text-amber-500" /> Grand Prize</span>
                        <span className="font-bold text-amber-700">{hack.prizePool}</span>
                      </div>
                    </div>

                    {/* Track Badges */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Challenge Tracks:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {hack.tracks.map((t, tIdx) => (
                          <span key={tIdx} className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <button
                    type="button"
                    onClick={() => setActiveHackathon(hack)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1755A7] py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#134486] active:scale-95"
                  >
                    Register Squad
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evaluation Rubric & Workflow */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Rubric Breakdown */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Official Evaluation Rubric (100 Pts Total)</h3>
                <p className="text-[11px] text-slate-500">Graded by NVIDIA AI architects & faculty mentors</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-800">1. Problem Formulation & Innovation (30%)</span>
                  <span className="text-[#1755A7]">30 Pts</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-[#1755A7]" style={{ width: "30%" }} />
                </div>
                <p className="text-[11px] text-slate-500">Novelty of algorithmic approach and technical rigor.</p>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-800">2. NVIDIA GPU Supercomputing Architecture (25%)</span>
                  <span className="text-amber-600">25 Pts</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: "25%" }} />
                </div>
                <p className="text-[11px] text-slate-500">CUDA, TensorRT, Triton or NeMo acceleration depth.</p>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-800">3. Real-world Impact & Deployment Readiness (25%)</span>
                  <span className="text-emerald-600">25 Pts</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: "25%" }} />
                </div>
                <p className="text-[11px] text-slate-500">Production latency benchmarks and user ergonomics.</p>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-800">4. Live Demonstration & Pitch (20%)</span>
                  <span className="text-purple-600">20 Pts</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-purple-500" style={{ width: "20%" }} />
                </div>
                <p className="text-[11px] text-slate-500">Defense before executive jury and clean repository structure.</p>
              </div>
            </div>
          </div>

          {/* Submission Guidelines */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Submission Deliverables Required</h3>
                <p className="text-[11px] text-slate-500">Must be submitted before hackathon deadline</p>
              </div>
            </div>

            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">Public GitHub Repository:</strong> Must include clean README, setup instructions, architecture diagram, and license.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">2-Minute Loom / YouTube Video:</strong> Uncut live prototype demonstration displaying inference logs.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">Slide Deck (PDF):</strong> 6-slide executive presentation covering Problem, Tech Stack, GPU Acceleration, and Roadmap.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">Mentor Endorsement:</strong> Faculty mentor signoff confirming authentic student authorship.
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Squad Registration Modal Dialog */}
        {activeHackathon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
                    <Flag className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Register Squad for Hackathon</h3>
                    <p className="text-[11px] text-slate-500">{activeHackathon.title}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveHackathon(null);
                    setRegisteredSuccess(false);
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {registeredSuccess ? (
                <div className="p-6 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="text-base font-black text-slate-900">Squad Registered Successfully!</h4>
                  <p className="text-xs text-slate-600">
                    Your team registration token and Discord hackathon channel invite have been dispatched to your email.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setRegisteredSuccess(true);
                  }}
                  className="space-y-4 text-xs font-medium text-slate-700"
                >
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Squad / Team Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. NeuralVanguard"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-[#1755A7] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-900 mb-1">Primary Track</label>
                      <select className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-[#1755A7] focus:outline-none bg-white">
                        {activeHackathon.tracks.map((t, idx) => (
                          <option key={idx} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-900 mb-1">Team Size</label>
                      <select className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-[#1755A7] focus:outline-none bg-white">
                        <option value="1">Solo Hacker (1)</option>
                        <option value="2">2 Members</option>
                        <option value="3">3 Members</option>
                        <option value="4">4 Members (Squad)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Squad Lead Email (SECE Domain)</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. student@sece.ac.in"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-[#1755A7] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 mb-1">GPU SuperPOD Node Request</label>
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <Cpu className="h-4 w-4 text-[#1755A7] shrink-0" />
                      <span className="text-[11px] text-slate-600">
                        Automatically provision 24 GPU hours on NVIDIA H100 cluster for this squad.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveHackathon(null)}
                      className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#1755A7] px-4 py-2 font-bold text-white hover:bg-[#134486] transition-all shadow-xs"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Complete Squad Registration
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
