"use client";

import { useState } from "react";
import Link from "next/link";
import { StudentShell } from "../../components/shell/StudentShell";
import { 
  Award, 
  Sparkles, 
  Trophy, 
  Medal, 
  Crown, 
  ShieldCheck, 
  ArrowUpRight, 
  CheckCircle2, 
  Star, 
  X, 
  Send,
  Zap,
  Building
} from "lucide-react";

interface AwardHonor {
  id: string;
  title: string;
  category: string;
  prize: string;
  criteria: string;
  badgeColor: string;
  icon: typeof Trophy;
}

const AWARDS: AwardHonor[] = [
  {
    id: "award-1",
    title: "AI Student Scholar of the Year",
    category: "Flagship Honor",
    prize: "₹1,00,000 Cash + DGX Fellow Medal",
    criteria: "Highest cumulative points, Level 5 Grandmaster status, and top-tier research publication.",
    badgeColor: "from-amber-500 to-yellow-600",
    icon: Crown,
  },
  {
    id: "award-2",
    title: "NVIDIA DGX Supercomputing Pioneer",
    category: "Compute & Architecture",
    prize: "500 H100 GPU Hours + Hardware Kit",
    criteria: "Demonstrated multi-node distributed training and TensorRT-LLM kernel optimizations.",
    badgeColor: "from-blue-600 to-indigo-700",
    icon: Zap,
  },
  {
    id: "award-3",
    title: "Best Neural Model Architecture Award",
    category: "Innovation & R&D",
    prize: "₹50,000 + Conference Travel Grant",
    criteria: "Novel model architecture with published IEEE/CVPR preprint or verified benchmark.",
    badgeColor: "from-emerald-600 to-teal-700",
    icon: Trophy,
  },
  {
    id: "award-4",
    title: "AI Startup Founder of the Year",
    category: "Venture & Incubation",
    prize: "₹2,50,000 Seed Equity Match",
    criteria: "Reached Stage 4+ in Startup Launchpad with customer validation and prototype deployment.",
    badgeColor: "from-purple-600 to-pink-700",
    icon: Medal,
  },
  {
    id: "award-5",
    title: "Grand Hackathon Champion",
    category: "Competitive Coding",
    prize: "₹75,000 + NVIDIA Inception Fast-track",
    criteria: "First-place finish in Sri Eshwar NVIDIA AI Grand Challenge or National Buildathon.",
    badgeColor: "from-rose-600 to-orange-600",
    icon: Star,
  },
  {
    id: "award-6",
    title: "Most Active Continuous AI Learner",
    category: "Curriculum Excellence",
    prize: "Full DLI Exam Sponsorships",
    criteria: "100% completion of NVIDIA DLI courses and zero proctoring violations.",
    badgeColor: "from-cyan-600 to-blue-700",
    icon: Award,
  },
];

export default function AwardsPage() {
  const [activeNomination, setActiveNomination] = useState<AwardHonor | null>(null);
  const [nominatedSuccess, setNominatedSuccess] = useState(false);

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
                  Annual AI Excellence Awards
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200/60">
                  <Trophy className="h-3 w-3 text-amber-600" />
                  Nominations Open
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900">Sri Eshwar AI Honors & Recognition</h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Celebrating outstanding scholars, researchers, founders, and GPU innovators. Final award winners are audited and felicitated at the annual Sri Eshwar NVIDIA AI Summit.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/leaderboard"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1755A7] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#134486] hover:shadow-md hover:shadow-[#1755A7]/20 active:scale-95"
              >
                View Global Leaderboard
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* 4 KPI Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Award Categories</div>
            <div className="mt-2 text-2xl font-black text-slate-900">8 Honors</div>
            <div className="mt-1 text-xs text-slate-500">Student & Researcher tracks</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Award Purse</div>
            <div className="mt-2 text-2xl font-black text-amber-600">₹6,50,000</div>
            <div className="mt-1 text-xs text-slate-500">Direct cash & seed grants</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Audited Signals</div>
            <div className="mt-2 text-2xl font-black text-emerald-600">Points & Impact</div>
            <div className="mt-1 text-xs text-slate-500">Zero subjectivity governance</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Annual Gala Date</div>
            <div className="mt-2 text-2xl font-black text-[#1755A7]">Dec 18, 2026</div>
            <div className="mt-1 text-xs text-slate-500">NVIDIA Executive Ceremony</div>
          </div>
        </div>

        {/* Award Categories Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Prestigious Honors & Trophies</h2>
            <span className="text-xs font-bold text-slate-400">Self-nomination and mentor nomination available</span>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {AWARDS.map((award) => {
              const Icon = award.icon;
              return (
                <div
                  key={award.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs transition-all hover:border-[#1755A7]/40 hover:shadow-md"
                >
                  <div>
                    {/* Header Gradient */}
                    <div className={`p-4 bg-gradient-to-r ${award.badgeColor} text-white flex items-center justify-between`}>
                      <span className="text-[10px] font-black uppercase tracking-wider opacity-90">
                        {award.category}
                      </span>
                      <Icon className="h-4 w-4 text-white" />
                    </div>

                    <div className="p-6 space-y-3">
                      <h3 className="text-base font-black text-slate-900 leading-snug">{award.title}</h3>
                      
                      <div className="rounded-xl bg-amber-50/80 border border-amber-200/60 p-3 text-xs font-bold text-amber-900 flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>{award.prize}</span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed pt-1">
                        {award.criteria}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 pt-0">
                    <button
                      type="button"
                      onClick={() => setActiveNomination(award)}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-800 active:scale-95"
                    >
                      Submit Nomination
                      <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selection Signals & Audit Process */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Governance & Selection Signals</h3>
                <p className="text-[11px] text-slate-500">Immutable scoring algorithm backed by system logs</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-900">1. Total Verified Competency Points</span>
                <span className="font-mono font-bold text-[#1755A7]">40% Weightage</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-900">2. Research Papers & Granted Patents</span>
                <span className="font-mono font-bold text-amber-700">25% Weightage</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-900">3. GPU SuperPOD Workload Quality</span>
                <span className="font-mono font-bold text-emerald-700">20% Weightage</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-900">4. Mentor & Industry Peer Nominations</span>
                <span className="font-mono font-bold text-purple-700">15% Weightage</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
                <Crown className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Annual Felicitations & Privileges</h3>
                <p className="text-[11px] text-slate-500">Exclusive lifetime benefits for awardees</p>
              </div>
            </div>

            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">NVIDIA Executive Dinner & Plaque:</strong> Formal presentation with NVIDIA South Asia leadership team.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">Permanent Hall of Fame:</strong> Featured on the college website and annual institutional report.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">Direct Incubator Seed Allocation:</strong> Fast-track grant approval for deep-tech commercialization.
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Nomination Modal Dialog */}
        {activeNomination && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
                    <Award className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Submit Award Nomination</h3>
                    <p className="text-[11px] text-slate-500">{activeNomination.title}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveNomination(null);
                    setNominatedSuccess(false);
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {nominatedSuccess ? (
                <div className="p-6 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="text-base font-black text-slate-900">Nomination Filed Successfully!</h4>
                  <p className="text-xs text-slate-600">
                    Your portfolio and impact dossier have been registered for the annual audit committee review.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setNominatedSuccess(true);
                  }}
                  className="space-y-4 text-xs font-medium text-slate-700"
                >
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Nomination Statement & Impact Summary</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Detail your major technical milestones, model deployments, papers, or hackathon wins that qualify you for this honor…"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-[#1755A7] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Dossier / Portfolio URL (Google Drive / GitHub)</label>
                    <input
                      type="url"
                      required
                      placeholder="https://drive.google.com/..."
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-[#1755A7] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveNomination(null)}
                      className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#1755A7] px-4 py-2 font-bold text-white hover:bg-[#134486] transition-all shadow-xs"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Submit Nomination
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
