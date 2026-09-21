"use client";

import Link from "next/link";
import { useSession } from "../../lib/session";
import { 
  ArrowRight, 
  ShieldCheck, 
  Cpu, 
  Award, 
  GraduationCap
} from "lucide-react";

export function HeroSection({ onOpenLogin }: { onOpenLogin?: () => void }) {
  const session = useSession();
  const isAuthenticated = session.data?.authenticated;

  return (
    <section className="relative overflow-hidden pt-36 pb-20 md:pt-44 md:pb-28 bg-gradient-to-b from-white via-slate-50/70 to-white">
      
      {/* Subtle Light Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_20%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />
      
      {/* Soft Ambient Light Glow Orbs */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[#1755A7]/10 blur-[110px] rounded-full pointer-events-none" />
      <div className="absolute top-44 left-1/2 -translate-x-1/2 w-[500px] h-[220px] bg-[#F8C401]/15 blur-[95px] rounded-full pointer-events-none" />

      <div className="relative w-full px-6 sm:px-10 lg:px-16 text-center flex flex-col items-center">
        
        {/* Institutional Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#1755A7]/25 bg-[#1755A7]/5 px-4 py-1.5 text-xs font-extrabold text-[#1755A7] shadow-xs backdrop-blur-sm mb-6">
          <span className="flex h-2.5 w-2.5 rounded-full bg-[#F8C401] ring-2 ring-[#F8C401]/40 animate-pulse" />
          <span>NVIDIA AI Supercomputing & Competency Centre</span>
          <span className="text-slate-300">&bull;</span>
          <span className="text-slate-800">Sri Eshwar</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.12] max-w-4xl">
          Supercomputing Competency for{" "}
          <span className="text-[#1755A7]">
            Next-Gen AI Builders
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl leading-relaxed">
          An institutional ecosystem tracking student AI research, certifications across 11 accredited providers, and DGX/H100 supercomputing lab compute allocations from Level 1 foundational learning to Level 6 High-Impact AI Fellowships.
        </p>

        {/* Primary Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#1755A7] px-8 py-4 text-sm font-extrabold text-white shadow-lg shadow-[#1755A7]/25 hover:bg-[#103E7E] hover:shadow-xl active:scale-[0.99] transition-all whitespace-nowrap min-w-[210px]"
            >
              <span>Enter Your Dashboard</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          ) : onOpenLogin ? (
            <button
              type="button"
              onClick={onOpenLogin}
              className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#1755A7] px-8 py-4 text-sm font-extrabold text-white shadow-lg shadow-[#1755A7]/25 hover:bg-[#103E7E] hover:shadow-xl active:scale-[0.99] transition-all whitespace-nowrap min-w-[210px]"
            >
              <span>Launch AI Centre Portal</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          ) : (
            <Link
              href="/login"
              className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#1755A7] px-8 py-4 text-sm font-extrabold text-white shadow-lg shadow-[#1755A7]/25 hover:bg-[#103E7E] hover:shadow-xl active:scale-[0.99] transition-all whitespace-nowrap min-w-[210px]"
            >
              <span>Launch AI Centre Portal</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}

          <a
            href="#features"
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-7 py-4 text-sm font-extrabold text-slate-800 shadow-xs hover:bg-slate-50 hover:border-[#1755A7]/40 active:scale-[0.99] transition-all whitespace-nowrap min-w-[210px]"
          >
            <Cpu className="h-4 w-4 text-[#1755A7]" />
            <span>Explore 9-Grid Modules</span>
          </a>
        </div>

        {/* Value Pillar Chips */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs">
            <ShieldCheck className="h-4 w-4 text-[#1755A7]" />
            <span>Faculty-Audited Evidence</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs">
            <Cpu className="h-4 w-4 text-[#1755A7]" />
            <span>DGX & H100 Compute Quotas</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs">
            <GraduationCap className="h-4 w-4 text-[#1755A7]" />
            <span>11 Learning Platforms</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs">
            <Award className="h-4 w-4 text-[#F8C401] fill-[#F8C401]/30" />
            <span>Level 1–6 Competency Tiers</span>
          </div>
        </div>

        {/* Live Metrics Counter Bar */}
        <div className="mt-14 w-full rounded-2xl border-2 border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="flex flex-col items-center pt-2 md:pt-0">
              <div className="flex items-center gap-1 font-mono text-3xl md:text-4xl font-black text-slate-900">
                <span>5,000</span>
                <span className="text-[#1755A7]">+</span>
              </div>
              <span className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">
                Students Enrolled
              </span>
            </div>

            <div className="flex flex-col items-center pt-4 md:pt-0">
              <div className="flex items-center gap-1 font-mono text-3xl md:text-4xl font-black text-slate-900">
                <span>100</span>
                <span className="text-[#F8C401]">+</span>
              </div>
              <span className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">
                GPU Supercomputing Nodes
              </span>
            </div>

            <div className="flex flex-col items-center pt-4 md:pt-0">
              <div className="flex items-center gap-1 font-mono text-3xl md:text-4xl font-black text-slate-900">
                <span>11</span>
                <span className="text-[#1755A7]">Platforms</span>
              </div>
              <span className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">
                Verified Learning Providers
              </span>
            </div>

            <div className="flex flex-col items-center pt-4 md:pt-0">
              <div className="flex items-center gap-1 font-mono text-3xl md:text-4xl font-black text-slate-900">
                <span>₹50L</span>
                <span className="text-[#F8C401]">+</span>
              </div>
              <span className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">
                Research & Fellowships
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
