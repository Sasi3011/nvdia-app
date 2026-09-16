"use client";

import { useState } from "react";
import { 
  ShieldCheck, 
  Cpu, 
  Sparkles, 
  QrCode, 
  Award, 
  Zap, 
  CheckCircle2
} from "lucide-react";

interface LevelData {
  level: number;
  name: string;
  points: number;
  gpuHours: number;
  badgeBg: string;
  privileges: string[];
  recentVerified: string;
}

const LEVEL_PRESETS: LevelData[] = [
  {
    level: 1,
    name: "AI Explorer",
    points: 120,
    gpuHours: 10,
    badgeBg: "bg-[#1755A7]/10 border-[#1755A7]/30 text-[#1755A7]",
    privileges: ["Access to Tech Eves @ AI Centre", "Foundational DLI Course Submissions", "Live QR Attendance Logging"],
    recentVerified: "Attended Tech Eves #14: Intro to TensorRT (+10 pts)"
  },
  {
    level: 2,
    name: "AI Practitioner",
    points: 380,
    gpuHours: 35,
    badgeBg: "bg-emerald-50 border-emerald-300 text-emerald-800",
    privileges: ["GPU Hands-on Friday Lab Access", "Mini Challenge Hackathon Eligibility", "Verified Certification Badges"],
    recentVerified: "NVIDIA DLI: Fundamentals of Deep Learning (+150 pts)"
  },
  {
    level: 3,
    name: "AI Developer",
    points: 850,
    gpuHours: 100,
    badgeBg: "bg-[#1755A7]/15 border-[#1755A7]/40 text-[#1755A7]",
    privileges: ["100+ Industry Problem Bank Unlocked", "Dedicated DGX A100 Workload Quota", "AI Buildathon Team Lead"],
    recentVerified: "Industry Problem #42: Autonomous Defect Vision (+250 pts)"
  },
  {
    level: 4,
    name: "AI Specialist",
    points: 1650,
    gpuHours: 250,
    badgeBg: "bg-indigo-50 border-indigo-300 text-indigo-800",
    privileges: ["AI Research Friday Keynote Presenter", "Startup Launchpad Seed Incubation", "Priority Multi-Node GPU Cluster"],
    recentVerified: "AI Research Friday: LLM Quantization on Jetson (+200 pts)"
  },
  {
    level: 5,
    name: "AI Innovator",
    points: 2900,
    gpuHours: 500,
    badgeBg: "bg-[#F8C401]/25 border-[#F8C401] text-slate-900 font-extrabold",
    privileges: ["Flagship Grand Challenge Finalist", "Direct Mentorship with NVIDIA Engineers", "Venture Demo Day Pitch Access"],
    recentVerified: "Sri Eshwar Grand Challenge: 1st Place Winner (+250 pts)"
  },
  {
    level: 6,
    name: "High-Impact AI Fellow",
    points: 4500,
    gpuHours: 1200,
    badgeBg: "bg-[#F8C401] border-[#F8C401] text-slate-900 font-black",
    privileges: ["Institutional Research Fellowship Grant", "Patent & Top-Tier Publication Sponsoring", "Hall of Fame Permanent Induction"],
    recentVerified: "Annual Supercomputing Audit: Elite Fellow Distinction (+500 pts)"
  }
];

export function InteractivePassportCard() {
  const [selectedLevelIdx, setSelectedLevelIdx] = useState(2); // Level 3 default
  const activeLevel = LEVEL_PRESETS[selectedLevelIdx] ?? LEVEL_PRESETS[0]!;

  return (
    <div className="relative w-full max-w-md mx-auto flex flex-col items-center">
      
      {/* Crisp Card Container */}
      <div className="relative w-full overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 transition-all duration-300">
        
        {/* Top Gold Border Stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1755A7] via-[#F8C401] to-[#1755A7]" />

        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 pt-1">
          <div className="flex items-center gap-2.5">
            <img 
              src="/Eswar.png" 
              alt="Sri Eshwar Logo" 
              className="h-9 w-auto object-contain" 
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Verified Credential
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </div>
              <p className="text-xs font-bold text-[#1755A7]">Sri Eshwar &bull; NVIDIA AI Centre</p>
            </div>
          </div>

          <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold shadow-xs ${activeLevel.badgeBg}`}>
            <Award className="h-3 w-3" />
            <span>L{activeLevel.level} &bull; {activeLevel.name}</span>
          </div>
        </div>

        {/* Identity & QR Simulation */}
        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-extrabold text-slate-900">Kiran Sasidharan</h3>
              <ShieldCheck className="h-4 w-4 text-[#1755A7]" />
            </div>
            <p className="text-[11px] font-mono text-slate-500 font-semibold">ID: SECE-AI-2026-8942</p>
            <div className="pt-1 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center rounded-md bg-[#1755A7]/10 px-2 py-0.5 text-[10px] font-bold text-[#1755A7] border border-[#1755A7]/20">
                AI Supercomputing Track
              </span>
              <span className="inline-flex items-center rounded-md bg-[#F8C401]/20 px-2 py-0.5 text-[10px] font-extrabold text-slate-900 border border-[#F8C401]">
                Verified Student
              </span>
            </div>
          </div>

          {/* QR Code Graphic preview */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-2 shadow-inner">
            <QrCode className="h-11 w-11 text-[#1755A7]" />
            <span className="mt-0.5 text-[8px] font-mono text-slate-500 font-bold">PROVABLE</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-50/90 p-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
              <Zap className="h-3 w-3 text-[#F8C401] fill-[#F8C401]" /> Total XP
            </span>
            <span className="font-mono text-sm font-black text-slate-900 mt-0.5">
              {activeLevel.points.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">pts</span>
            </span>
          </div>
          <div className="flex flex-col border-l border-slate-200 pl-2">
            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
              <Cpu className="h-3 w-3 text-[#1755A7]" /> GPU Credits
            </span>
            <span className="font-mono text-sm font-black text-[#1755A7] mt-0.5">
              {activeLevel.gpuHours} <span className="text-[10px] font-normal text-slate-500">hrs</span>
            </span>
          </div>
          <div className="flex flex-col border-l border-slate-200 pl-2">
            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-[#1755A7]" /> Verified
            </span>
            <span className="font-mono text-sm font-black text-slate-900 mt-0.5">
              {selectedLevelIdx * 4 + 7} <span className="text-[10px] font-normal text-slate-500">proofs</span>
            </span>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="mt-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-600">Competency Tier Completion</span>
            <span className="font-mono font-black text-[#1755A7]">
              {selectedLevelIdx === 5 ? "MAX TIER (Fellow)" : `${Math.round(((selectedLevelIdx + 1) / 6) * 100)}%`}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-[#1755A7] to-[#F8C401] transition-all duration-300"
              style={{ width: `${Math.min(100, ((selectedLevelIdx + 1) / 6) * 100)}%` }}
            />
          </div>
        </div>

        {/* Privileges Unlocked */}
        <div className="mt-3.5 space-y-1.5 border-t border-slate-100 pt-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Tier Privileges:
          </p>
          <div className="space-y-1">
            {activeLevel.privileges.map((priv, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-slate-800">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#1755A7]" />
                <span className="truncate font-semibold">{priv}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-3 rounded-lg border border-[#1755A7]/20 bg-[#1755A7]/5 px-2.5 py-1.5 text-[11px] text-slate-800 flex items-center justify-between">
          <span className="truncate font-semibold">⚡ {activeLevel.recentVerified}</span>
          <span className="shrink-0 font-extrabold text-[#1755A7] text-[10px] ml-2">VERIFIED</span>
        </div>
      </div>

      {/* Interactive Level Switcher */}
      <div className="mt-3.5 w-full flex flex-col items-center gap-1.5">
        <span className="text-[11px] font-bold text-slate-600">
          Switch level to simulate competency privileges:
        </span>
        <div className="flex items-center justify-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
          {LEVEL_PRESETS.map((lvl, idx) => (
            <button
              key={lvl.level}
              type="button"
              onClick={() => setSelectedLevelIdx(idx)}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                selectedLevelIdx === idx
                  ? "bg-[#1755A7] text-white shadow-xs scale-105"
                  : "text-slate-600 hover:bg-white hover:text-slate-900"
              }`}
            >
              <span>L{lvl.level}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
