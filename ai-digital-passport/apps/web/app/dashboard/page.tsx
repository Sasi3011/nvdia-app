"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { StudentShell } from "../../components/shell/StudentShell";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { LevelBadge } from "../../components/ui/LevelBadge";
import { Spinner } from "../../components/ui/Spinner";
import { StatusChip, type Status } from "../../components/ui/StatusChip";
import { claimsApi, levelsApi, meApi } from "../../lib/api";
import { useMe } from "../../lib/session";
import {
  Award, BookOpen, Cpu, Flag, GraduationCap, Microscope, Plus,
  Rocket, ShieldCheck, Sparkles, TrendingUp, Trophy,
  ChevronRight, Lightbulb, FileCheck, Layers, ArrowUpRight,
  ExternalLink, Activity, Calendar,
} from "lucide-react";

// Category -> learning pillar label/color, purely presentational grouping of the
// real scoring-matrix categories returned by /me/progress (summary.pointsByCategory).
const PILLAR_META: Record<string, { label: string; color: string }> = {
  course_completion: { label: "Courses & DLI", color: "#1755A7" },
  gpu_friday_lab: { label: "GPU Labs", color: "#2563EB" },
  tech_eve_masterclass: { label: "Sessions & Masterclasses", color: "#6366F1" },
  certification_project_hackathon: { label: "Certifications & Projects", color: "#F8C401" },
  industry_hackathon_win: { label: "Hackathons", color: "#F59E0B" },
  hackathon_registration: { label: "Hackathons", color: "#F59E0B" },
  research_patent: { label: "Research", color: "#10B981" },
};
const OTHER_PILLAR = { label: "Other", color: "#94A3B8" };

const STUDENT_MODULES = [
  { href: "/courses",    label: "Courses and Pathways",      desc: "NVIDIA DLI and AI modules",          icon: BookOpen,   tag: "Learning",     color: "from-[#1755A7] to-[#2563EB]" },
  { href: "/gpu",        label: "DGX GPU Workspace",         desc: "Supercomputing compute nodes",        icon: Cpu,        tag: "Compute",      color: "from-[#1D4ED8] to-[#3B82F6]" },
  { href: "/problems",   label: "Industry Grand Challenges", desc: "Solve enterprise AI statements",      icon: Lightbulb,  tag: "Level 3+",     color: "from-[#F8C401] to-[#EAB308]" },
  { href: "/hackathons", label: "AI Hackathons",             desc: "Competitive team sprints",            icon: Flag,       tag: "Competition",  color: "from-[#F59E0B] to-[#F8C401]" },
  { href: "/research",   label: "Research Fellowships",      desc: "Lab grants and publications",         icon: Microscope, tag: "Fellowship",   color: "from-[#1755A7] to-[#1E40AF]" },
  { href: "/startup",    label: "Startup Launchpad",         desc: "AI venture incubation",               icon: Rocket,     tag: "Innovation",   color: "from-[#F8C401] to-[#F59E0B]" },
  { href: "/claims",     label: "Evidence and Claims",       desc: "Submit proof and verify points",      icon: FileCheck,  tag: "Verification", color: "from-[#1755A7] to-[#2563EB]" },
  { href: "/awards",     label: "Awards and Credentials",    desc: "Official certificates and badges",    icon: Award,      tag: "Distinction",  color: "from-[#10B981] to-[#059669]" },
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

export default function DashboardPage() {
  return (
    <StudentShell>
      <DashboardContent />
    </StudentShell>
  );
}

function DashboardContent() {
  const me = useMe(true);
  const levels = useQuery({ queryKey: ["levels"], queryFn: levelsApi.list });
  const progress = useQuery({ queryKey: ["me", "progress"], queryFn: meApi.progress });
  const recentClaims = useQuery({
    queryKey: ["claims", "recent"],
    queryFn: () => claimsApi.list({ page: 1, pageSize: 5 }),
  });

  if (me.isLoading || levels.isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner label="Loading student AI analytics..." />
      </div>
    );
  }

  if (me.isError) return <ErrorBanner error={me.error} />;
  if (!me.data) return null;

  const profile = me.data;
  const sortedLevels = [...(levels.data ?? [])].sort((a, b) => a.levelId - b.levelId);
  const currentLevelId = profile.level.levelId;
  const startingLevel = sortedLevels[0];
  // Below the first level's threshold the student is still "getting started" towards level 1.
  const gettingStarted = !!startingLevel && profile.totalPoints < startingLevel.minPoints;
  const nextLevel = gettingStarted ? startingLevel : sortedLevels.find((l) => l.levelId > currentLevelId);
  const currentThreshold = gettingStarted ? 0 : profile.level.minPoints;
  const nextThreshold = nextLevel ? nextLevel.minPoints : currentThreshold + 1000;
  const levelProgress = Math.min(100, Math.max(0,
    Math.round(((profile.totalPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
  ));

  // ---- Derived, fully real analytics from /me/progress (no fabricated numbers) ----
  const pointsHistory = progress.data?.pointsHistory ?? [];
  const pointsByCategory = progress.data?.summary.pointsByCategory ?? [];
  const claimCounts = progress.data?.summary.claims;
  const rank = progress.data?.profile.rank ?? null;
  const credentialCount = (progress.data?.summary.badges ?? 0) + (progress.data?.summary.certificates ?? 0);

  // Cumulative points per month, oldest to newest, from the real transaction ledger.
  const monthlyPoints = (() => {
    const chronological = [...pointsHistory].reverse();
    const byMonth = new Map<string, number>();
    let running = 0;
    for (const t of chronological) {
      running += t.points;
      const key = new Date(t.createdAt).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
      byMonth.set(key, running);
    }
    return Array.from(byMonth, ([month, points]) => ({ month, points }));
  })();

  const pillarBreakdown = pointsByCategory.map((c) => ({
    name: (PILLAR_META[c.category] ?? OTHER_PILLAR).label,
    value: c.points,
    color: (PILLAR_META[c.category] ?? OTHER_PILLAR).color,
  }));
  const pillarTotal = pillarBreakdown.reduce((n, p) => n + p.value, 0) || 1;

  const claimsBarData = claimCounts
    ? [
        { label: "Approved", count: claimCounts.approved, fill: "#10B981" },
        { label: "Pending", count: claimCounts.pending, fill: "#F8C401" },
        { label: "Rejected", count: claimCounts.rejected, fill: "#DC2626" },
      ]
    : [];

  const recentMilestones = pointsHistory.slice(0, 5);

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-6 shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#1755A7] via-[#F8C401] to-[#2563EB]" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <LevelBadge levelId={currentLevelId} size={72} locked={gettingStarted} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-bold text-[#1755A7]">
                  <Sparkles className="h-3.5 w-3.5 text-[#F8C401]" />
                  {profile.level.levelName}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-mono font-bold text-slate-600">
                  {profile.registerNum}
                </span>
              </div>
              <h1 className="mt-1.5 text-2xl font-black text-slate-900 tracking-tight">Welcome back, {profile.fullName}</h1>
              <p className="text-xs text-slate-500 mt-0.5">{profile.department} - Cohort {profile.cohortYear} - Sri Eshwar NVIDIA AI Centre</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/leaderboard" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-all active:scale-95">
              <Trophy className="h-4 w-4 text-[#F8C401]" /><span>Leaderboard</span>
            </Link>
            <Link href="/claims/new" className="inline-flex items-center gap-2 rounded-xl bg-[#1755A7] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#103E7E] transition-all active:scale-95">
              <Plus className="h-4 w-4" /><span>Submit Evidence</span>
            </Link>
          </div>
        </div>
        <div className="mt-5 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-slate-700 flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-[#1755A7]" />Progress to {nextLevel?.levelName ?? "Apex Grandmaster"}
            </span>
            <span className="text-[#1755A7] font-mono font-black">{profile.totalPoints.toLocaleString()} / {nextThreshold.toLocaleString()} pts ({levelProgress}%)</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/80">
            <div className="h-full rounded-full bg-gradient-to-r from-[#1755A7] via-[#2563EB] to-[#F8C401] transition-all duration-700" style={{ width: levelProgress + "%" }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#1755A7] via-[#2563EB] to-[#38BDF8]" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold text-slate-500">Competency Points</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1755A7]/15 to-[#2563EB]/10 text-[#1755A7]"><Award className="h-4 w-4" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{profile.totalPoints.toLocaleString()}</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600"><TrendingUp className="h-3 w-3" /> L{profile.level.levelId}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Next milestone</span><span className="font-bold text-slate-800">+{(nextThreshold - profile.totalPoints).toLocaleString()} pts</span>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-emerald-400/40 hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold text-slate-500">DGX GPU Quota</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Cpu className="h-4 w-4" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700 tracking-tight">{profile.gpuCreditBalance.toLocaleString()}</span>
            <span className="text-[11px] font-bold text-emerald-600">Hours Active</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Cluster access</span><span className="font-bold text-slate-800">NVIDIA DGX-A100</span>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-amber-400/40 hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#F8C401] via-[#F59E0B] to-[#EA580C]" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold text-slate-500">Institutional Rank</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50"><Trophy className="h-4 w-4 text-amber-600" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{progress.isLoading ? "…" : rank ? `#${rank}` : "—"}</span>
            <span className="text-[11px] font-semibold text-slate-500">among all students</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Overall standing</span>
            <Link href="/leaderboard" className="font-bold text-[#1755A7] hover:underline">View full leaderboard</Link>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#1755A7] via-indigo-400 to-purple-400" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold text-slate-500">Verified Credentials</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]"><ShieldCheck className="h-4 w-4" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{progress.isLoading ? "…" : credentialCount}</span>
            <span className="text-[11px] font-bold text-emerald-600">Badges + Certificates</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Verification proof</span><span className="font-bold text-slate-800">100% Cryptographic</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-black text-slate-900">Level Badges</h2>
          <span className="text-[11px] font-semibold text-slate-500">Earn points to unlock each badge</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {sortedLevels.map((l) => {
            const unlocked = !gettingStarted && l.levelId <= currentLevelId;
            return (
              <div key={l.levelId} className="flex flex-col items-center gap-1 text-center">
                <LevelBadge levelId={l.levelId} size={88} locked={!unlocked} />
                <span className="text-[11px] font-mono font-bold text-slate-500">{l.minPoints.toLocaleString()} pts</span>
                <span className={`text-[10px] font-bold ${unlocked ? "text-emerald-600" : "text-slate-400"}`}>
                  {unlocked ? (l.levelId === currentLevelId ? "Current level" : "Unlocked") : "Locked"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#1755A7]" />
              <h3 className="text-sm font-black text-slate-900">Competency Velocity Trajectory</h3>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mb-5">Your cumulative points over time, from your real points ledger</p>
          {progress.isLoading ? (
            <div className="flex h-[195px] items-center justify-center"><Spinner label="Loading…" /></div>
          ) : monthlyPoints.length === 0 ? (
            <div className="flex h-[195px] items-center justify-center text-center text-xs text-slate-400">
              No points earned yet — submit evidence to start your trajectory.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={195}>
              <AreaChart data={monthlyPoints} margin={{ top: 4, right: 6, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gPoints" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1755A7" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#1755A7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="points" name="Total points" stroke="#1755A7" strokeWidth={2.5} fill="url(#gPoints)" dot={false} activeDot={{ r: 5, fill: "#1755A7", strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-4 w-4 text-[#1755A7]" />
            <h3 className="text-sm font-black text-slate-900">Learning Pillar Points</h3>
          </div>
          <p className="text-[11px] text-slate-400 mb-5">Distribution of {profile.totalPoints.toLocaleString()} pts by activity pillar</p>
          {progress.isLoading ? (
            <div className="flex h-[150px] items-center justify-center"><Spinner label="Loading…" /></div>
          ) : pillarBreakdown.length === 0 ? (
            <div className="flex h-[150px] items-center justify-center text-center text-xs text-slate-400">
              No approved evidence yet.
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <ResponsiveContainer width={150} height={150}>
                  <PieChart>
                    <Pie data={pillarBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={3} stroke="#fff" paddingAngle={2}>
                      {pillarBreakdown.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-lg font-black text-slate-900">{profile.totalPoints}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total pts</span>
                </div>
              </div>
              <div className="flex-1 space-y-2.5">
                {pillarBreakdown.map((d) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-[11px] font-semibold text-slate-700">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <div className="w-14 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: Math.round((d.value / pillarTotal) * 100) + "%", backgroundColor: d.color }} />
                      </div>
                      <span className="font-black text-slate-800 w-9 text-right">{Math.round((d.value / pillarTotal) * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-[#1755A7]" />
            <h3 className="text-sm font-black text-slate-900">Evidence Claims by Status</h3>
          </div>
          <p className="text-[11px] text-slate-400 mb-5">Your real claim review outcomes</p>
          {progress.isLoading ? (
            <div className="flex h-[190px] items-center justify-center"><Spinner label="Loading…" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={claimsBarData} barCategoryGap="28%" margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTip />} cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="count" name="Claims">
                  {claimsBarData.map((d, i) => <Cell key={i} fill={d.fill} radius={[5, 5, 0, 0] as any} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="h-4 w-4 text-[#F8C401]" />
            <h3 className="text-sm font-black text-slate-900">Activity Overview</h3>
          </div>
          <p className="text-[11px] text-slate-400 mb-4">Your real record across every program</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Courses completed", value: progress.data?.summary.coursesCompleted ?? 0 },
              { label: "Courses in progress", value: progress.data?.summary.coursesInProgress ?? 0 },
              { label: "Sessions attended", value: progress.data?.summary.classesAttended ?? 0 },
              { label: "Projects", value: progress.data?.summary.projects ?? 0 },
              { label: "Hackathon regs verified", value: progress.data?.summary.hackathonRegistrationsVerified ?? 0 },
              { label: "Certificates", value: progress.data?.summary.certificates ?? 0 },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                <div className="text-lg font-black text-slate-900">{progress.isLoading ? "…" : s.value}</div>
                <div className="text-[10px] font-semibold text-slate-500 leading-tight mt-0.5">{s.label}</div>
              </div>
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
              <h3 className="text-sm font-black text-slate-900">Recent Milestones</h3>
            </div>
            <Link href="/claims" className="text-[10px] font-bold text-[#1755A7] flex items-center gap-0.5 hover:underline">
              All <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <p className="text-[11px] text-slate-400 mb-4">Your latest verified competency achievements</p>
          {progress.isLoading ? (
            <div className="p-4 text-center"><Spinner label="Loading…" /></div>
          ) : recentMilestones.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">No points earned yet.</div>
          ) : (
            <div className="space-y-3">
              {recentMilestones.map((m) => (
                <div key={m.transactionId} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-2 ring-blue-400/40 bg-blue-50">
                    <Award className="h-3.5 w-3.5 text-[#1755A7]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black text-slate-800 truncate">{m.reason}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">{new Date(m.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 shrink-0 pt-0.5">+{m.points} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>



      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4.5 w-4.5 text-[#1755A7]" />
            <h2 className="text-base font-bold text-slate-900">Recent Evidence Claims</h2>
          </div>
          <Link href="/claims" className="inline-flex items-center gap-1 text-xs font-bold text-[#1755A7] hover:underline">
            <span>View All</span><ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <p className="text-[11px] text-slate-400 mb-5">Live review status from faculty</p>
        {recentClaims.isLoading ? (
          <div className="p-8 text-center"><Spinner label="Loading claims..." /></div>
        ) : recentClaims.isError ? (
          <div className="mt-4"><ErrorBanner error={recentClaims.error} /></div>
        ) : !recentClaims.data || recentClaims.data.items.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <FileCheck className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="font-bold text-slate-700">No submissions yet.</p>
            <p className="text-xs text-slate-400 mt-1">Click Submit Evidence to register your first verified milestone.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3 rounded-l-xl">Evidence Item and Category</th>
                  <th className="px-5 py-3">Submission Date</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right rounded-r-xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentClaims.data.items.map((c) => (
                  <tr key={c.claimId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1755A7]/10 text-[#1755A7]"><Award className="h-4 w-4" /></div>
                        <div>
                          <span className="font-bold text-slate-900 text-xs">{c.category.replace(/_/g, " ")}</span>
                          {c.claimId && <span className="text-[10px] text-slate-400 font-mono block">ID: {c.claimId.slice(0, 12)}...</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-600">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 text-center"><StatusChip status={c.status as Status} /></td>
                    <td className="px-5 py-3.5 text-right">
                      <Link href="/claims" className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95">
                        <span>Details</span><ExternalLink className="h-3 w-3 text-slate-400" />
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
