"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ConsoleShell } from "../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../components/console/ConsolePageHeader";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { Spinner } from "../../components/ui/Spinner";
import { adminDashboardApi } from "../../lib/api";
import { 
  Users, 
  FileCheck, 
  Plus, 
  TrendingUp, 
  Activity, 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowUpRight,
  PieChart as PieIcon,
  BarChart3,
  LineChart as LineIcon,
  Sparkles,
  Layers
} from "lucide-react";

// Monthly Line Chart Data (Jan - Sep)
const MONTHLY_GROWTH = [
  { month: "Jan", points: 140, students: 1200 },
  { month: "Feb", points: 280, students: 1800 },
  { month: "Mar", points: 420, students: 2400 },
  { month: "Apr", points: 610, students: 3100 },
  { month: "May", points: 790, students: 3650 },
  { month: "Jun", points: 940, students: 4100 },
  { month: "Jul", points: 1120, students: 4600 },
  { month: "Aug", points: 1280, students: 4950 },
  { month: "Sep", points: 1420, students: 5280 },
];

// Donut Tier Data with gradient colors
const DONUT_TIERS = [
  { level: "L1", name: "AI Explorer", count: 2218, pct: 42, color: "#1755A7", gradient: "from-[#1755A7] to-[#1E40AF]" },
  { level: "L2", name: "AI Practitioner", count: 1478, pct: 28, color: "#2563EB", gradient: "from-[#2563EB] to-[#3B82F6]" },
  { level: "L3", name: "AI Developer", count: 845, pct: 16, color: "#38BDF8", gradient: "from-[#38BDF8] to-[#60A5FA]" },
  { level: "L4", name: "AI Specialist", count: 475, pct: 9, color: "#818CF8", gradient: "from-[#818CF8] to-[#A78BFA]" },
  { level: "L5", name: "AI Innovator", count: 211, pct: 4, color: "#F8C401", gradient: "from-[#F8C401] to-[#FBBF24]" },
  { level: "L6", name: "Research Fellow", count: 53, pct: 1, color: "#EA580C", gradient: "from-[#EA580C] to-[#C2410C]" },
];

// Departmental Dual Bar Comparison Data
const DEPT_COMPARISON = [
  { name: "AI & Data Science", enrolled: 1620, submissions: 480, pct: 31 },
  { name: "Computer Science & Eng", enrolled: 1380, submissions: 395, pct: 26 },
  { name: "AI & Machine Learning", enrolled: 950, submissions: 310, pct: 18 },
  { name: "Information Technology", enrolled: 680, submissions: 215, pct: 13 },
  { name: "Electronics & Comm", enrolled: 430, submissions: 140, pct: 8 },
  { name: "Other Disciplines", enrolled: 220, submissions: 65, pct: 4 },
];

// Learning Pillars Points Share with gradient tones
const PILLAR_SHARES = [
  { name: "NVIDIA DLI & Courses", pct: 35, points: "497K pts", gradient: "from-[#1755A7] to-[#2563EB]", dot: "#1755A7" },
  { name: "Hackathons & Challenges", pct: 25, points: "355K pts", gradient: "from-[#F8C401] to-[#EA580C]", dot: "#F8C401" },
  { name: "Industry Problem Statements", pct: 18, points: "255K pts", gradient: "from-[#0284C7] to-[#38BDF8]", dot: "#0284C7" },
  { name: "Research Papers & Patents", pct: 12, points: "170K pts", gradient: "from-[#059669] to-[#34D399]", dot: "#059669" },
  { name: "Student Startups & Ventures", pct: 10, points: "142K pts", gradient: "from-[#7C3AED] to-[#A78BFA]", dot: "#7C3AED" },
];

// 7-Day Velocity Data
const WEEKLY_VELOCITY = [
  { day: "Mon", approved: 42, pending: 8, total: 50 },
  { day: "Tue", approved: 86, pending: 14, total: 100 }, // Tech Eves peak
  { day: "Wed", approved: 38, pending: 11, total: 49 },
  { day: "Thu", approved: 54, pending: 9, total: 63 },
  { day: "Fri", approved: 92, pending: 22, total: 114 }, // Hands-on Friday peak
  { day: "Sat", approved: 64, pending: 15, total: 79 },
  { day: "Sun", approved: 30, pending: 6, total: 36 },
];

// Live Activity Feed
const LIVE_LOGS = [
  { id: 1, user: "Aadhithya V.", action: "Attained Level 5 (AI Innovator) with 620 pts", time: "3m ago", icon: Award, color: "text-[#F8C401]" },
  { id: 2, user: "Dr. R. Kumar (Mentor)", action: "Approved NVIDIA TensorRT-LLM claim for Sneha R.", time: "11m ago", icon: CheckCircle2, color: "text-emerald-600" },
  { id: 3, user: "Team NeuralEdge", action: "Submitted Grand Challenge Prototype (Defect Vision)", time: "26m ago", icon: Sparkles, color: "text-[#1755A7]" },
  { id: 4, user: "Vikram S.", action: "Completed Industry Problem Statement #18 (Robotics)", time: "42m ago", icon: FileCheck, color: "text-blue-600" },
  { id: 5, user: "Prof. Anitha M.", action: "Verified Hands-on Supercomputing Lab attendance (+30 pts)", time: "1h ago", icon: ShieldCheck, color: "text-emerald-600" },
];

export default function AdminDashboardPage() {
  const summary = useQuery({ queryKey: ["admin", "dashboard"], queryFn: adminDashboardApi.summary });
  const [activeMetric, setActiveMetric] = useState<"points" | "students">("points");

  return (
    <ConsoleShell role="ADMIN">
      
      {/* Top Header */}
      <ConsolePageHeader 
        title="Supercomputing Operations & Executive Analytics" 
        description="Live institutional metrics, competency distributions, pillar engagement breakdown, and student trajectory analytics." 
        actions={
          <div className="flex items-center gap-2.5">
            <Link 
              href="/admin/reports"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-all"
            >
              <PieIcon className="h-4 w-4 text-[#1755A7]" />
              <span>Full Analytics Report</span>
            </Link>
            <Link 
              href="/admin/events"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#1D4ED8] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1E40AF] transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>New Event / Session</span>
            </Link>
          </div>
        }
      />

      {summary.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner label="Generating analytics charts..." />
        </div>
      ) : summary.isError ? (
        <ErrorBanner error={summary.error} />
      ) : summary.data ? (
        <div className="flex flex-col gap-6 mt-2">
          
          {/* Top 4 KPI Executive Metric Cards with Gradient Accent Header */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            
            {/* KPI 1: Total Enrolled */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/50 hover:shadow-md transition-all">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1755A7] via-[#2563EB] to-[#38BDF8]" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Enrolled Scholars</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1755A7]/15 to-[#2563EB]/10 text-[#1755A7]">
                  <Users className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {summary.data.totalStudents.toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
                  <TrendingUp className="h-3 w-3" /> +14.2% MoM
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
                <span>Active this week:</span>
                <span className="font-bold text-slate-800">4,680 (88.6%)</span>
              </div>
            </div>

            {/* KPI 2: Total Platform Points */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/50 hover:shadow-md transition-all">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1755A7] via-[#F8C401] to-[#EA580C]" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Points Awarded</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#F8C401]/25 to-[#EA580C]/15 text-slate-900">
                  <Award className="h-4.5 w-4.5 text-amber-700" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black bg-gradient-to-r from-[#1755A7] to-[#2563EB] bg-clip-text text-transparent tracking-tight">
                  1.42M
                </span>
                <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
                  <TrendingUp className="h-3 w-3" /> +22.4%
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
                <span>Avg per Student:</span>
                <span className="font-bold text-slate-800">269 pts</span>
              </div>
            </div>

            {/* KPI 3: Verification Queue */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/50 hover:shadow-md transition-all">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#38BDF8] via-[#60A5FA] to-[#1755A7]" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Pending Claim Audits</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1755A7]/15 to-[#2563EB]/10 text-[#1755A7]">
                  <FileCheck className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {summary.data.pendingClaims.toLocaleString()}
                </span>
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  In Review
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
                <span>Avg Turnaround:</span>
                <span className="font-bold text-slate-800">4.2 hours</span>
              </div>
            </div>

            {/* KPI 4: Research Grants & Fellowships */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/50 hover:shadow-md transition-all">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F8C401] to-[#F59E0B]" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Research & Fellowships</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#F8C401]/25 to-[#EA580C]/15 text-slate-900">
                  <Sparkles className="h-4.5 w-4.5 text-amber-700" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  ₹52.4L
                </span>
                <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
                  Allocated
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
                <span>14 Fellows &bull; 6 Patents:</span>
                <span className="font-bold text-slate-800">100% Verified</span>
              </div>
            </div>

          </div>

          {/* Section 1: Line Chart & Donut Chart Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Chart 1: Smooth Area / Line Chart (7 Cols) */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <LineIcon className="h-4.5 w-4.5 text-[#1755A7]" />
                      Cohort Competency & Points Growth Trajectory
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Monthly cumulative points earned and student competency acceleration
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                    <button
                      onClick={() => setActiveMetric("points")}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                        activeMetric === "points"
                          ? "bg-gradient-to-r from-[#1755A7] to-[#2563EB] text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Points (k)
                    </button>
                    <button
                      onClick={() => setActiveMetric("students")}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                        activeMetric === "students"
                          ? "bg-gradient-to-r from-[#F8C401] to-[#F59E0B] text-slate-900 shadow-2xs font-black"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Enrolment
                    </button>
                  </div>
                </div>

                {/* SVG Line / Area Graph with Rich Dual Gradient */}
                <div className="mt-6 relative h-56 w-full">
                  <svg viewBox="0 0 500 200" className="h-full w-full overflow-visible">
                    <defs>
                      <linearGradient id="blueAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity="0.40" />
                        <stop offset="50%" stopColor="#1755A7" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#1755A7" stopOpacity="0.0" />
                      </linearGradient>

                      <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#1755A7" />
                        <stop offset="50%" stopColor="#2563EB" />
                        <stop offset="100%" stopColor="#38BDF8" />
                      </linearGradient>

                      <linearGradient id="goldAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F8C401" stopOpacity="0.45" />
                        <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#F8C401" stopOpacity="0.0" />
                      </linearGradient>

                      <linearGradient id="goldStrokeGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="70%" stopColor="#F8C401" />
                        <stop offset="100%" stopColor="#FDE047" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid Lines */}
                    <line x1="0" y1="40" x2="500" y2="40" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="0" y1="90" x2="500" y2="90" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="0" y1="140" x2="500" y2="140" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="0" y1="190" x2="500" y2="190" stroke="#E2E8F0" strokeWidth="1.5" />

                    {/* Area Fill */}
                    {activeMetric === "points" ? (
                      <>
                        <path
                          d="M 0,180 Q 60,165 125,145 T 250,110 T 375,60 T 500,20 L 500,190 L 0,190 Z"
                          fill="url(#blueAreaGradient)"
                        />
                        <path
                          d="M 0,180 Q 60,165 125,145 T 250,110 T 375,60 T 500,20"
                          fill="none"
                          stroke="url(#strokeGradient)"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />
                        {/* Interactive Data Dots */}
                        {[
                          { cx: 0, cy: 180 },
                          { cx: 62, cy: 165 },
                          { cx: 125, cy: 145 },
                          { cx: 187, cy: 125 },
                          { cx: 250, cy: 110 },
                          { cx: 312, cy: 85 },
                          { cx: 375, cy: 60 },
                          { cx: 437, cy: 40 },
                          { cx: 500, cy: 20 },
                        ].map((pt, i) => (
                          <circle 
                            key={i} 
                            cx={pt.cx} 
                            cy={pt.cy} 
                            r="5" 
                            fill="#FFFFFF" 
                            stroke="#1755A7" 
                            strokeWidth="3" 
                            className="transition-transform hover:scale-125"
                          />
                        ))}
                      </>
                    ) : (
                      <>
                        <path
                          d="M 0,160 Q 60,140 125,120 T 250,90 T 375,55 T 500,25 L 500,190 L 0,190 Z"
                          fill="url(#goldAreaGradient)"
                        />
                        <path
                          d="M 0,160 Q 60,140 125,120 T 250,90 T 375,55 T 500,25"
                          fill="none"
                          stroke="url(#goldStrokeGradient)"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />
                        {[
                          { cx: 0, cy: 160 },
                          { cx: 125, cy: 120 },
                          { cx: 250, cy: 90 },
                          { cx: 375, cy: 55 },
                          { cx: 500, cy: 25 },
                        ].map((pt, i) => (
                          <circle 
                            key={i} 
                            cx={pt.cx} 
                            cy={pt.cy} 
                            r="5" 
                            fill="#FFFFFF" 
                            stroke="#F8C401" 
                            strokeWidth="3" 
                            className="transition-transform hover:scale-125"
                          />
                        ))}
                      </>
                    )}
                  </svg>
                </div>

                {/* X-Axis Labels */}
                <div className="mt-2 flex justify-between text-[11px] font-mono font-semibold text-slate-400 px-1">
                  {MONTHLY_GROWTH.map((m) => (
                    <span key={m.month}>{m.month}</span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[#1755A7] to-[#38BDF8]" />
                  9-Month Velocity (+914% since January cohort inception)
                </span>
                <span className="font-bold text-[#1755A7] font-mono">1.42M pts Total</span>
              </div>
            </div>

            {/* Chart 2: Smooth Gradient Donut Ring Chart (5 Cols) */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <PieIcon className="h-4.5 w-4.5 text-[#F8C401]" />
                      Competency Tier Donut
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Proportional distribution across Level 1 to 6
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#1755A7] bg-[#1755A7]/10 px-2.5 py-1 rounded-lg">
                    5,280 Scholars
                  </span>
                </div>

                {/* Smooth Conic-Gradient Ring with Inner Cutout */}
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-6">
                  
                  {/* The Seamless Conic Gradient Donut */}
                  <div className="relative h-44 w-44 shrink-0 flex items-center justify-center">
                    {/* Outer Conic Gradient Glow & Ring */}
                    <div 
                      className="absolute inset-0 rounded-full p-4 shadow-inner"
                      style={{
                        background: `conic-gradient(from 220deg, 
                          #1755A7 0%, 
                          #2563EB 42%, 
                          #38BDF8 70%, 
                          #818CF8 86%, 
                          #F8C401 95%, 
                          #EA580C 100%)`
                      }}
                    >
                      {/* Inner White Cutout to make it a true Donut with soft shadow */}
                      <div className="h-full w-full rounded-full bg-white shadow-sm flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-black text-slate-900 leading-none tracking-tight">5,280</span>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mt-1">Scholars</span>
                        <span className="text-[9px] font-bold text-[#1755A7] bg-[#1755A7]/10 px-2 py-0.5 rounded-full mt-1">100% Cohort</span>
                      </div>
                    </div>
                  </div>

                  {/* Gradient Legend Breakdown */}
                  <div className="flex flex-col gap-2 min-w-0 flex-1 text-xs w-full">
                    {DONUT_TIERS.map((tier) => (
                      <div key={tier.level} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`h-2.5 w-2.5 rounded-full shrink-0 bg-gradient-to-r ${tier.gradient}`} />
                          <span className="truncate font-semibold text-slate-700">{tier.level} - {tier.name}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono shrink-0 ml-2">
                          <span className="text-slate-400 text-[11px]">{tier.count}</span>
                          <span className="font-bold text-slate-900 w-8 text-right">{tier.pct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Top Tier (L5 & L6 Fellows):</span>
                <span className="font-bold text-[#1755A7] font-mono">264 Elite Scholars (5.0%)</span>
              </div>
            </div>

          </div>

          {/* Section 2: Department Multi-Bar & Learning Pillars Share */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Chart 3: Department Multi-Bar Comparison (7 Cols) */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="h-4.5 w-4.5 text-[#1755A7]" />
                    Departmental Enrolment & Verified Project Output
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Engineering streams comparison between students vs completed capstones
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-r from-[#1755A7] to-[#2563EB]" /> Enrolled
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-r from-[#F8C401] to-[#EA580C]" /> Capstones
                  </span>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {DEPT_COMPARISON.map((dept, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800">{dept.name}</span>
                      <div className="flex items-center gap-3 font-mono text-slate-600">
                        <span>{dept.enrolled} Students</span>
                        <span className="text-slate-300">&bull;</span>
                        <span className="font-bold text-[#1755A7]">{dept.submissions} Capstones</span>
                      </div>
                    </div>

                    {/* Dual Gradient Progress Bars */}
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 flex gap-1">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-[#1755A7] to-[#38BDF8] transition-all duration-500"
                          style={{ width: `${dept.pct * 2.8}%` }}
                        />
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-[#F8C401] to-[#EA580C] transition-all duration-500"
                          style={{ width: `${(dept.submissions / 500) * 40}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-bold text-slate-400 w-10 text-right">{dept.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 4: Learning Pillars Share with Rich Gradient Meters (5 Cols) */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Layers className="h-4.5 w-4.5 text-[#1755A7]" />
                      Learning Pillars Share
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Accredited points generated across 5 pillars
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#1755A7] bg-[#1755A7]/10 px-2.5 py-1 rounded-lg">
                    100% Share
                  </span>
                </div>

                <div className="mt-5 space-y-3.5">
                  {PILLAR_SHARES.map((pillar, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: pillar.dot }} />
                          <span className="text-slate-800">{pillar.name}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-slate-500 text-[11px]">{pillar.points}</span>
                          <span className="font-bold text-slate-900">{pillar.pct}%</span>
                        </div>
                      </div>

                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div 
                          className={`h-full rounded-full bg-gradient-to-r ${pillar.gradient} transition-all duration-500`}
                          style={{ width: `${pillar.pct * 2.5}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Top Pillar:</span>
                <span className="font-bold text-[#1755A7]">NVIDIA DLI (497,000 pts)</span>
              </div>
            </div>

          </div>

          {/* Section 3: 7-Day Velocity & Live Event Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Chart 5: 7-Day Velocity Bar Chart with Gradient Columns (6 Cols) */}
            <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="h-4.5 w-4.5 text-[#1755A7]" />
                    Weekly Verification Velocity
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Daily claim submissions and approvals over the last 7 days
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1755A7] font-mono bg-[#1755A7]/10 px-2.5 py-1 rounded-lg">
                  491 Claims
                </span>
              </div>

              {/* 7-Day Vertical Bar Chart with Gradient Columns */}
              <div className="mt-6 flex items-end justify-between gap-3 h-44 pt-4 px-2">
                {WEEKLY_VELOCITY.map((day) => {
                  const maxTotal = 120;
                  const heightPercent = Math.round((day.total / maxTotal) * 100);
                  const isPeak = day.day === "Tue" || day.day === "Fri";

                  return (
                    <div key={day.day} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                      <span className="text-[10px] font-mono font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        {day.total}
                      </span>
                      <div 
                        className={`w-full max-w-[32px] rounded-t-lg transition-all duration-300 ${
                          isPeak 
                            ? "bg-gradient-to-t from-[#1755A7] via-[#2563EB] to-[#38BDF8] shadow-xs" 
                            : "bg-gradient-to-t from-slate-200 to-slate-300 group-hover:from-[#1755A7]/60 group-hover:to-[#38BDF8]/60"
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className={`text-xs font-bold ${isPeak ? "text-[#1755A7]" : "text-slate-500"}`}>
                        {day.day}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-r from-[#1755A7] to-[#38BDF8]" /> Tuesday (Tech Eves) & Friday (Hands-on Labs) peaks
                </span>
                <span className="font-bold text-slate-700">92% Verified</span>
              </div>
            </div>

            {/* Live Audit & Event Stream (6 Cols) */}
            <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="h-4.5 w-4.5 text-[#1755A7]" />
                    Live Activity Stream
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time transactional feed of competency milestones
                  </p>
                </div>
                <Link 
                  href="/admin/logs"
                  className="text-xs font-bold text-[#1755A7] hover:underline flex items-center gap-1"
                >
                  <span>View All Logs</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-3 divide-y divide-slate-100">
                {LIVE_LOGS.map((log) => {
                  const Icon = log.icon;
                  return (
                    <div key={log.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                          <Icon className={`h-4 w-4 ${log.color}`} />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900">{log.user}</span>
                          <p className="text-slate-600 mt-0.5 truncate">{log.action}</p>
                        </div>
                      </div>
                      <span className="font-mono text-slate-400 shrink-0 font-medium text-[11px]">{log.time}</span>
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
