"use client";

import { useState } from "react";
import { 
  ShieldCheck, 
  Cpu, 
  Award, 
  CheckCircle2, 
  Zap
} from "lucide-react";

interface LevelDetail {
  level: number;
  title: string;
  pointsRequired: string;
  badgeClass: string;
  summary: string;
  hardwareAccess: string;
  unlockedModules: string[];
  keyMilestone: string;
}

const LEVELS: LevelDetail[] = [
  {
    level: 1,
    title: "AI Explorer",
    pointsRequired: "0 - 249 pts",
    badgeClass: "bg-[#1755A7]/10 text-[#1755A7] border-[#1755A7]/30",
    summary: "Foundational stage for all onboarded engineering students. Focus on building core AI literacy and attending weekly tech sessions.",
    hardwareAccess: "Shared Cluster Playground & Web IDE",
    unlockedModules: [
      "Tech Eves @ AI Centre (Weekly)",
      "Foundational DLI Certifications",
      "Dynamic QR Live Attendance",
      "Campus Community Forum"
    ],
    keyMilestone: "Complete 1st DLI Certificate + 3 Live Session attendances."
  },
  {
    level: 2,
    title: "AI Practitioner",
    pointsRequired: "250 - 599 pts",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300",
    summary: "Hands-on implementation stage. Students work directly in GPU labs and enter their first competitive hackathons.",
    hardwareAccess: "Hands-on Friday GPU Workstations (RTX 4090 / A4000)",
    unlockedModules: [
      "GPU Hands-on Friday Labs (+30 pts)",
      "AI Mini Challenge (Tier-1 Hackathon)",
      "AI Project Mela Demonstrations",
      "Course Credential Verification"
    ],
    keyMilestone: "Submit 2 verified GPU lab notebooks & earn 250+ points."
  },
  {
    level: 3,
    title: "AI Developer",
    pointsRequired: "600 - 1,199 pts",
    badgeClass: "bg-[#1755A7]/15 text-[#1755A7] border-[#1755A7]/40",
    summary: "Advanced development phase with access to enterprise problem statements and dedicated compute resources.",
    hardwareAccess: "Dedicated DGX A100 / H100 Compute Node Quota (100 hrs/term)",
    unlockedModules: [
      "Industry Problem Bank Access (100+ Live Problems)",
      "AI Buildathon (Tier-2 Semester Hackathon)",
      "Startup Launchpad Incubation Sandbox",
      "GPU Workload Scheduling Queue"
    ],
    keyMilestone: "Select and successfully solve a verified Industry Problem Bank challenge."
  },
  {
    level: 4,
    title: "AI Specialist",
    pointsRequired: "1,200 - 2,399 pts",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-300",
    summary: "Domain mastery across specialized AI disciplines: Generative AI, Multimodal Vision, Autonomous Systems, and Edge LLMs.",
    hardwareAccess: "Priority High-Memory Multi-GPU Cluster Access",
    unlockedModules: [
      "AI Research Friday Keynote Presenter",
      "Startup Launchpad Seed Grant Evaluation",
      "Peer Claim Reviewer / Co-Mentorship",
      "Enterprise Tech Connect Sessions"
    ],
    keyMilestone: "Publish research paper preprint or launch MVP on Startup Launchpad."
  },
  {
    level: 5,
    title: "AI Innovator",
    pointsRequired: "2,400 - 3,999 pts",
    badgeClass: "bg-[#F8C401]/25 text-slate-900 border-[#F8C401]",
    summary: "Elite builder tier. Students compete at the national level and collaborate directly with NVIDIA AI architects.",
    hardwareAccess: "Dedicated Supercomputing Nodes with High-Speed InfiniBand",
    unlockedModules: [
      "Sri Eshwar NVIDIA AI Grand Challenge Finalist",
      "1-on-1 NVIDIA AI Architect Mentorship",
      "Annual Showcase Hall of Fame Nominee",
      "Venture Pitch Investor Days"
    ],
    keyMilestone: "Win top-3 ranking in Grand Challenge or achieve verified startup funding."
  },
  {
    level: 6,
    title: "High-Impact AI Fellow",
    pointsRequired: "4,000+ pts",
    badgeClass: "bg-[#F8C401] text-slate-900 border-[#F8C401]",
    summary: "The highest institutional honour awarded by the Sri Eshwar & NVIDIA Supercomputing Centre Council.",
    hardwareAccess: "Uncapped Supercomputing Research Grant & Lab Sponsorship",
    unlockedModules: [
      "Annual High-Impact Fellowship Grant (Cash & Compute)",
      "Institutional Patent & IEEE/NeurIPS Filing Sponsoring",
      "Permanent AI Supercomputing Hall of Fame Induction",
      "Honorary Student Advisory Board Member"
    ],
    keyMilestone: "Pass Annual Supercomputing Audit with highest distinction."
  }
];

export function LevelProgression() {
  const [activeLevelIdx, setActiveLevelIdx] = useState(2); // Level 3 default
  const activeLevel = LEVELS[activeLevelIdx] ?? LEVELS[0]!;

  return (
    <section id="levels" className="py-20 bg-slate-50 border-b border-slate-200">
      <div className="w-full px-6 sm:px-10 lg:px-16">
        
        {/* Section Header */}
        <div className="text-center w-full space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#1755A7]/10 px-3.5 py-1 text-xs font-bold text-[#1755A7] border border-[#1755A7]/20">
            <Award className="h-3.5 w-3.5" />
            <span>COMPETENCY PROGRESSION</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Six Tiers of Provable AI Excellence
          </h2>
          <p className="text-base text-slate-600">
            Every level represents real verified outputs. As points accumulate, real supercomputing hardware access and lab privileges unlock automatically.
          </p>
        </div>

        {/* Step Tabs */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
          {LEVELS.map((lvl, idx) => {
            const isSelected = activeLevelIdx === idx;
            return (
              <button
                key={lvl.level}
                type="button"
                onClick={() => setActiveLevelIdx(idx)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-[#1755A7] text-white shadow-sm scale-105"
                    : "bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-black ${
                  isSelected ? "bg-[#F8C401] text-slate-900" : "bg-slate-100 text-[#1755A7]"
                }`}>
                  {lvl.level}
                </span>
                <span>{lvl.title}</span>
              </button>
            );
          })}
        </div>

        {/* Level Detailed Showcase Box */}
        <div className="mt-8 rounded-2xl border-2 border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-5">
              
              <div className="flex flex-wrap items-center gap-2.5">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold ${activeLevel.badgeClass}`}>
                  <Award className="h-3.5 w-3.5" />
                  Level {activeLevel.level} &bull; {activeLevel.title}
                </span>
                <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  Threshold: {activeLevel.pointsRequired}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {activeLevel.title} Competency Overview
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {activeLevel.summary}
                </p>
              </div>

              {/* Hardware Allocation Box */}
              <div className="rounded-xl border border-[#1755A7]/25 bg-[#1755A7]/5 p-4 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1755A7] uppercase tracking-wider">
                  <Cpu className="h-4 w-4" />
                  <span>Hardware & GPU Quota Allocation</span>
                </div>
                <p className="font-mono text-xs font-bold text-slate-900">
                  {activeLevel.hardwareAccess}
                </p>
              </div>

              {/* Key Milestone to Clear */}
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <Zap className="h-4 w-4 text-[#F8C401] fill-[#F8C401] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Advancement Requirement
                  </h4>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">
                    {activeLevel.keyMilestone}
                  </p>
                </div>
              </div>

            </div>

            {/* Right Column: Unlocked Privileges Checklist */}
            <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#1755A7]" />
                  Privileges Unlocked
                </h4>
                <span className="text-xs font-mono font-bold text-[#1755A7]">
                  {activeLevel.unlockedModules.length} Modules
                </span>
              </div>

              <div className="space-y-2">
                {activeLevel.unlockedModules.map((moduleName, i) => (
                  <div key={i} className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <CheckCircle2 className="h-4 w-4 text-[#1755A7] shrink-0 mt-0.5" />
                    <span className="text-xs font-bold text-slate-800">
                      {moduleName}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-1 text-center">
                <span className="text-[11px] text-slate-500 font-medium">
                  Enforced server-side on every REST API request.
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
