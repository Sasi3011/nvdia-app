"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { StudentShell } from "../../components/shell/StudentShell";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { Spinner } from "../../components/ui/Spinner";
import { StatusChip, type Status } from "../../components/ui/StatusChip";
import { claimsApi, levelsApi } from "../../lib/api";
import { useMe } from "../../lib/session";
import { 
  Award, 
  BookOpen, 
  Cpu, 
  Flag, 
  GraduationCap, 
  Microscope, 
  Plus, 
  Rocket, 
  ScanLine, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  Trophy, 
  Users, 
  ChevronRight,
  Lightbulb,
  FileCheck,
  Zap,
  Layers,
  ArrowUpRight,
  ExternalLink,
  PieChart as PieIcon,
  BarChart3,
  Calendar
} from "lucide-react";

const STUDENT_MODULES = [
  { href: "/courses", label: "Courses & Pathways", desc: "NVIDIA DLI & AI modules", icon: BookOpen, tag: "Learning", color: "from-[#1755A7] to-[#2563EB]" },
  { href: "/gpu", label: "DGX GPU Workspace", desc: "Supercomputing compute nodes", icon: Cpu, tag: "Compute", color: "from-[#1D4ED8] to-[#3B82F6]" },
  { href: "/problems", label: "Industry Grand Challenges", desc: "Solve enterprise AI statements", icon: Lightbulb, tag: "Level 3+", color: "from-[#F8C401] to-[#EAB308]" },
  { href: "/hackathons", label: "AI Hackathons", desc: "Competitive team sprints", icon: Flag, tag: "Competition", color: "from-[#F59E0B] to-[#F8C401]" },
  { href: "/research", label: "Research Fellowships", desc: "Lab grants & publications", icon: Microscope, tag: "Fellowship", color: "from-[#1755A7] to-[#1E40AF]" },
  { href: "/industry", label: "Industry Connect", desc: "Internships & corporate placements", icon: Users, tag: "Placement", color: "from-[#2563EB] to-[#60A5FA]" },
  { href: "/startup", label: "Startup Launchpad", desc: "AI venture incubation", icon: Rocket, tag: "Innovation", color: "from-[#F8C401] to-[#F59E0B]" },
  { href: "/claims", label: "Evidence & Claims", desc: "Submit proof & verify points", icon: FileCheck, tag: "Verification", color: "from-[#1755A7] to-[#2563EB]" },
  { href: "/awards", label: "Awards & Credentials", desc: "Official certificates & badges", icon: Award, tag: "Distinction", color: "from-[#10B981] to-[#059669]" },
];

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
    queryFn: () => claimsApi.list({ page: 1, pageSize: 5 }) 
  });

  if (me.isLoading || levels.isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner label="Loading student AI analytics…" />
      </div>
    );
  }
  
  if (me.isError) return <ErrorBanner error={me.error} />;
  if (!me.data) return null;

  const profile = me.data;
  const sortedLevels = [...(levels.data ?? [])].sort((a, b) => a.levelId - b.levelId);
  const currentLevelId = profile.level.levelId;
  const nextLevel = sortedLevels.find((l) => l.levelId > currentLevelId);
  const currentThreshold = profile.level.minPoints;
  const nextThreshold = nextLevel ? nextLevel.minPoints : currentThreshold + 1000;
  
  const levelProgress = Math.min(
    100,
    Math.max(0, Math.round(((profile.totalPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100))
  );

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
      
      {/* Top Welcome Banner Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        {/* Top Accent Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1755A7] via-[#F8C401] to-[#2563EB]" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1755A7] to-[#2563EB] text-white shadow-md shadow-[#1755A7]/25 font-black text-xl">
              {profile.fullName.charAt(0)}
            </div>
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
              <h1 className="mt-1.5 text-2xl font-black text-slate-900 tracking-tight">
                Welcome back, {profile.fullName}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {profile.department} • Cohort {profile.cohortYear} • Sri Eshwar NVIDIA AI Centre
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/claims/new"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] via-[#1A5EB7] to-[#2563EB] px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1D4ED8] transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Submit Evidence</span>
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-all active:scale-95"
            >
              <Trophy className="h-4 w-4 text-[#F8C401]" />
              <span>Leaderboard</span>
            </Link>
          </div>
        </div>

        {/* Level Progression Milestone Bar */}
        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-slate-700 flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-[#1755A7]" />
                Progress towards {nextLevel?.levelName || "Apex Grandmaster"}
              </span>
              <span className="text-[#1755A7] font-mono font-black">{profile.totalPoints.toLocaleString()} / {nextThreshold.toLocaleString()} pts ({levelProgress}%)</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/80">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-[#1755A7] via-[#2563EB] to-[#F8C401] transition-all duration-500 shadow-xs" 
                style={{ width: `${levelProgress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-6 text-xs border-t md:border-t-0 md:border-l border-slate-100 md:pl-6 pt-4 md:pt-0">
            <div>
              <span className="text-[11px] text-slate-400 font-semibold block">GPU Balance</span>
              <span className="text-base font-black text-emerald-700 font-mono flex items-center gap-1">
                <Cpu className="h-4 w-4 text-emerald-600" />
                {profile.gpuCreditBalance.toLocaleString()} hrs
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-semibold block">Unlocked Privilege</span>
              <span className="text-xs font-bold text-slate-800 max-w-[140px] truncate block" title={profile.level.unlockedPrivilege}>
                {profile.level.unlockedPrivilege}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 4 Scholar Metric Tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Competency Points</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
              <Award className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#1755A7]">{profile.totalPoints.toLocaleString()}</span>
            <span className="text-xs font-bold text-emerald-600 inline-flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> Level {profile.level.levelId}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Next Milestone:</span>
            <span className="font-bold text-slate-800">+{nextThreshold - profile.totalPoints} pts needed</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">DGX Supercomputing Quota</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Cpu className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{profile.gpuCreditBalance.toLocaleString()}</span>
            <span className="text-xs font-bold text-emerald-600">Hours Active</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Cluster Access:</span>
            <span className="font-bold text-slate-800">NVIDIA DGX-A100</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Institutional Rank</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8C401]/20 text-slate-900">
              <Trophy className="h-4.5 w-4.5 text-amber-700" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">#14</span>
            <span className="text-xs font-semibold text-slate-500">in AI & Data Science</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Overall Standing:</span>
            <span className="font-bold text-[#1755A7]">Top 2% of 5,280 Scholars</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Verified Accreditations</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">8</span>
            <span className="text-xs font-bold text-emerald-600">Credentials</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Verification Proof:</span>
            <span className="font-bold text-slate-800">100% Cryptographic</span>
          </div>
        </div>
      </div>

      {/* RICH VISUAL CHARTS SECTION (Exact Admin Caliber) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* CHART 1: 9-Month Competency Growth Area/Line Chart */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#1755A7]" />
                9-Month Competency Velocity Trajectory
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cumulative points earned through verified courses, DGX labs, and hackathons
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                <span className="h-2 w-2 rounded-full bg-[#1755A7]" /> Points Curve
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                <span className="h-2 w-2 rounded-full bg-[#F8C401]" /> Target Pace
              </span>
            </div>
          </div>

          <div className="mt-6">
            <svg viewBox="0 0 600 200" className="w-full h-52 overflow-visible">
              <defs>
                <linearGradient id="studentGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1755A7" stopOpacity="0.35" />
                  <stop offset="70%" stopColor="#2563EB" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="studentLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1755A7" />
                  <stop offset="50%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#F8C401" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="30" x2="600" y2="30" stroke="#F1F5F9" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="0" y1="80" x2="600" y2="80" stroke="#F1F5F9" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="0" y1="130" x2="600" y2="130" stroke="#F1F5F9" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="0" y1="180" x2="600" y2="180" stroke="#E2E8F0" strokeWidth="1.5" />

              {/* Benchmark Dotted Target Curve */}
              <path
                d="M 20 170 Q 150 140 300 100 T 580 40"
                fill="none"
                stroke="#F8C401"
                strokeWidth="2"
                strokeDasharray="4 4"
                opacity="0.75"
              />

              {/* Area Gradient Fill */}
              <path
                d="M 20 180 L 20 165 C 80 155, 140 145, 200 120 C 270 95, 340 90, 410 65 C 480 45, 530 35, 580 25 L 580 180 Z"
                fill="url(#studentGrowthGrad)"
              />

              {/* Actual High-Res Multi-Stop Line Path */}
              <path
                d="M 20 165 C 80 155, 140 145, 200 120 C 270 95, 340 90, 410 65 C 480 45, 530 35, 580 25"
                fill="none"
                stroke="url(#studentLineGrad)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Data Interactive Nodes */}
              {[
                { cx: 20, cy: 165, val: "100" },
                { cx: 110, cy: 150, val: "240" },
                { cx: 200, cy: 120, val: "480" },
                { cx: 290, cy: 100, val: "720" },
                { cx: 380, cy: 75, val: "1,050" },
                { cx: 470, cy: 50, val: "1,280" },
                { cx: 580, cy: 25, val: `${profile.totalPoints}` },
              ].map((pt, i) => (
                <g key={i}>
                  <circle cx={pt.cx} cy={pt.cy} r="6" fill="#FFFFFF" stroke="#1755A7" strokeWidth="2.5" />
                  <circle cx={pt.cx} cy={pt.cy} r="2.5" fill="#F8C401" />
                </g>
              ))}
            </svg>

            {/* X-Axis Months */}
            <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-2 px-1">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
              <span>Jul</span>
              <span>Aug</span>
              <span className="text-[#1755A7]">Sep (Now)</span>
            </div>
          </div>
        </div>

        {/* CHART 2: Seamless Conic-Gradient Donut Ring (Pillar Breakdown) */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-[#1755A7]" />
              Learning Pillars Point Share
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Points distribution by activity pillar</p>
          </div>

          <div className="mt-6 flex flex-col items-center">
            {/* Seamless Conic Donut Ring */}
            <div className="relative flex items-center justify-center">
              <div 
                className="h-44 w-44 rounded-full shadow-inner"
                style={{
                  background: "conic-gradient(#1755A7 0% 35%, #2563EB 35% 60%, #F8C401 60% 80%, #10B981 80% 100%)",
                }}
              />
              {/* Inner Cutout */}
              <div className="absolute h-28 w-28 rounded-full bg-white shadow-sm flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-900">{profile.totalPoints}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total pts</span>
              </div>
            </div>

            {/* Legend Breakdown */}
            <div className="mt-6 grid grid-cols-2 gap-2.5 w-full">
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 border border-slate-100">
                <span className="h-2.5 w-2.5 rounded-full bg-[#1755A7]" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-semibold">Courses & DLI</span>
                  <span className="text-xs font-bold text-slate-900">35% (507 pts)</span>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 border border-slate-100">
                <span className="h-2.5 w-2.5 rounded-full bg-[#2563EB]" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-semibold">GPU Labs</span>
                  <span className="text-xs font-bold text-slate-900">25% (362 pts)</span>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 border border-slate-100">
                <span className="h-2.5 w-2.5 rounded-full bg-[#F8C401]" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-semibold">Hackathons</span>
                  <span className="text-xs font-bold text-slate-900">20% (290 pts)</span>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 border border-slate-100">
                <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-semibold">Research & Capstone</span>
                  <span className="text-xs font-bold text-slate-900">20% (291 pts)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECOND CHARTS ROW: Core AI Competency Meters & 7-Day Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* CHART 3: 6-Pillar Skill Mastery Gradient Meters */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#F8C401]" />
                Core AI Competency Mastery Meters
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluated skill thresholds based on completed NVIDIA DLI labs & projects
              </p>
            </div>
            <span className="text-xs font-bold text-[#1755A7] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
              Level {profile.level.levelId} Profile
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { skill: "Deep Learning & PyTorch", val: 88, tag: "Advanced", grad: "from-[#1755A7] to-[#2563EB]" },
              { skill: "TensorRT-LLM & GenAI Deployment", val: 76, tag: "Proficient", grad: "from-[#1D4ED8] to-[#3B82F6]" },
              { skill: "NVIDIA Omniverse & Digital Twins", val: 64, tag: "Intermediate", grad: "from-[#F8C401] to-[#EAB308]" },
              { skill: "Edge TinyML & Sensor Analytics", val: 82, tag: "Advanced", grad: "from-[#1755A7] to-[#1E40AF]" },
              { skill: "DGX Supercomputing Acceleration", val: 70, tag: "Proficient", grad: "from-[#F59E0B] to-[#F8C401]" },
              { skill: "Multimodal AI Architecture", val: 58, tag: "Intermediate", grad: "from-[#2563EB] to-[#60A5FA]" },
            ].map((item, i) => (
              <div key={i} className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60">
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-900">{item.skill}</span>
                  <span className="font-mono text-slate-700">{item.val}% ({item.tag})</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/80">
                  <div 
                    className={`h-full rounded-full bg-gradient-to-r ${item.grad} transition-all duration-500`}
                    style={{ width: `${item.val}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHART 4: 7-Day Velocity Vertical Columns */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#1755A7]" />
              7-Day Activity Velocity
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Study & GPU lab hours this week</p>
          </div>

          <div className="mt-6 flex items-end justify-between gap-2 h-44 px-2">
            {[
              { day: "Mon", hrs: 4.5, fill: "from-[#1755A7] to-[#2563EB]" },
              { day: "Tue", hrs: 6.0, fill: "from-[#1755A7] to-[#2563EB]" },
              { day: "Wed", hrs: 3.5, fill: "from-[#1755A7] to-[#2563EB]" },
              { day: "Thu", hrs: 7.2, fill: "from-[#F8C401] to-[#EAB308]" },
              { day: "Fri", hrs: 8.5, fill: "from-[#1755A7] to-[#2563EB]" },
              { day: "Sat", hrs: 5.0, fill: "from-[#1755A7] to-[#2563EB]" },
              { day: "Sun", hrs: 2.0, fill: "from-slate-400 to-slate-500" },
            ].map((col, idx) => (
              <div key={idx} className="flex flex-1 flex-col items-center gap-2 h-full justify-end">
                <span className="font-mono text-[10px] font-bold text-slate-600">{col.hrs}h</span>
                <div className="w-full max-w-[28px] rounded-t-xl overflow-hidden bg-slate-100 flex items-end" style={{ height: `${(col.hrs / 9) * 100}%` }}>
                  <div className={`w-full h-full rounded-t-xl bg-gradient-to-t ${col.fill}`} />
                </div>
                <span className="text-[10px] font-bold text-slate-500">{col.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* INTERACTIVE 9-GRID MODULE DIRECTORY */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-[#1755A7]" />
              Supercomputing Platform Modules & Hubs
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Explore specialized pathways, live GPU compute labs, and competitive challenges
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STUDENT_MODULES.map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.href}
                href={m.href}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-[#1755A7] hover:shadow-md transition-all active:scale-95"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${m.color} text-white shadow-sm`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                      {m.tag}
                    </span>
                  </div>

                  <h3 className="mt-4 text-sm font-bold text-slate-900 group-hover:text-[#1755A7] transition-colors">
                    {m.label}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {m.desc}
                  </p>
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

      {/* RECENT ACTIVITY & CLAIMS STREAM */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="h-4.5 w-4.5 text-[#1755A7]" />
              Recent Evidence Claims & Verification Stream
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Track live review status from faculty mentors</p>
          </div>
          <Link
            href="/claims"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#1755A7] hover:underline"
          >
            <span>View All Claims</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentClaims.isLoading ? (
          <div className="p-8 text-center">
            <Spinner label="Loading claims stream..." />
          </div>
        ) : recentClaims.isError ? (
          <div className="mt-4">
            <ErrorBanner error={recentClaims.error} />
          </div>
        ) : !recentClaims.data || recentClaims.data.items.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <FileCheck className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="font-bold text-slate-700">No submissions yet.</p>
            <p className="text-xs text-slate-400 mt-1">Click "Submit Evidence" to register your first verified milestone.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3 rounded-l-xl">Evidence Item & Category</th>
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
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1755A7]/10 text-[#1755A7]">
                          <Award className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-xs">
                            {c.category.replace(/_/g, " ")}
                          </span>
                          {c.claimId && (
                            <span className="text-[10px] text-slate-400 font-mono block">ID: {c.claimId.slice(0, 12)}…</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 font-mono text-slate-600">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <StatusChip status={c.status as Status} />
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/claims`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
                      >
                        <span>Details</span>
                        <ExternalLink className="h-3 w-3 text-slate-400" />
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
