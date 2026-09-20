"use client";

import Link from "next/link";
import { 
  Calendar, 
  MapPin, 
  ArrowRight
} from "lucide-react";

interface Programme {
  name: string;
  cadence: string;
  description: string;
  points: string;
  category: "Weekly" | "Monthly" | "Hackathon" | "Research" | "Flagship";
  badgeClass: string;
}

const PROGRAMMES: Programme[] = [
  {
    name: "Tech Eves @ AI Centre",
    cadence: "Every Tuesday &bull; 4:00–5:00 PM",
    description: "Deep-dive technical talks on emerging AI, LLMs, and GPU architectures with live QR check-in.",
    points: "+10 pts",
    category: "Weekly",
    badgeClass: "bg-[#1755A7]/10 text-[#1755A7] border-[#1755A7]/30 font-bold"
  },
  {
    name: "GPU Hands-on Friday",
    cadence: "Every Friday &bull; Lab Session",
    description: "Hands-on GPU kernel optimization, TensorRT acceleration, and multi-node benchmarking.",
    points: "+30 pts",
    category: "Weekly",
    badgeClass: "bg-cyan-50 text-cyan-800 border-cyan-200 font-bold"
  },
  {
    name: "AI Masterclass",
    cadence: "Monthly &bull; Global Experts",
    description: "Keynotes and masterclasses by distinguished industry leaders and NVIDIA AI researchers.",
    points: "+10 pts",
    category: "Monthly",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200 font-bold"
  },
  {
    name: "AI Mini Challenge",
    cadence: "Quarterly &bull; 24-Hour Sprint",
    description: "Tier-1 rapid prototyping sprint tackling targeted algorithmic and data science challenges.",
    points: "+100 to +250 pts",
    category: "Hackathon",
    badgeClass: "bg-[#F8C401]/25 text-slate-900 border-[#F8C401] font-extrabold"
  },
  {
    name: "AI Buildathon",
    cadence: "Semester-wise &bull; 48-Hour Build",
    description: "Tier-2 product buildathon bringing multi-disciplinary teams together to build functional MVPs.",
    points: "+100 to +250 pts",
    category: "Hackathon",
    badgeClass: "bg-orange-50 text-orange-800 border-orange-200 font-bold"
  },
  {
    name: "Sri Eshwar NVIDIA AI Grand Challenge",
    cadence: "Annual Flagship &bull; National Tier",
    description: "Tier-3 nationwide championship with grand cash prizes, compute grants, and venture scouting.",
    points: "+250 pts / Grand Prize",
    category: "Flagship",
    badgeClass: "bg-[#F8C401] text-slate-900 border-[#F8C401] font-black"
  },
  {
    name: "AI Research Friday",
    cadence: "Every 2 Months (on 30th)",
    description: "Symposium for paper presentations, GPU benchmark disclosures, and patent drafts.",
    points: "+10 pts / +200 pts Paper",
    category: "Research",
    badgeClass: "bg-purple-50 text-purple-800 border-purple-200 font-bold"
  },
  {
    name: "AI Project Mela",
    cadence: "Annual Showcase &bull; Campus Arena",
    description: "Grand exhibition of student prototypes across robotics, vision, NLP, and intelligent IoT.",
    points: "+100 pts Demonstrated",
    category: "Flagship",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold"
  },
];

export function ProgrammeCalendarPreview() {
  return (
    <section id="programmes" className="py-24 bg-white border-b border-slate-200">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-slate-200">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#1755A7]/10 px-3.5 py-1 text-xs font-bold text-[#1755A7] border border-[#1755A7]/20">
              <Calendar className="h-3.5 w-3.5" />
              <span>OFFICIAL PROGRAMME CALENDAR</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Predictable, High-Impact Cadence
            </h2>
            <p className="text-base text-slate-600">
              Eight distinct recurring programme types ensuring constant point-earning opportunities and supercomputing lab engagement.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/sessions"
              className="flex items-center gap-2 rounded-xl bg-[#1755A7] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/20 hover:bg-[#103E7E] transition-all"
            >
              <span>View Upcoming Sessions</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Programmes Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PROGRAMMES.map((prog, idx) => (
            <div
              key={idx}
              className="group flex flex-col justify-between rounded-xl border-2 border-slate-200 bg-white p-5 shadow-2xs hover:shadow-md hover:border-[#1755A7]/40 transition-all duration-200"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] ${prog.badgeClass}`}>
                    {prog.category}
                  </span>
                  <span className="font-mono text-xs font-black text-[#1755A7] bg-[#1755A7]/10 px-2 py-0.5 rounded-md border border-[#1755A7]/20">
                    {prog.points}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#1755A7] transition-colors">
                    {prog.name}
                  </h3>
                  <p 
                    className="text-xs font-semibold text-slate-500 mt-1"
                    dangerouslySetInnerHTML={{ __html: prog.cadence }}
                  />
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {prog.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-800 font-medium">
                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  <MapPin className="h-3 w-3 text-[#1755A7]" /> AI Supercomputing Lab
                </span>
                <span className="text-[#1755A7] font-bold">Live Scan</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
