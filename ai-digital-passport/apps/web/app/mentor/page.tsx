"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, RadialBarChart, RadialBar,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { ConsoleShell } from "../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../components/console/ConsolePageHeader";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { Spinner } from "../../components/ui/Spinner";
import { StatusChip, type Status } from "../../components/ui/StatusChip";
import { mentorApi } from "../../lib/api";
import {
  FileCheck, Clock, CheckCircle2, Users, Award, TrendingUp,
  Calendar, ExternalLink, ChevronRight, BookOpen, Sparkles,
  ArrowUpRight, Zap, AlertTriangle, Activity, Layers,
} from "lucide-react";

const MONTHLY_REVIEW = [
  { month: "Apr", approved: 24,  received: 30  },
  { month: "May", received: 45,  approved: 40  },
  { month: "Jun", received: 62,  approved: 58  },
  { month: "Jul", received: 88,  approved: 82  },
  { month: "Aug", received: 120, approved: 112 },
  { month: "Sep", received: 145, approved: 135 },
];

const CATEGORY_DONUT = [
  { name: "DLI Courses",    value: 40, color: "#1755A7" },
  { name: "DGX Capstones", value: 30, color: "#2563EB" },
  { name: "Hackathons",    value: 18, color: "#F8C401" },
  { name: "Research",      value: 12, color: "#10B981" },
];

const WEEKLY_THROUGHPUT = [
  { day: "Mon", count: 8  },
  { day: "Tue", count: 14 },
  { day: "Wed", count: 6  },
  { day: "Thu", count: 18 },
  { day: "Fri", count: 22 },
  { day: "Sat", count: 10 },
  { day: "Sun", count: 4  },
];

const COHORT_RADIAL = [
  { name: "2nd Year",  fill: "#1755A7", value: 86 },
  { name: "3rd Year",  fill: "#2563EB", value: 84 },
  { name: "4th Year",  fill: "#F8C401", value: 92 },
];

const LIVE_FEED = [
  { id: 1, user: "Aadhithya V.",   action: "Submitted DLI Capstone proof for TensorRT-LLM",  time: "5m",  bg: "bg-blue-50",    ring: "ring-blue-400/40",    ic: "text-[#1755A7]",   icon: BookOpen      },
  { id: 2, user: "Sneha R.",       action: "GPU Compute Lab attestation pending review",       time: "18m", bg: "bg-emerald-50", ring: "ring-emerald-400/40", ic: "text-emerald-600", icon: CheckCircle2  },
  { id: 3, user: "Team NeuralEdge",action: "Grand Challenge prototype awaiting evaluation",    time: "32m", bg: "bg-amber-50",   ring: "ring-amber-400/40",   ic: "text-amber-600",   icon: Zap           },
  { id: 4, user: "Vikram S.",      action: "Research paper submission flagged for re-check",   time: "1h",  bg: "bg-red-50",     ring: "ring-red-400/40",     ic: "text-red-500",     icon: AlertTriangle },
  { id: 5, user: "Priya K.",       action: "NeurIPS paper claim approved - +150 pts granted",  time: "2h",  bg: "bg-purple-50",  ring: "ring-purple-400/40",  ic: "text-purple-600",  icon: Award         },
];

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 backdrop-blur-sm px-3 py-2 shadow-xl text-[11px]">
      <p className="font-black text-slate-700 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-semibold" style={{ color: p.color ?? p.stroke }}>
          {p.name}: <span className="font-black text-slate-900">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

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
    queryFn: () => mentorApi.queue({ page: 1, pageSize: 10 }),
  });

  const pendingCount = queue.data?.total ?? 14;
  const totalClaims = CATEGORY_DONUT.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
      <ConsolePageHeader
        title="Faculty Mentor Workspace"
        description="Review student capstones, evaluate research claims, and track cohort competency velocity."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/mentor/courses"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-all"
            >
              <BookOpen className="h-3.5 w-3.5 text-[#1755A7]" /> Curriculum
            </Link>
            <Link
              href="/mentor/queue"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1755A7] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#103E7E] transition-all"
            >
              <FileCheck className="h-3.5 w-3.5" /> Review Queue ({pendingCount})
            </Link>
          </div>
        }
      />

      {/* Row 1: 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-amber-400/40 hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#F8C401] via-[#F59E0B] to-[#EA580C]" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold text-slate-500">Pending Review Queue</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-400/15">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{pendingCount}</span>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Needs Review</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Review SLA target</span>
            <span className="font-bold text-[#1755A7]">Under 24 hours</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#1755A7] via-[#2563EB] to-[#38BDF8]" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold text-slate-500">Avg Turnaround Time</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1755A7]/15 to-[#2563EB]/10 text-[#1755A7]">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight bg-gradient-to-r from-[#1755A7] to-[#2563EB] bg-clip-text text-transparent">4.2h</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
              <TrendingUp className="h-3 w-3" /> Fast
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>On-time rate</span>
            <span className="font-bold text-slate-800">98.5%</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-emerald-400/40 hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold text-slate-500">Total Verified Claims</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700 tracking-tight">342</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
              <TrendingUp className="h-3 w-3" /> Approved
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Points granted</span>
            <span className="font-bold text-slate-800">38,400 pts</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-amber-400/40 hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#F8C401] via-amber-400 to-amber-600" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold text-slate-500">Assigned Scholars</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
              <Users className="h-4 w-4 text-amber-600" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">240</span>
            <span className="text-[11px] font-semibold text-slate-500">Scholars</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Department</span>
            <span className="font-bold text-[#1755A7]">AI and Data Science</span>
          </div>
        </div>
      </div>

      {/* Row 2: Area Trend + Category Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#1755A7]" />
              <h3 className="text-sm font-black text-slate-900">6-Month Evaluation Velocity</h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-full bg-[#1755A7] inline-block" />Approved</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-full bg-[#F8C401] inline-block" />Received</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mb-5">Monthly submissions received vs verified claims approved - Apr to Sep 2026</p>
          <ResponsiveContainer width="100%" height={195}>
            <AreaChart data={MONTHLY_REVIEW} margin={{ top: 4, right: 6, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gApproved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1755A7" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#1755A7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gReceived" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F8C401" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#F8C401" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="approved" name="Approved" stroke="#1755A7" strokeWidth={2.5} fill="url(#gApproved)" dot={false} activeDot={{ r: 5, fill: "#1755A7", strokeWidth: 0 }} />
              <Area type="monotone" dataKey="received" name="Received" stroke="#F8C401" strokeWidth={2} strokeDasharray="4 4" fill="url(#gReceived)" dot={false} activeDot={{ r: 4, fill: "#F8C401", strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-4 w-4 text-[#1755A7]" />
            <h3 className="text-sm font-black text-slate-900">Submission Category Share</h3>
          </div>
          <p className="text-[11px] text-slate-400 mb-5">Distribution of 356 total review requests by track</p>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="relative shrink-0">
              <ResponsiveContainer width={150} height={150}>
                <PieChart>
                  <Pie data={CATEGORY_DONUT} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={3} stroke="#fff" paddingAngle={2}>
                    {CATEGORY_DONUT.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-black text-slate-900">356</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Claims</span>
              </div>
            </div>
            <div className="w-full min-w-0 flex-1 space-y-2.5">
              {CATEGORY_DONUT.map((d) => {
                const pct = Math.round((d.value / totalClaims) * 100);
                return (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-[11px] font-semibold text-slate-700">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <div className="w-14 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: (pct * 2.4) + "%", backgroundColor: d.color }} />
                      </div>
                      <span className="font-black text-slate-800 w-7 text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Weekly Bar + Cohort Radial + Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-[#1755A7]" />
            <h3 className="text-sm font-black text-slate-900">7-Day Review Throughput</h3>
          </div>
          <p className="text-[11px] text-slate-400 mb-5">Claims audited per day this week</p>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={WEEKLY_THROUGHPUT} barCategoryGap="28%" margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="count" name="Reviews" fill="#1755A7" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Busiest day</span>
            <span className="font-black text-emerald-600">Friday - 22 reviews</span>
          </div>
        </div>

        <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="h-4 w-4 text-[#1755A7]" />
            <h3 className="text-sm font-black text-slate-900">Cohort Milestone Progress</h3>
          </div>
          <p className="text-[11px] text-slate-400 mb-2">Scholars cleared vs enrolled by year</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart cx="50%" cy="50%" innerRadius={25} outerRadius={85} data={COHORT_RADIAL} startAngle={90} endAngle={-270} barSize={14}>
              <RadialBar dataKey="value" background={{ fill: "#f1f5f9" }} cornerRadius={6} />
              <Tooltip content={<ChartTip />} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1.5">
            {COHORT_RADIAL.map((c) => (
              <span key={c.name} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: c.fill }} />
                {c.name} <span className="font-black text-slate-800">{c.value}%</span>
              </span>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <h3 className="text-sm font-black text-slate-900">Live Activity</h3>
            </div>
            <Link href="/mentor/queue" className="text-[10px] font-bold text-[#1755A7] flex items-center gap-0.5 hover:underline">
              All <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <p className="text-[11px] text-slate-400 mb-4">Real-time submission and evaluation events</p>
          <div className="space-y-3">
            {LIVE_FEED.map((log) => {
              const Icon = log.icon;
              return (
                <div key={log.id} className="flex items-start gap-3">
                  <div className={"flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-2 " + log.ring + " " + log.bg}>
                    <Icon className={"h-3.5 w-3.5 " + log.ic} />
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

      {/* Review Queue Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4.5 w-4.5 text-[#1755A7]" />
            <h2 className="text-base font-bold text-slate-900">Evidence Claims Awaiting Evaluation</h2>
          </div>
          <Link href="/mentor/queue" className="inline-flex items-center gap-1 text-xs font-bold text-[#1755A7] hover:underline">
            <span>View Full Queue</span><ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <p className="text-[11px] text-slate-400 mb-5">Review code repositories, artifacts, and approve competency points</p>

        {queue.isLoading ? (
          <div className="p-8 text-center"><Spinner label="Loading review queue..." /></div>
        ) : queue.isError ? (
          <div className="mt-4"><ErrorBanner error={queue.error} /></div>
        ) : !queue.data || queue.data.items.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
            <p className="font-bold text-slate-700">Queue is clear!</p>
            <p className="text-xs text-slate-400 mt-1">All student submissions for your department have been evaluated.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3 rounded-l-xl">Scholar and Register No</th>
                  <th className="px-5 py-3">Submission Track and Category</th>
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
                          <span className="text-[11px] text-slate-500 font-mono block">ID: {c.student.userId.slice(0, 12)}...</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                        {c.category.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-600">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 text-center"><StatusChip status={c.status as Status} /></td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={"mentor/queue/detail?id=" + c.claimId}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#1755A7] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#103E7E] transition-all active:scale-95"
                      >
                        <span>Evaluate</span><ChevronRight className="h-3.5 w-3.5" />
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
