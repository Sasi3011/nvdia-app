"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar,
  RadialBarChart, RadialBar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { ConsoleShell } from "../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../components/console/ConsolePageHeader";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { Spinner } from "../../components/ui/Spinner";
import { adminDashboardApi, type AdminDashboardResponse } from "../../lib/api";
import {
  Users, FileCheck, Plus, TrendingUp, Activity,
  Award, ShieldCheck, CheckCircle2, XCircle, Calendar,
  PieChart as PieIcon, Sparkles, Layers,
} from "lucide-react";

/* ─── Presentation constants (colours only, no data) ─────── */

const LEVEL_COLORS = ["#1755A7", "#2563EB", "#38BDF8", "#818CF8", "#F8C401", "#EA580C"];
const CATEGORY_COLORS = ["#1755A7", "#F8C401", "#0284C7", "#059669", "#7C3AED"];

const ACTIVITY_STYLE: Record<AdminDashboardResponse["recentActivity"][number]["kind"], { icon: typeof Award; ring: string; bg: string; ic: string }> = {
  CLAIM_APPROVED: { icon: CheckCircle2, ring: "ring-emerald-400/40", bg: "bg-emerald-50", ic: "text-emerald-600" },
  CLAIM_REJECTED: { icon: XCircle, ring: "ring-red-400/40", bg: "bg-red-50", ic: "text-red-500" },
  CLAIM_SUBMITTED: { icon: FileCheck, ring: "ring-blue-400/40", bg: "bg-blue-50", ic: "text-blue-600" },
  POINTS: { icon: Award, ring: "ring-amber-400/40", bg: "bg-amber-50", ic: "text-amber-500" },
};

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.round(hrs / 24)}d`;
}

/* ─── Custom Tooltip ─────────────────────────────────────── */
function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 backdrop-blur-sm px-3 py-2 shadow-xl text-[11px]">
      <p className="font-black text-slate-700 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-semibold" style={{ color: p.color ?? p.payload?.fill }}>
          {p.name}: <span className="font-black text-slate-900">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-200 px-4 text-center text-xs font-semibold text-slate-400">
      {text}
    </div>
  );
}

const cardClass = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6";
const kpiClass = "relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-4 shadow-sm transition-all hover:border-[#1755A7]/40 hover:shadow-md sm:p-5";

/* ─── Page ───────────────────────────────────────────────── */
export default function AdminDashboardPage() {
  const summary = useQuery({ queryKey: ["admin", "dashboard"], queryFn: adminDashboardApi.summary, refetchInterval: 60_000 });
  const d = summary.data;

  const totalStudents = d?.totalStudents ?? 0;
  const tiers = (d?.levelDistribution ?? []).map((l, i) => ({ name: `L${l.levelId} · ${l.levelName}`, value: l.count, color: LEVEL_COLORS[i % LEVEL_COLORS.length] as string }));
  const hasClaimsTrend = (d?.monthlyClaims ?? []).some((m) => m.approved + m.pending + m.rejected > 0);
  const hasWeekly = (d?.weeklyClaims ?? []).some((m) => m.approved + m.pending + m.rejected > 0);
  const weekTotals = (d?.weeklyClaims ?? []).reduce((acc, w) => ({ a: acc.a + w.approved, p: acc.p + w.pending, r: acc.r + w.rejected }), { a: 0, p: 0, r: 0 });
  const pillars = (d?.categoryPoints ?? []).map((c, i) => ({ name: c.label, fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length] as string, value: c.share, points: c.points }));

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader
        title="Admin Dashboard"
        description="Competency metrics, claim velocity, and live activity."
        actions={
          <>
            <Link href="/admin/reports" className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition-all hover:bg-slate-50 sm:min-h-0 sm:flex-none">
              <PieIcon className="h-3.5 w-3.5 text-[#1755A7]" /> Reports
            </Link>
            <Link href="/admin/events" className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#1755A7] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#103E7E] sm:min-h-0 sm:flex-none">
              <Plus className="h-3.5 w-3.5" /> New Event
            </Link>
          </>
        }
      />

      {summary.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner label="Loading dashboard…" />
        </div>
      ) : summary.isError ? (
        <ErrorBanner error={summary.error} />
      ) : d ? (
        <div className="mt-1 flex flex-col gap-4 sm:gap-5">

          {/* ── Row 1: KPI cards ── */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">

            <div className={kpiClass}>
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#1755A7] via-[#2563EB] to-[#38BDF8]" />
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Enrolled Scholars</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1755A7]/15 to-[#2563EB]/10 text-[#1755A7]">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-3xl font-black tracking-tight text-slate-900">{d.totalStudents.toLocaleString()}</span>
                <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
                  <TrendingUp className="h-3 w-3" /> +{d.newStudents30d.toLocaleString()} in 30 days
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
                <span>Active this week</span>
                <span className="font-bold text-slate-800">
                  {d.activeStudents7d.toLocaleString()}
                  {totalStudents > 0 ? ` (${Math.round((d.activeStudents7d / totalStudents) * 100)}%)` : ""}
                </span>
              </div>
            </div>

            <div className={kpiClass}>
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#1755A7] via-[#F8C401] to-[#EA580C]" />
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Points Awarded</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#F8C401]/25 to-[#EA580C]/15">
                  <Award className="h-4 w-4 text-amber-600" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="bg-gradient-to-r from-[#1755A7] to-[#2563EB] bg-clip-text text-3xl font-black tracking-tight text-transparent">
                  {d.totalPoints.toLocaleString()}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
                <span>Avg per student</span>
                <span className="font-bold text-slate-800">{d.avgPointsPerStudent.toLocaleString()} pts</span>
              </div>
            </div>

            <div className={`${kpiClass} hover:border-amber-400/40`}>
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#38BDF8] via-[#F59E0B] to-[#EA580C]" />
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Pending Audits</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-400/15">
                  <FileCheck className="h-4 w-4 text-amber-600" />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-3xl font-black tracking-tight text-slate-900">{d.pendingClaims.toLocaleString()}</span>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                  {d.pendingClaims === 0 ? "All clear" : "In Review"}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
                <span>Avg turnaround</span>
                <span className="font-bold text-slate-800">{d.avgReviewHours === null ? "No reviews yet" : `${d.avgReviewHours} hours`}</span>
              </div>
            </div>

            <div className={kpiClass}>
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400" />
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Live &amp; Upcoming Classes</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-400/10 text-emerald-600">
                  <Calendar className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight text-slate-900">{d.activeEvents.toLocaleString()}</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
                <span>Approval rate (7 days)</span>
                <span className="font-bold text-slate-800">{d.approvalRate7d === null ? "No reviews yet" : `${d.approvalRate7d}%`}</span>
              </div>
            </div>
          </div>

          {/* ── Row 2: Donut + Claim Trend ── */}
          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12">

            <div className={`${cardClass} lg:col-span-5`}>
              <div className="mb-1 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#1755A7]" />
                <h3 className="text-sm font-black text-slate-900">Competency Tiers</h3>
              </div>
              <p className="mb-5 text-[11px] text-slate-400">Distribution of {totalStudents.toLocaleString()} students across L1–L6</p>

              {totalStudents === 0 ? (
                <EmptyChart text="No students enrolled yet." />
              ) : (
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-3">
                  <div className="relative h-40 w-40 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={tiers} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" strokeWidth={3} stroke="#fff" paddingAngle={2}>
                          {tiers.map((t, i) => <Cell key={i} fill={t.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-black text-slate-900">{totalStudents.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-slate-400">Students</span>
                    </div>
                  </div>

                  <div className="w-full min-w-0 flex-1 space-y-2">
                    {tiers.map((t) => {
                      const pct = totalStudents ? Math.round((t.value / totalStudents) * 100) : 0;
                      return (
                        <div key={t.name} className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: t.color }} />
                            <span className="truncate text-[11px] font-semibold text-slate-700">{t.name}</span>
                          </div>
                          <div className="flex shrink-0 items-center gap-2 font-mono text-[11px]">
                            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-100 sm:w-16">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: t.color }} />
                            </div>
                            <span className="w-14 text-right font-black text-slate-800">{t.value.toLocaleString()} <span className="font-semibold text-slate-400">({pct}%)</span></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className={`${cardClass} lg:col-span-7`}>
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#1755A7]" />
                  <h3 className="text-sm font-black text-slate-900">Claim Verification Trend</h3>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-4 rounded-full bg-[#1755A7]" />Approved</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-4 rounded-full bg-[#F59E0B]" />Pending</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-4 rounded-full bg-[#EF4444]" />Rejected</span>
                </div>
              </div>
              <p className="mb-5 text-[11px] text-slate-400">Claim submissions by month, last 12 months</p>

              {!hasClaimsTrend ? (
                <EmptyChart text="No claims have been submitted in the last 12 months." />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={d.monthlyClaims} margin={{ top: 4, right: 6, left: -20, bottom: 0 }}>
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
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={16} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<Tip />} />
                    <Area type="monotone" dataKey="approved" name="Approved" stroke="#1755A7" strokeWidth={2.5} fill="url(#gApproved)" dot={false} activeDot={{ r: 5, fill: "#1755A7", strokeWidth: 0 }} />
                    <Area type="monotone" dataKey="pending" name="Pending" stroke="#F59E0B" strokeWidth={2} fill="url(#gPending)" dot={false} activeDot={{ r: 4, fill: "#F59E0B", strokeWidth: 0 }} />
                    <Area type="monotone" dataKey="rejected" name="Rejected" stroke="#EF4444" strokeWidth={1.5} fill="none" dot={false} activeDot={{ r: 4, fill: "#EF4444", strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Row 3: Weekly bars + category points + activity feed ── */}
          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12">

            <div className={`${cardClass} lg:col-span-4`}>
              <div className="mb-1 flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#1755A7]" />
                <h3 className="text-sm font-black text-slate-900">Weekly Velocity</h3>
              </div>
              <p className="mb-5 text-[11px] text-slate-400">Claims submitted per day, last 7 days</p>

              {!hasWeekly ? (
                <EmptyChart text="No claims in the last 7 days." />
              ) : (
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={d.weeklyClaims} barCategoryGap="28%" margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<Tip />} cursor={{ fill: "#f8fafc" }} />
                    <Bar dataKey="approved" name="Approved" stackId="a" fill="#1755A7" />
                    <Bar dataKey="pending" name="Pending" stackId="a" fill="#BFDBFE" />
                    <Bar dataKey="rejected" name="Rejected" stackId="a" fill="#FCA5A5" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px]">
                <div className="flex items-center gap-3 text-slate-500">
                  <span className="flex items-center gap-1"><span className="inline-block h-2 w-3 rounded-sm bg-[#1755A7]" />Approved</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-2 w-3 rounded-sm bg-[#BFDBFE]" />Pending</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-2 w-3 rounded-sm bg-[#FCA5A5]" />Rejected</span>
                </div>
                <span className="font-black text-slate-700">{weekTotals.a + weekTotals.p + weekTotals.r} this week</span>
              </div>
            </div>

            <div className={`${cardClass} lg:col-span-4`}>
              <div className="mb-1 flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#1755A7]" />
                <h3 className="text-sm font-black text-slate-900">Points by Category</h3>
              </div>
              <p className="mb-2 text-[11px] text-slate-400">Share of approved-claim points, top categories</p>

              {pillars.length === 0 ? (
                <EmptyChart text="No approved claims yet." />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={190}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius={20} outerRadius={85} data={pillars} startAngle={90} endAngle={-270} barSize={12}>
                      <RadialBar dataKey="value" name="Share %" background={{ fill: "#f1f5f9" }} cornerRadius={6} />
                      <Tooltip content={<Tip />} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="mt-1 flex flex-col gap-1.5">
                    {pillars.map((p) => (
                      <span key={p.name} className="flex items-center justify-between gap-2 text-[10px] font-semibold text-slate-600">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: p.fill }} />
                          <span className="truncate">{p.name}</span>
                        </span>
                        <span className="shrink-0 font-black text-slate-800">{p.value}% · {p.points.toLocaleString()} pts</span>
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className={`${cardClass} lg:col-span-4`}>
              <div className="mb-1 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <h3 className="text-sm font-black text-slate-900">Live Activity</h3>
              </div>
              <p className="mb-4 text-[11px] text-slate-400">Latest claims and point awards</p>

              {d.recentActivity.length === 0 ? (
                <EmptyChart text="No activity recorded yet." />
              ) : (
                <div className="space-y-3">
                  {d.recentActivity.map((log) => {
                    const style = ACTIVITY_STYLE[log.kind];
                    const Icon = style.icon ?? Sparkles;
                    return (
                      <div key={log.id} className="flex items-start gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-2 ${style.ring} ${style.bg}`}>
                          <Icon className={`h-3.5 w-3.5 ${style.ic}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-black text-slate-800">{log.user}</p>
                          <p className="mt-0.5 break-words text-[10px] leading-relaxed text-slate-500">{log.action}</p>
                        </div>
                        <span className="shrink-0 pt-0.5 font-mono text-[10px] font-semibold text-slate-400">{timeAgo(log.at)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      ) : null}
    </ConsoleShell>
  );
}
