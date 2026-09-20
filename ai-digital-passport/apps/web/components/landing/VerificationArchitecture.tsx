"use client";

import { 
  ShieldCheck, 
  QrCode, 
  FileCheck2, 
  Database, 
  Award, 
  Lock, 
  Server
} from "lucide-react";

const PIPELINE_STEPS = [
  {
    step: "01",
    title: "Activity & Evidence Capture",
    description: "Students scan dynamic rolling QR codes at live events or submit authenticated proof documents (PDF, GitHub repo, Kaggle notebook).",
    icon: QrCode,
    tag: "Multi-Source Ingestion"
  },
  {
    step: "02",
    title: "Faculty Mentor Review Queue",
    description: "Assigned faculty and AI mentors review submissions against standardized evaluation rubrics with mandatory feedback loops.",
    icon: FileCheck2,
    tag: "Human-in-the-Loop Audit"
  },
  {
    step: "03",
    title: "Transactional Scoring & Level-Up",
    description: "PostgreSQL ACID transactions allocate points, adjust GPU quota in real time, and trigger instantaneous Level 1–6 progressions.",
    icon: Database,
    tag: "Server-Enforced Rules"
  },
  {
    step: "04",
    title: "Digital Credential & Fellowships",
    description: "Verified achievements feed into annual institutional audits, nominating top performers for research grants and industry placements.",
    icon: Award,
    tag: "Provable Portfolio"
  }
];

export function VerificationArchitecture() {
  return (
    <section className="py-20 bg-slate-50 border-b border-slate-200 relative overflow-hidden">
      
      <div className="relative w-full px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center w-full space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#1755A7]/10 px-3.5 py-1 text-xs font-bold text-[#1755A7] border border-[#1755A7]/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>TRUST & VERIFICATION INFRASTRUCTURE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Built for Academic Rigor & Provable Merit
          </h2>
          <p className="text-base text-slate-600">
            Every point, badge, and level represents independently verified engineering output across the AI Centre.
          </p>
        </div>

        {/* 4-Step Pipeline Cards */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PIPELINE_STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="relative flex flex-col justify-between rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-xs hover:shadow-md hover:border-[#1755A7]/50 transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl font-black text-slate-300">
                      {step.step}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <span className="inline-block mt-4 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    {step.tag}
                  </span>

                  <h3 className="mt-3 text-base font-bold text-slate-900">
                    {step.title}
                  </h3>

                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Cryptographically Sealed</span>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Architectural Principles Box */}
        <div className="mt-10 rounded-2xl border-2 border-slate-200 bg-white p-6 sm:p-7 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#1755A7]" />
                Zero-Client Trust
              </h4>
              <p className="text-xs text-slate-600">
                All point calculations, level gates, and privilege grants are re-validated server-side on every REST request.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <Database className="h-4 w-4 text-[#1755A7]" />
                PostgreSQL Ground Truth
              </h4>
              <p className="text-xs text-slate-600">
                PostgreSQL is the immutable source of record; Redis serves high-speed caches for live leaderboard queries.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <Server className="h-4 w-4 text-[#1755A7]" />
                DGX / H100 Quota Manager
              </h4>
              <p className="text-xs text-slate-600">
                GPU cluster credits and container limits scale automatically as students achieve higher competency levels.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
