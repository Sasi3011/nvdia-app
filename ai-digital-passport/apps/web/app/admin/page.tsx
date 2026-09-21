"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar,
  RadialBarChart, RadialBar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { ConsoleShell } from "../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../components/console/ConsolePageHeader";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { Spinner } from "../../components/ui/Spinner";
import { adminDashboardApi } from "../../lib/api";
import {
  Users, FileCheck, Plus, TrendingUp, Activity,
  Award, ShieldCheck, CheckCircle2, ArrowUpRight,
  PieChart as PieIcon, Sparkles, Layers
} from "lucide-react";

/* ─── Data ───────────────────────────────────────────────── */

const MONTHLY_CLAIMS = [
  { month: "Jan", approved: 95,  pending: 22 },
  { month: "Feb", approved: 140, pending: 35 },
  { month: "Mar", approved: 210, pending: 48 },
  { month: "Apr", approved: 310, pending: 60 },
  { month: "May", approved: 390, pending: 72 },
  { month: "Jun", approved: 460, pending: 85 },
  { month: "Jul", approved: 540, pending: 90 },
  { month: "Aug", approved: 620, pending: 98 },
  { month: "Sep", approved: 720, pending: 105 },
];

const DONUT_TIERS = [
  { name: "L1 · Explorer",     value: 2218, color: "#1755A7" },
  { name: "L2 · Practitioner", value: 1478, color: "#2563EB" },
  { name: "L3 · Developer",    value: 845,  color: "#38BDF8" },
  { name: "L4 · Specialist",   value: 475,  color: "#818CF8" },
  { name: "L5 · Innovator",    value: 211,  color: "#F8C401" },
  { name: "L6 · Fellow",       value: 53,   color: "#EA580C" },
];

const PILLAR_RADIAL = [
  { name: "NVIDIA DLI",   fill: "#1755A7", value: 35, fullMark: 100 },
  { name: "Hackathons",   fill: "#F8C401", value: 25, fullMark: 100 },
  { name: "Industry",     fill: "#0284C7", value: 18, fullMark: 100 },
  { name: "Research",     fill: "#059669", value: 12, fullMark: 100 },
  { name: "Startups",     fill: "#7C3AED", value: 10, fullMark: 100 },
];

const WEEKLY = [
  { day: "Mon", approved: 42, pending: 8  },
  { day: "Tue", approved: 86, pending: 14 },
  { day: "Wed", approved: 38, pending: 11 },
  { day: "Thu", approved: 54, pending: 9  },
  { day: "Fri", approved: 92, pending: 22 },
  { day: "Sat", approved: 64, pending: 15 },
  { day: "Sun", approved: 30, pending: 6  },
];

const LIVE_LOGS = [
  { id: 1, user: "Aadhithya V.",    action: "Attained Level 5 · AI Innovator",               time: "3m",  icon: Award,        ring: "ring-amber-400/40",   bg: "bg-amber-50",   ic: "text-amber-500"   },
  { id: 2, user: "Dr. R. Kumar",    action: "Approved TensorRT-LLM claim for Sneha R.",       time: "11m", icon: CheckCircle2, ring: "ring-emerald-400/40", bg: "bg-emerald-50", ic: "text-emerald-600" },
  { id: 3, user: "Team NeuralEdge", action: "Submitted Grand Challenge Prototype",             time: "26m", icon: Sparkles,     ring: "ring-blue-400/40",    bg: "bg-blue-50",    ic: "text-[#1755A7]"   },
  { id: 4, user: "Vikram S.",       action: "Solved Industry Problem #18 (Robotics)",         time: "42m", icon: FileCheck,    ring: "ring-blue-400/40",    bg: "bg-blue-50",    ic: "text-blue-600"    },
  { id: 5, user: "Prof. Anitha M.", action: "Verified Supercomputing Lab attendance +30 pts", time: "1h",  icon: ShieldCheck,  ring: "ring-emerald-400/40", bg: "bg-emerald-50", ic: "text-emerald-600" },
  { id: 6, user: "Priya K.",        action: "Published AI Research Paper (NeurIPS track)",    time: "2h",  icon: Award,        ring: "ring-purple-400/40",  bg: "bg-purple-50",  ic: "text-purple-600"  },
];

/* ─── Custom Tooltip ─────────────────────────────────────── */
function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 backdrop-blur-sm px-3 py-2 shadow-xl text-[11px]">
      <p className="font-black text-slate-700 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-semibold" style={{ color: p.color }}>
          {p.name}: <span className="font-black text-slate-900">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function AdminDashboardPage() {
  const summary = useQuery({ queryKey: ["admin", "dashboard"], queryFn: adminDashboardApi.summary });
  const total = DONUT_TIERS.reduce((s, d) => s + d.value, 0);

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader
        title="Admin Dashboard"
        description="Competency metrics, claim velocity, and live activity."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/reports" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-all">
              <PieIcon className="h-3.5 w-3.5 text-[#1755A7]" /> Reports
            </Link>
            <Link href="/admin/events" className="inline-flex items-center gap-1.5 rounded-xl bg-[#1755A7] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#103E7E] transition-all">
              <Plus className="h-3.5 w-3.5" /> New Event
            </Link>
          </div>
        }
      />

      {summary.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner label="Loading dashboard…" />
        </div>
      ) : summary.isError ? (
        <ErrorBanner error={summary.error} />
      ) : summary.data ? (
        <div className="flex flex-col gap-5 mt-1">

          {/* ── Row 1: 3 Hero KPI Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* KPI: Scholars */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#1755A7] via-[#2563EB] to-[#38BDF8]" />
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-semibold text-slate-500">Enrolled Scholars</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1755A7]/15 to-[#2563EB]/10 text-[#1755A7]">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {summary.data.totalStudents.toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
                  <TrendingUp className="h-3 w-3" /> +14.2% MoM
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
                <span>Active this week</span>
                <span className="font-bold text-slate-800">4,680 (88.6%)</span>
              </div>
            </div>

            {/* KPI: Points */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#1755A7] via-[#F8C401] to-[#EA580C]" />
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-semibold text-slate-500">Points Awarded</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#F8C401]/25 to-[#EA580C]/15">
                  <Award className="h-4 w-4 text-amber-600" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight bg-gradient-to-r from-[#1755A7] to-[#2563EB] bg-clip-text text-transparent">
                  1.42M
                </span>
                <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
                  <TrendingUp className="h-3 w-3" /> +22.4%
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
                <span>Avg per student</span>
                <span className="font-bold text-slate-800">269 pts</span>
              </div>
            </div>

            {/* KPI: Pending */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-amber-400/40 hover:shadow-md transition-all">
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#38BDF8] via-[#F59E0B] to-[#EA580C]" />
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-semibold text-slate-500">Pending Audits</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-400/15">
                  <FileCheck className="h-4 w-4 text-amber-600" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {summary.data.pendingClaims.toLocaleString()}
                </span>
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  In Review
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
                <span>Avg turnaround</span>
                <span className="font-bold text-slate-800">4.2 hours</span>
              </div>
            </div>

          </div>

          {/* ── Row 2: Donut + Claim Trend ── */}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* Donut — Competency Tiers */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="h-4 w-4 text-[#1755A7]" />
                <h3 className="text-sm font-black text-slate-900">Competency Tiers</h3>
              </div>
              <p className="text-[11px] text-slate-400 mb-5">Distribution of {total.toLocaleString()} students across L1–L6</p>

              <div className="flex items-center gap-2">
                {/* Donut chart */}
                <div className="relative shrink-0">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie
                        data={DONUT_TIERS}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        dataKey="value"
                        strokeWidth={3}
                        stroke="#fff"
                        paddingAngle={2}
                      >
                        {DONUT_TIERS.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Centre label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-black text-slate-900">{(total / 1000).toFixed(1)}K</span>
                    <span className="text-[10px] font-bold text-slate-400">Students</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-2">
                  {DONUT_TIERS.map((d) => {
                    const pct = Math.round((d.value / total) * 100);
                    return (
                      <div key={d.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                          <span className="text-[11px] font-semibold text-slate-700">{d.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-mono">
                          <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct * 2.4}%`, backgroundColor: d.color }} />
                          </div>
                          <span className="font-black text-slate-800 w-7 text-right">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Area — Monthly Claim Trend */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#1755A7]" />
                  <h3 className="text-sm font-black text-slate-900">Claim Verification Trend</h3>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-full bg-[#1755A7] inline-block" />Approved</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-full bg-slate-200 inline-block" />Pending</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mb-5">Monthly claim submissions Jan – Sep 2026</p>

              <ResponsiveContainer width="100%" height={195}>
                <AreaChart data={MONTHLY_CLAIMS} margin={{ top: 4, right: 6, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gApproved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1755A7" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#1755A7" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<Tip />} />
                  <Area type="monotone" dataKey="approved" name="Approved" stroke="#1755A7" strokeWidth={2.5} fill="url(#gApproved)" dot={false} activeDot={{ r: 5, fill: "#1755A7", strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="pending"  name="Pending"  stroke="#F59E0B" strokeWidth={2} fill="url(#gPending)" dot={false} activeDot={{ r: 4, fill: "#F59E0B", strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Row 3: Weekly Bars + Radial Pillars + Feed ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* Stacked bar — weekly */}
            <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-[#1755A7]" />
                <h3 className="text-sm font-black text-slate-900">Weekly Velocity</h3>
              </div>
              <p className="text-[11px] text-slate-400 mb-5">Daily claims this week · Tue & Fri peak</p>

              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={WEEKLY} barCategoryGap="28%" margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<Tip />} cursor={{ fill: "#f8fafc" }} />
                  <Bar dataKey="approved" name="Approved" stackId="a" fill="#1755A7" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="pending"  name="Pending"  stackId="a" fill="#BFDBFE" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-3 text-slate-500">
                  <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-[#1755A7] inline-block" />Approved</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-[#BFDBFE] inline-block" />Pending</span>
                </div>
                <span className="font-black text-emerald-600">92% verified</span>
              </div>
            </div>

            {/* Radial bars — Learning Pillars */}
            <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="h-4 w-4 text-[#1755A7]" />
                <h3 className="text-sm font-black text-slate-900">Pillar Engagement</h3>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">% of total points per learning pillar</p>

              <ResponsiveContainer width="100%" height={200}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={85}
                  data={PILLAR_RADIAL}
                  startAngle={90}
                  endAngle={-270}
                  barSize={12}
                >
                  <RadialBar dataKey="value" background={{ fill: "#f1f5f9" }} cornerRadius={6} />
                  <Tooltip content={<Tip />} />
                </RadialBarChart>
              </ResponsiveContainer>

              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1.5">
                {PILLAR_RADIAL.map((p) => (
                  <span key={p.name} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: p.fill }} />
                    {p.name} <span className="font-black text-slate-800">{p.value}%</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Live feed */}
            <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <h3 className="text-sm font-black text-slate-900">Live Activity</h3>
                </div>
                <Link href="/admin/logs" className="text-[10px] font-bold text-[#1755A7] flex items-center gap-0.5 hover:underline">
                  All <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              <p className="text-[11px] text-slate-400 mb-4">Real-time competency milestones</p>

              <div className="space-y-3">
                {LIVE_LOGS.map((log) => {
                  const Icon = log.icon;
                  return (
                    <div key={log.id} className="flex items-start gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-2 ${log.ring} ${log.bg}`}>
                        <Icon className={`h-3.5 w-3.5 ${log.ic}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black text-slate-800 truncate">{log.user}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed truncate">{log.action}</p>
                      </div>
                      <span className="text-[10px] font-mono font-semibold text-slate-400 shrink-0 pt-0.5">{log.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      ) : null}
    </ConsoleShell>
  );
}
