"use client";

import Link from "next/link";
import {
  Sparkles,
  ChevronRight,
  CheckCircle2,
  ShieldCheck,
  ArrowUpRight,
  Layers,
} from "lucide-react";
import { StudentShell } from "../shell/StudentShell";
import { useQuery } from "@tanstack/react-query";
import { activitiesApi } from "../../lib/api";

export interface ProgramAction {
  label: string;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
}

export interface ProgramStep {
  title: string;
  description: string;
  /** Scoring-matrix category this step awards points for — points are read live from the admin-configured matrix. */
  pointsCategory?: string;
}

export function ProgramModulePage({
  title,
  description,
  badge,
  actions,
  steps,
  sections,
  stats,
}: {
  title: string;
  description: string;
  badge: string;
  actions: ProgramAction[];
  steps: ProgramStep[];
  sections: { title: string; items: string[] }[];
  stats?: { label: string; value: string; sub?: string }[];
}) {
  const rules = useQuery({ queryKey: ["activities", "rules"], queryFn: () => activitiesApi.discover(), staleTime: 60_000 });
  const pointsFor = (category?: string) => (category ? rules.data?.find((r) => r.category === category)?.points ?? null : null);

  return (
    <StudentShell>
      <div className="flex flex-col gap-6">
        
        {/* Top Hero Card */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 lg:p-8 shadow-xs">
          <div className="absolute right-0 top-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-gradient-to-br from-[#1755A7]/10 to-[#F8C401]/10 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1755A7]/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#1755A7]">
                  <Sparkles className="h-3.5 w-3.5 text-[#F8C401]" />
                  {badge}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Track
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900">{title}</h1>
              <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">{description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {actions.map((action, idx) => {
                if (action.onClick) {
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={action.onClick}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-xs active:scale-95 ${
                        action.primary
                          ? "bg-[#1755A7] text-white hover:bg-[#134486] hover:shadow-md hover:shadow-[#1755A7]/20"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      {action.label}
                      <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
                    </button>
                  );
                }
                return (
                  <Link
                    key={idx}
                    href={action.href || "#"}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-xs active:scale-95 ${
                      action.primary
                        ? "bg-[#1755A7] text-white hover:bg-[#134486] hover:shadow-md hover:shadow-[#1755A7]/20"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {action.label}
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* KPI Metrics Strip — only rendered when the caller supplies real, page-specific stats */}
        {stats && stats.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</div>
                <div className="mt-2 text-xl font-black text-slate-900">{stat.value}</div>
                {stat.sub && <div className="mt-1 text-xs text-slate-500">{stat.sub}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Step-by-Step Workflow */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Standard Operating Workflow</h2>
              <p className="text-xs text-slate-500">Complete each milestone to verify accreditation and credit competency points.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {steps.length} Milestones
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-[#1755A7]/40 hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1755A7]/10 text-xs font-black text-[#1755A7] group-hover:bg-[#1755A7] group-hover:text-white transition-colors">
                      {idx + 1}
                    </div>
                    {step.pointsCategory && pointsFor(step.pointsCategory) !== null && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#F8C401]/15 px-2.5 py-0.5 font-mono text-xs font-black text-amber-900 border border-[#F8C401]/30">
                        <Sparkles className="h-3 w-3 text-[#F8C401]" />
                        +{pointsFor(step.pointsCategory)}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-black text-slate-900 group-hover:text-[#1755A7] transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-slate-400 group-hover:text-[#1755A7]">
                  <span>Step {idx + 1} of {steps.length}</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Informational Sections Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {sections.map((sec, idx) => (
            <div key={idx} className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  {idx === 0 ? <Layers className="h-4 w-4 text-[#1755A7]" /> : <ShieldCheck className="h-4 w-4 text-[#1755A7]" />}
                </div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight">{sec.title}</h3>
              </div>
              <ul className="mt-4 space-y-3">
                {sec.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start gap-2.5 text-xs text-slate-600">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                    <span className="leading-relaxed font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>
    </StudentShell>
  );
}
