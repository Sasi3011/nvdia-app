"use client";

import Link from "next/link";
import { 
  CalendarCheck, 
  GraduationCap, 
  Cpu, 
  FolderKanban, 
  Trophy, 
  Microscope, 
  Briefcase, 
  Rocket, 
  Award,
  ArrowUpRight
} from "lucide-react";

interface ModuleInfo {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  minLevel: number;
  pointsRange: string;
  icon: typeof Cpu;
  accentColor: string;
  badge: string;
  href: string;
}

const MODULES: ModuleInfo[] = [
  {
    id: "sessions",
    title: "Sessions & Masterclasses",
    subtitle: "Tech Eves @ AI Centre",
    description: "Weekly expert talks, masterclasses, and tech sessions with instant zero-friction QR check-in.",
    minLevel: 1,
    pointsRange: "+10 pts / session",
    icon: CalendarCheck,
    accentColor: "from-[#1755A7]/10 to-[#1755A7]/5 text-[#1755A7] border-[#1755A7]/20",
    badge: "All Levels",
    href: "/sessions",
  },
  {
    id: "certifications",
    title: "AI Learning Academy",
    subtitle: "11 Canonical Providers",
    description: "Submit and verify course completions from NVIDIA DLI, NPTEL, Coursera, Hugging Face, AWS, and more.",
    minLevel: 1,
    pointsRange: "+50 to +150 pts",
    icon: GraduationCap,
    accentColor: "from-emerald-500/10 to-emerald-600/5 text-emerald-700 border-emerald-200",
    badge: "Accredited",
    href: "/certifications",
  },
  {
    id: "labs",
    title: "GPU Supercomputing Labs",
    subtitle: "Hands-on Fridays & DGX Cluster",
    description: "Direct access to enterprise GPU hardware, TensorRT optimization pipelines, and model benchmarking.",
    minLevel: 2,
    pointsRange: "+30 pts / lab",
    icon: Cpu,
    accentColor: "from-[#1755A7]/15 to-[#1755A7]/5 text-[#1755A7] border-[#1755A7]/30",
    badge: "Level 2+",
    href: "/labs",
  },
  {
    id: "projects",
    title: "AI Project Showcase",
    subtitle: "AI Project Mela",
    description: "Build, demonstrate, and archive end-to-end AI applications across robotics, vision, NLP, and multimodal AI.",
    minLevel: 1,
    pointsRange: "+100 pts",
    icon: FolderKanban,
    accentColor: "from-[#1755A7]/10 to-[#F8C401]/10 text-[#1755A7] border-[#1755A7]/20",
    badge: "All Levels",
    href: "/projects",
  },
  {
    id: "hackathons",
    title: "Hackathons & Buildathons",
    subtitle: "3-Tier Competition Calendar",
    description: "Compete in quarterly Mini Challenges, semester Buildathons, and the flagship Sri Eshwar NVIDIA Grand Challenge.",
    minLevel: 2,
    pointsRange: "+100 to +250 pts",
    icon: Trophy,
    accentColor: "from-[#F8C401]/20 to-[#F8C401]/5 text-slate-900 border-[#F8C401]/50",
    badge: "Level 2+",
    href: "/hackathons",
  },
  {
    id: "research",
    title: "Research & Publications",
    subtitle: "AI Research Friday",
    description: "Bi-monthly symposium presenting novel architectures, GPU utilization results, patents, and conference papers.",
    minLevel: 3,
    pointsRange: "+150 to +300 pts",
    icon: Microscope,
    accentColor: "from-purple-500/10 to-purple-600/5 text-purple-700 border-purple-200",
    badge: "Level 3+",
    href: "/research",
  },
  {
    id: "problems",
    title: "Industry Problem Bank",
    subtitle: "100+ Real-World Challenges",
    description: "Solve high-value technical problem statements submitted directly by top-tier tech partners and enterprise labs.",
    minLevel: 3,
    pointsRange: "+250 pts",
    icon: Briefcase,
    accentColor: "from-teal-500/10 to-teal-600/5 text-teal-700 border-teal-200",
    badge: "Level 3+ Gate",
    href: "/problems",
  },
  {
    id: "startup",
    title: "Startup Launchpad",
    subtitle: "Venture Incubation",
    description: "Transform verified capstone AI systems into funded ventures with milestone-based faculty & investor reviews.",
    minLevel: 3,
    pointsRange: "+200 to +500 pts",
    icon: Rocket,
    accentColor: "from-rose-500/10 to-rose-600/5 text-rose-700 border-rose-200",
    badge: "Level 3+",
    href: "/startup",
  },
  {
    id: "leaderboard",
    title: "Leaderboard & Fellowships",
    subtitle: "Annual Institutional Audit",
    description: "Compete for top campus rankings, merit badges, GPU credit grants, and prestigious High-Impact AI Fellowships.",
    minLevel: 1,
    pointsRange: "Annual Audit",
    icon: Award,
    accentColor: "from-[#F8C401]/30 to-[#F8C401]/10 text-slate-900 border-[#F8C401]",
    badge: "Campus-Wide",
    href: "/leaderboard",
  },
];

export function ModulesGrid() {
  return (
    <section id="features" className="py-24 bg-white border-b border-slate-200">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center w-full space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#1755A7]/10 px-3.5 py-1 text-xs font-bold text-[#1755A7] border border-[#1755A7]/20">
            <Cpu className="h-3.5 w-3.5" />
            <span>THE 9-GRID ARCHITECTURE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Integrated Lifecycle for Complete AI Competency
          </h2>
          <p className="text-base text-slate-600">
            Nine interconnected modules designed to guide engineering students from basic deep learning concepts to autonomous supercomputing deployments.
          </p>
        </div>

        {/* 3x3 Responsive Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODULES.map((module) => {
            const Icon = module.icon;
            return (
              <div
                key={module.id}
                className="group relative flex flex-col justify-between rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-xs hover:shadow-xl hover:border-[#1755A7]/50 transition-all duration-300"
              >
                <div>
                  {/* Top Bar inside Card */}
                  <div className="flex items-center justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${module.accentColor} border shadow-xs`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-extrabold text-slate-700 border border-slate-200">
                      {module.badge}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="mt-5 space-y-1">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#1755A7] transition-colors flex items-center gap-1.5">
                      {module.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500">
                      {module.subtitle}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                    {module.description}
                  </p>
                </div>

                {/* Bottom Card Footer */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">
                    {module.pointsRange}
                  </span>

                  <Link
                    href={module.href}
                    className="flex items-center gap-1 text-xs font-bold text-[#1755A7] group-hover:text-[#103E7E] hover:underline"
                  >
                    <span>View Module</span>
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
