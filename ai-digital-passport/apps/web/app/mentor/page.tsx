"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ConsoleShell } from "../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../components/console/ConsolePageHeader";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { Spinner } from "../../components/ui/Spinner";
import { StatusChip, type Status } from "../../components/ui/StatusChip";
import { mentorApi } from "../../lib/api";
import { 
  FileCheck, 
  Clock, 
  CheckCircle2, 
  Users, 
  Award, 
  TrendingUp, 
  PieChart as PieIcon, 
  BarChart3, 
  Calendar, 
  ExternalLink, 
  ChevronRight,
  ShieldCheck,
  BookOpen,
  Cpu,
  Sparkles,
  ArrowUpRight,
  Zap,
  Sliders,
  AlertTriangle
} from "lucide-react";

export default function MentorDashboardPage() {
  return (
    <ConsoleShell role="MENTOR">
      <MentorDashboardContent />
    </ConsoleShell>
  );
}

function MentorDashboardContent() {
  const queue = useQuery({ 
    queryKey: ["mentor", "queue", "summary"], 
    queryFn: () => mentorApi.queue({ page: 1, pageSize: 10 }) 
  });

  const pendingCount = queue.data?.total ?? 14;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
      <ConsolePageHeader
        title="Faculty Mentor Workspace & Evaluation Hub"
        description="Review student course capstones, evaluate research claims, audit proctoring compliance, and track department cohort competency velocity."
        actions={
          <div className="flex items-center gap-2.5">
            <Link
              href="/mentor/courses"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-all active:scale-95"
            >
              <BookOpen className="h-4 w-4 text-[#1755A7]" />
              <span>Curriculum Catalog</span>
            </Link>
            <Link
              href="/mentor/queue"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] via-[#1A5EB7] to-[#2563EB] px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1D4ED8] transition-all active:scale-95"
            >
              <FileCheck className="h-4 w-4" />
              <span>Open Review Queue ({pendingCount})</span>
            </Link>
          </div>
        }
      />

      {/* Top 4 Mentor Workload KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Review Queue</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{pendingCount}</span>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Needs Review
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Review SLA Target:</span>
            <span className="font-bold text-[#1755A7]">&lt; 24 Hours</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Avg Turnaround Time</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
              <Zap className="h-4.5 w-4.5 text-[#1755A7]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#1755A7]">4.2 hrs</span>
            <span className="text-xs font-bold text-emerald-600">Fast Velocity</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Turnaround Rate:</span>
            <span className="font-bold text-slate-800">98.5% on-time</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Verified Claims</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">342</span>
            <span className="text-xs font-bold text-emerald-600">Approved</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Total Points Granted:</span>
            <span className="font-bold text-slate-800">38,400 pts</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Assigned Cohort Scholars</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8C401]/20 text-slate-900">
              <Users className="h-4.5 w-4.5 text-amber-700" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">240</span>
            <span className="text-xs font-semibold text-slate-500">Scholars</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Routing Department:</span>
            <span className="font-bold text-[#1755A7]">AI & Data Science</span>
          </div>
        </div>
      </div>

      {/* RICH VISUAL CHARTS SECTION (Exact Admin Caliber) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* CHART 1: Review Workload & Velocity Area/Line Chart */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#1755A7]" />
                6-Month Evaluation & Review Velocity
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monthly submissions received vs verified claims approved
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                <span className="h-2 w-2 rounded-full bg-[#1755A7]" /> Verified Approved
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                <span className="h-2 w-2 rounded-full bg-[#F8C401]" /> Received Claims
              </span>
            </div>
          </div>

          <div className="mt-6">
            <svg viewBox="0 0 600 200" className="w-full h-52 overflow-visible">
              <defs>
                <linearGradient id="mentorReviewGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1755A7" stopOpacity="0.35" />
                  <stop offset="70%" stopColor="#2563EB" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="mentorLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1755A7" />
                  <stop offset="50%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="30" x2="600" y2="30" stroke="#F1F5F9" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="0" y1="80" x2="600" y2="80" stroke="#F1F5F9" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="0" y1="130" x2="600" y2="130" stroke="#F1F5F9" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="0" y1="180" x2="600" y2="180" stroke="#E2E8F0" strokeWidth="1.5" />

              {/* Received Claims Dotted Gold Curve */}
              <path
                d="M 20 160 C 100 145, 180 120, 260 100 C 340 80, 420 65, 580 30"
                fill="none"
                stroke="#F8C401"
                strokeWidth="2.5"
                strokeDasharray="4 4"
                opacity="0.85"
              />

              {/* Area Gradient Fill */}
              <path
                d="M 20 180 L 20 165 C 100 150, 180 130, 260 110 C 340 90, 420 70, 580 40 L 580 180 Z"
                fill="url(#mentorReviewGrad)"
              />

              {/* Approved High-Res Multi-Stop Line Path */}
              <path
                d="M 20 165 C 100 150, 180 130, 260 110 C 340 90, 420 70, 580 40"
                fill="none"
                stroke="url(#mentorLineGrad)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Data Nodes */}
              {[
                { cx: 20, cy: 165, val: "24" },
                { cx: 130, cy: 145, val: "48" },
                { cx: 240, cy: 115, val: "72" },
                { cx: 350, cy: 90, val: "110" },
                { cx: 460, cy: 65, val: "145" },
                { cx: 580, cy: 40, val: "182" },
              ].map((pt, i) => (
                <g key={i}>
                  <circle cx={pt.cx} cy={pt.cy} r="6" fill="#FFFFFF" stroke="#1755A7" strokeWidth="2.5" />
                  <circle cx={pt.cx} cy={pt.cy} r="2.5" fill="#10B981" />
                </g>
              ))}
            </svg>

            {/* X-Axis Months */}
            <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-2 px-1">
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
              <span>Jul</span>
              <span>Aug</span>
              <span className="text-[#1755A7]">Sep (Active)</span>
            </div>
          </div>
        </div>

        {/* CHART 2: Seamless Conic Donut (Submission Category Breakdown) */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-[#1755A7]" />
              Submission Category Share
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Distribution of review requests</p>
          </div>

          <div className="mt-6 flex flex-col items-center">
            {/* Seamless Conic Donut Ring */}
            <div className="relative flex items-center justify-center">
              <div 
                className="h-44 w-44 rounded-full shadow-inner"
                style={{
                  background: "conic-gradient(#1755A7 0% 40%, #2563EB 40% 70%, #F8C401 70% 88%, #10B981 88% 100%)",
                }}
              />
              {/* Inner Cutout */}
              <div className="absolute h-28 w-28 rounded-full bg-white shadow-sm flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-900">356</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Claims</span>
              </div>
            </div>

            {/* Legend Breakdown */}
            <div className="mt-6 grid grid-cols-2 gap-2.5 w-full">
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 border border-slate-100">
                <span className="h-2.5 w-2.5 rounded-full bg-[#1755A7]" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-semibold">DLI Courses</span>
                  <span className="text-xs font-bold text-slate-900">40% (142)</span>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 border border-slate-100">
                <span className="h-2.5 w-2.5 rounded-full bg-[#2563EB]" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-semibold">DGX Capstones</span>
                  <span className="text-xs font-bold text-slate-900">30% (107)</span>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 border border-slate-100">
                <span className="h-2.5 w-2.5 rounded-full bg-[#F8C401]" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-semibold">Hackathons</span>
                  <span className="text-xs font-bold text-slate-900">18% (64)</span>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 border border-slate-100">
                <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-semibold">Research Papers</span>
                  <span className="text-xs font-bold text-slate-900">12% (43)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECOND CHARTS ROW: Cohort Progress Multi-Bar & 7-Day Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* CHART 3: Department Cohort Progression Multi-Bar */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#1755A7]" />
                Mentored Cohort Competency Progress
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Total Enrolled Scholars vs Advanced Level Milestone Cleared
              </p>
            </div>
            <span className="text-xs font-bold text-[#1755A7] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
              Dept: AI & Data Science
            </span>
          </div>

          <div className="mt-5 flex flex-col gap-4">
            {[
              { cohort: "2nd Year (2024-2028 Cohort)", total: 90, cleared: 78, pct: 86, grad: "from-[#1755A7] to-[#2563EB]" },
              { cohort: "3rd Year (2023-2027 Cohort)", total: 85, cleared: 72, pct: 84, grad: "from-[#1D4ED8] to-[#3B82F6]" },
              { cohort: "4th Year (2022-2026 Cohort)", total: 65, cleared: 60, pct: 92, grad: "from-[#F8C401] to-[#EAB308]" },
            ].map((c, i) => (
              <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60">
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="text-slate-900">{c.cohort}</span>
                  <span className="font-mono text-slate-700">{c.cleared} of {c.total} Scholars Cleared ({c.pct}%)</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200/80 flex">
                  <div 
                    className={`h-full rounded-full bg-gradient-to-r ${c.grad} transition-all duration-500`} 
                    style={{ width: `${c.pct}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHART 4: 7-Day Mentor Evaluation Velocity */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#1755A7]" />
              7-Day Review Throughput
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Claims audited per day this week</p>
          </div>

          <div className="mt-6 flex items-end justify-between gap-2 h-44 px-2">
            {[
              { day: "Mon", count: 8, fill: "from-[#1755A7] to-[#2563EB]" },
              { day: "Tue", count: 14, fill: "from-[#1755A7] to-[#2563EB]" },
              { day: "Wed", count: 6, fill: "from-[#1755A7] to-[#2563EB]" },
              { day: "Thu", count: 18, fill: "from-[#F8C401] to-[#EAB308]" },
              { day: "Fri", count: 22, fill: "from-[#1755A7] to-[#2563EB]" },
              { day: "Sat", count: 10, fill: "from-[#1755A7] to-[#2563EB]" },
              { day: "Sun", count: 4, fill: "from-slate-400 to-slate-500" },
            ].map((col, idx) => (
              <div key={idx} className="flex flex-1 flex-col items-center gap-2 h-full justify-end">
                <span className="font-mono text-[10px] font-bold text-slate-600">{col.count}</span>
                <div className="w-full max-w-[28px] rounded-t-xl overflow-hidden bg-slate-100 flex items-end" style={{ height: `${(col.count / 24) * 100}%` }}>
                  <div className={`w-full h-full rounded-t-xl bg-gradient-to-t ${col.fill}`} />
                </div>
                <span className="text-[10px] font-bold text-slate-500">{col.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PENDING SUBMISSIONS REVIEW QUEUE TABLE */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="h-4.5 w-4.5 text-[#1755A7]" />
              Recent Evidence Claims Awaiting Evaluation
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review code repositories, artifacts, and approve competency points
            </p>
          </div>
          <Link
            href="/mentor/queue"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#1755A7] hover:underline"
          >
            <span>View Full Queue</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {queue.isLoading ? (
          <div className="p-8 text-center">
            <Spinner label="Loading review queue..." />
          </div>
        ) : queue.isError ? (
          <div className="mt-4">
            <ErrorBanner error={queue.error} />
          </div>
        ) : !queue.data || queue.data.items.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
            <p className="font-bold text-slate-700">Queue is clear!</p>
            <p className="text-xs text-slate-400 mt-1">All student submissions for your department have been evaluated.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3 rounded-l-xl">Scholar & Register No</th>
                  <th className="px-5 py-3">Submission Track & Category</th>
                  <th className="px-5 py-3">Submitted At</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right rounded-r-xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queue.data.items.map((c) => (
                  <tr key={c.claimId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7] font-bold text-xs">
                          {c.student.fullName.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-xs">{c.student.fullName}</span>
                          <span className="text-[11px] text-slate-500 font-mono block">ID: {c.student.userId.slice(0, 12)}…</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                        {c.category.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 font-mono text-slate-600">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <StatusChip status={c.status as Status} />
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/mentor/queue/detail?id=${c.claimId}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#2563EB] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:from-[#124282] hover:to-[#1D4ED8] transition-all active:scale-95"
                      >
                        <span>Evaluate</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
