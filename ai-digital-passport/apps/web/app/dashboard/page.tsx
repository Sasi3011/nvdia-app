"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, RadialBarChart, RadialBar,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { StudentShell } from "../../components/shell/StudentShell";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { LevelBadge } from "../../components/ui/LevelBadge";
import { Spinner } from "../../components/ui/Spinner";
import { StatusChip, type Status } from "../../components/ui/StatusChip";
import { claimsApi, levelsApi } from "../../lib/api";
import { useMe } from "../../lib/session";
import {
  Award, BookOpen, Cpu, Flag, GraduationCap, Microscope, Plus,
  Rocket, ShieldCheck, Sparkles, TrendingUp, Trophy, Users,
  ChevronRight, Lightbulb, FileCheck, Zap, Layers, ArrowUpRight,
  ExternalLink, Activity, Calendar, Star,
} from "lucide-react";

const MONTHLY_POINTS = [
  { month: "Jan", points: 100,  target: 150  },
  { month: "Feb", points: 240,  target: 300  },
  { month: "Mar", points: 480,  target: 450  },
  { month: "Apr", points: 720,  target: 600  },
  { month: "May", points: 950,  target: 750  },
  { month: "Jun", points: 1050, target: 900  },
  { month: "Jul", points: 1280, target: 1100 },
  { month: "Aug", points: 1380, target: 1250 },
  { month: "Sep", points: 1450, target: 1400 },
];

const PILLAR_DONUT = [
  { name: "Courses & DLI", value: 35, color: "#1755A7" },
  { name: "GPU Labs",       value: 25, color: "#2563EB" },
  { name: "Hackathons",     value: 20, color: "#F8C401" },
  { name: "Research",       value: 20, color: "#10B981" },
];

const WEEKLY_ACTIVITY = [
  { day: "Mon", hours: 4.5 },
  { day: "Tue", hours: 6.0 },
  { day: "Wed", hours: 3.5 },
  { day: "Thu", hours: 7.2 },
  { day: "Fri", hours: 8.5 },
  { day: "Sat", hours: 5.0 },
  { day: "Sun", hours: 2.0 },
];

const SKILL_RADIAL = [
  { name: "Deep Learning",  fill: "#1755A7", value: 88 },
  { name: "TensorRT-LLM",   fill: "#2563EB", value: 76 },
  { name: "Omniverse",      fill: "#F8C401", value: 64 },
  { name: "TinyML",         fill: "#10B981", value: 82 },
  { name: "DGX Compute",    fill: "#F59E0B", value: 70 },
  { name: "Multimodal AI",  fill: "#6366F1", value: 58 },
];

const LIVE_MILESTONES = [
  { id: 1, title: "Deep Learning Fundamentals",   pts: "+120 pts", badge: "DLI Certified",   bg: "bg-blue-50",    ring: "ring-blue-400/40",    ic: "text-[#1755A7]",   icon: BookOpen   },
  { id: 2, title: "DGX Lab - Transformer Tuning", pts: "+80 pts",  badge: "GPU Compute",     bg: "bg-emerald-50", ring: "ring-emerald-400/40", ic: "text-emerald-600", icon: Cpu        },
  { id: 3, title: "AI Hackathon - Top 5 Team",    pts: "+200 pts", badge: "Competition Win", bg: "bg-amber-50",   ring: "ring-amber-400/40",   ic: "text-amber-600",   icon: Flag       },
  { id: 4, title: "Research Abstract Submitted",  pts: "+150 pts", badge: "Fellowship",      bg: "bg-purple-50",  ring: "ring-purple-400/40",  ic: "text-purple-600",  icon: Microscope },
  { id: 5, title: "Industry Connect Interview",   pts: "+60 pts",  badge: "Placement",       bg: "bg-sky-50",     ring: "ring-sky-400/40",     ic: "text-sky-600",     icon: Users      },
];

const STUDENT_MODULES = [
  { href: "/courses",    label: "Courses and Pathways",      desc: "NVIDIA DLI and AI modules",          icon: BookOpen,   tag: "Learning",     color: "from-[#1755A7] to-[#2563EB]" },
  { href: "/gpu",        label: "DGX GPU Workspace",         desc: "Supercomputing compute nodes",        icon: Cpu,        tag: "Compute",      color: "from-[#1D4ED8] to-[#3B82F6]" },
  { href: "/problems",   label: "Industry Grand Challenges", desc: "Solve enterprise AI statements",      icon: Lightbulb,  tag: "Level 3+",     color: "from-[#F8C401] to-[#EAB308]" },
  { href: "/hackathons", label: "AI Hackathons",             desc: "Competitive team sprints",            icon: Flag,       tag: "Competition",  color: "from-[#F59E0B] to-[#F8C401]" },
  { href: "/research",   label: "Research Fellowships",      desc: "Lab grants and publications",         icon: Microscope, tag: "Fellowship",   color: "from-[#1755A7] to-[#1E40AF]" },
  { href: "/industry",   label: "Industry Connect",          desc: "Internships and corporate placements",icon: Users,      tag: "Placement",    color: "from-[#2563EB] to-[#60A5FA]" },
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
            <Link href="/scan" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-all active:scale-95">
              <Star className="h-4 w-4 text-[#F8C401]" /><span>My Passport</span>
            </Link>
            <Link href="/leaderboard" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-all active:scale-95">
              <Trophy className="h-4 w-4 text-[#F8C401]" /><span>Leaderboard</span>
            </Link>
            <Link href="/claims/new" className="inline-flex items-center gap-2 rounded-xl bg-[#1755A7] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#103E7E] transition-all active:scale-95">
              <Plus className="h-4 w-4" /><span>Submit Evidence</span>
            </Link>
          </div>
        </div>
        <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
          <div className="md:col-span-2">
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
          <div className="flex items-center justify-between md:justify-end gap-6 text-xs border-t md:border-t-0 md:border-l border-slate-100 md:pl-6 pt-4 md:pt-0">
            <div>
              <span className="text-[11px] text-slate-400 font-semibold block">GPU Balance</span>
              <span className="text-base font-black text-emerald-700 font-mono flex items-center gap-1">
                <Cpu className="h-4 w-4 text-emerald-600" />{profile.gpuCreditBalance.toLocaleString()} hrs
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-semibold block">Privilege</span>
              <span className="text-xs font-bold text-slate-800 max-w-[140px] truncate block" title={profile.level.unlockedPrivilege}>{profile.level.unlockedPrivilege}</span>
            </div>
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
            <span className="text-3xl font-black text-slate-900 tracking-tight">#14</span>
            <span className="text-[11px] font-semibold text-slate-500">in AI and DS</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Overall standing</span><span className="font-bold text-[#1755A7]">Top 2% of 5,280</span>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#1755A7] via-indigo-400 to-purple-400" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold text-slate-500">Verified Credentials</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]"><ShieldCheck className="h-4 w-4" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">8</span>
            <span className="text-[11px] font-bold text-emerald-600">Accreditations</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Verification proof</span><span className="font-bold text-slate-800">100% Cryptographic</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#1755A7]" />
              <h3 className="text-sm font-black text-slate-900">Competency Velocity Trajectory</h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-full bg-[#1755A7] inline-block" />Points</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-full bg-[#F8C401] inline-block" />Target</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mb-5">Cumulative points through courses, GPU labs and hackathons - Jan to Sep 2026</p>
          <ResponsiveContainer width="100%" height={195}>
            <AreaChart data={MONTHLY_POINTS} margin={{ top: 4, right: 6, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gPoints" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1755A7" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#1755A7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gTarget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F8C401" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#F8C401" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="points" name="Points" stroke="#1755A7" strokeWidth={2.5} fill="url(#gPoints)" dot={false} activeDot={{ r: 5, fill: "#1755A7", strokeWidth: 0 }} />
              <Area type="monotone" dataKey="target" name="Target" stroke="#F8C401" strokeWidth={2} strokeDasharray="4 4" fill="url(#gTarget)" dot={false} activeDot={{ r: 4, fill: "#F8C401", strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-4 w-4 text-[#1755A7]" />
            <h3 className="text-sm font-black text-slate-900">Learning Pillar Points</h3>
          </div>
          <p className="text-[11px] text-slate-400 mb-5">Distribution of {profile.totalPoints.toLocaleString()} pts by activity pillar</p>
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <ResponsiveContainer width={150} height={150}>
                <PieChart>
                  <Pie data={PILLAR_DONUT} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={3} stroke="#fff" paddingAngle={2}>
                    {PILLAR_DONUT.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-black text-slate-900">{profile.totalPoints}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total pts</span>
              </div>
            </div>
            <div className="flex-1 space-y-2.5">
              {PILLAR_DONUT.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-[11px] font-semibold text-slate-700">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono">
                    <div className="w-14 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: (d.value * 2.5) + "%", backgroundColor: d.color }} />
                    </div>
                    <span className="font-black text-slate-800 w-7 text-right">{d.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-[#1755A7]" />
            <h3 className="text-sm font-black text-slate-900">7-Day Study Velocity</h3>
          </div>
          <p className="text-[11px] text-slate-400 mb-5">Daily GPU lab and study hours this week</p>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={WEEKLY_ACTIVITY} barCategoryGap="28%" margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="hours" name="Hours" fill="#1755A7" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Peak day this week</span>
            <span className="font-black text-emerald-600">Friday - 8.5h</span>
          </div>
        </div>
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-4 w-4 text-[#F8C401]" />
            <h3 className="text-sm font-black text-slate-900">AI Skill Mastery</h3>
          </div>
          <p className="text-[11px] text-slate-400 mb-2">Evaluated thresholds from NVIDIA DLI labs and projects</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart cx="50%" cy="50%" innerRadius={20} outerRadius={85} data={SKILL_RADIAL} startAngle={90} endAngle={-270} barSize={11}>
              <RadialBar dataKey="value" background={{ fill: "#f1f5f9" }} cornerRadius={6} />
              <Tooltip content={<ChartTip />} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1.5">
            {SKILL_RADIAL.map((s) => (
              <span key={s.name} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.fill }} />
                {s.name} <span className="font-black text-slate-800">{s.value}%</span>
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
              <h3 className="text-sm font-black text-slate-900">Recent Milestones</h3>
            </div>
            <Link href="/claims" className="text-[10px] font-bold text-[#1755A7] flex items-center gap-0.5 hover:underline">
              All <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <p className="text-[11px] text-slate-400 mb-4">Your latest verified competency achievements</p>
          <div className="space-y-3">
            {LIVE_MILESTONES.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.id} className="flex items-start gap-3">
                  <div className={"flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-2 " + m.ring + " " + m.bg}>
                    <Icon className={"h-3.5 w-3.5 " + m.ic} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black text-slate-800 truncate">{m.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">{m.badge}</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 shrink-0 pt-0.5">{m.pts}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-[#1755A7]" />Supercomputing Platform Modules and Hubs
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Explore specialized pathways, live GPU compute labs, and competitive challenges</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STUDENT_MODULES.map((m) => {
            const Icon = m.icon;
            return (
              <Link key={m.href} href={m.href} className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-[#1755A7] hover:shadow-md transition-all active:scale-95">
                <div>
                  <div className="flex items-center justify-between">
                    <div className={"flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br " + m.color + " text-white shadow-sm"}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">{m.tag}</span>
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-slate-900 group-hover:text-[#1755A7] transition-colors">{m.label}</h3>
                  <p className="mt-1 text-xs text-slate-500">{m.desc}</p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold text-[#1755A7]">
                  <span>Access Module</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
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
        <p className="text-[11px] text-slate-400 mb-5">Live review status from faculty mentors</p>
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
