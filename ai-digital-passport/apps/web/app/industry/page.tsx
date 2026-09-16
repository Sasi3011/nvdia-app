"use client";

import { useState } from "react";
import Link from "next/link";
import { StudentShell } from "../../components/shell/StudentShell";
import { 
  Building2, 
  Sparkles, 
  Briefcase, 
  ArrowUpRight, 
  CheckCircle2, 
  Award, 
  MapPin, 
  DollarSign, 
  X, 
  Send,
  Users,
  ShieldCheck,
  Search,
  ExternalLink
} from "lucide-react";

interface IndustryPartner {
  name: string;
  category: string;
  opportunities: number;
  location: string;
  badge: string;
  description: string;
}

const PARTNERS: IndustryPartner[] = [
  {
    name: "NVIDIA AI Technology Center",
    category: "Supercomputing & Foundation Models",
    opportunities: 8,
    location: "Bengaluru / SECE DGX Lab",
    badge: "Tier-1 Strategic",
    description: "Joint research, CUDA optimization, and generative AI fellowship pathways with NVIDIA AI architects.",
  },
  {
    name: "Bosch Global Software Technologies",
    category: "Autonomous Systems & Edge AI",
    opportunities: 12,
    location: "Coimbatore & Bengaluru",
    badge: "Core Partner",
    description: "Vision AI defect inspection, sensor fusion, and smart mobility co-ops with fast-track hiring.",
  },
  {
    name: "Qualcomm AI Research",
    category: "Spatial & Mobile Computing",
    opportunities: 6,
    location: "Hyderabad / Remote",
    badge: "Core Partner",
    description: "Neural Processing Unit (NPU) kernel acceleration, edge LLM quantization, and XR spatial computing.",
  },
  {
    name: "Zoho Corporation AI Labs",
    category: "Enterprise Cloud & Natural Language",
    opportunities: 15,
    location: "Chennai / Tenkasi",
    badge: "Ecosystem Partner",
    description: "Multilingual LLMs, document understanding, and enterprise generative workflow automation.",
  },
];

interface Opportunity {
  id: string;
  company: string;
  role: string;
  type: "6-Month Internship" | "AI Co-op" | "Joint R&D Project";
  stipend: string;
  pointsBounty: number;
  eligibility: string;
}

const OPPORTUNITIES: Opportunity[] = [
  {
    id: "opp-1",
    company: "NVIDIA AI Technology Center",
    role: "Deep Learning Compiler & TensorRT Engineer Intern",
    type: "6-Month Internship",
    stipend: "₹65,000 / month",
    pointsBounty: 450,
    eligibility: "Level 3+ with C++ / CUDA competency",
  },
  {
    id: "opp-2",
    company: "Bosch Global Software",
    role: "Computer Vision & Edge Defect AI Specialist",
    type: "AI Co-op",
    stipend: "₹45,000 / month",
    pointsBounty: 400,
    eligibility: "Level 2+ with PyTorch & OpenCV",
  },
  {
    id: "opp-3",
    company: "Qualcomm AI Research",
    role: "On-Device SLM Quantization Research Fellow",
    type: "Joint R&D Project",
    stipend: "₹50,000 / month",
    pointsBounty: 500,
    eligibility: "Level 3+ with LLM fine-tuning experience",
  },
];

export default function IndustryPage() {
  const [activeOpp, setActiveOpp] = useState<Opportunity | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  return (
    <StudentShell>
      <div className="space-y-6">
        
        {/* Top Header Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 lg:p-8 shadow-xs">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-gradient-to-br from-[#1755A7]/10 to-[#F8C401]/15 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-3xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1755A7]/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#1755A7]">
                  <Sparkles className="h-3.5 w-3.5 text-[#F8C401]" />
                  Industry Connect & Placements
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  40+ Corporate Partners
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900">Industry Partnerships, Internships & AI Co-ops</h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Connect directly with engineering leaders at NVIDIA, Bosch, Qualcomm, and top AI enterprises. Convert your verified competencies into high-stipend internships and direct pre-placement offers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/problems"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1755A7] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#134486] hover:shadow-md hover:shadow-[#1755A7]/20 active:scale-95"
              >
                Explore Problem Bank
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* 4 KPI Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Partner Enterprises</div>
            <div className="mt-2 text-2xl font-black text-[#1755A7]">24+ Companies</div>
            <div className="mt-1 text-xs text-slate-500">Tier-1 AI & Tech Labs</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Live AI Openings</div>
            <div className="mt-2 text-2xl font-black text-amber-600">65+ Roles</div>
            <div className="mt-1 text-xs text-slate-500">Internships & Co-op seats</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Average PPO Package</div>
            <div className="mt-2 text-2xl font-black text-emerald-600">18.5 LPA</div>
            <div className="mt-1 text-xs text-slate-500">Highest at 44 LPA</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Max Points Bounty</div>
            <div className="mt-2 text-2xl font-black text-slate-900">+500 pts</div>
            <div className="mt-1 text-xs text-slate-500">Upon internship completion</div>
          </div>
        </div>

        {/* Live Opportunities Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Featured Industry Openings & Fellowships</h2>
            <span className="text-xs font-bold text-slate-400">Fast-track selection based on verified competency ranking</span>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {OPPORTUNITIES.map((opp) => (
              <div
                key={opp.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-[#1755A7]/40 hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1755A7]/10 px-2.5 py-0.5 text-xs font-bold text-[#1755A7]">
                      <Building2 className="h-3 w-3" />
                      {opp.company}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F8C401]/15 px-2.5 py-0.5 font-mono text-xs font-black text-amber-900 border border-[#F8C401]/30">
                      <Sparkles className="h-3 w-3 text-[#F8C401]" />
                      +{opp.pointsBounty} pts
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 leading-snug">{opp.role}</h3>

                  <div className="space-y-2 rounded-xl bg-slate-50/80 p-3 text-xs border border-slate-100">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-medium">Engagement Type</span>
                      <span className="font-bold text-slate-900">{opp.type}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-medium">Monthly Stipend</span>
                      <span className="font-bold text-emerald-700">{opp.stipend}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-medium">Eligibility</span>
                      <span className="font-bold text-[#1755A7]">{opp.eligibility}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveOpp(opp)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1755A7] py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#134486] active:scale-95"
                  >
                    Apply with Verified Profile
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Corporate Partner Directory */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Active Corporate Partners</h2>
            <span className="text-xs font-bold text-slate-400">Regular campus presence and lab sponsorship</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PARTNERS.map((p, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                    {p.badge}
                  </span>
                  <span className="text-xs font-bold text-emerald-600">{p.opportunities} open roles</span>
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">{p.name}</h3>
                  <div className="mt-0.5 text-[11px] text-slate-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {p.location}
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{p.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Application Modal */}
        {activeOpp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Apply for Industry Opening</h3>
                    <p className="text-[11px] text-slate-500">{activeOpp.company}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveOpp(null);
                    setAppliedSuccess(false);
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {appliedSuccess ? (
                <div className="p-6 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="text-base font-black text-slate-900">Application Dispatched!</h4>
                  <p className="text-xs text-slate-600">
                    Your verified AI competence transcript, GPU project repository, and rank credentials have been sent to {activeOpp.company}&apos;s recruiting team.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setAppliedSuccess(true);
                  }}
                  className="space-y-4 text-xs font-medium text-slate-700"
                >
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Target Opening</label>
                    <input
                      type="text"
                      disabled
                      value={activeOpp.role}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-600 font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-900 mb-1">Current Competency Level</label>
                      <input
                        type="text"
                        disabled
                        value="Level 3: AI Builder (2,450 pts)"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-600 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-900 mb-1">Availability Window</label>
                      <select className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-[#1755A7] focus:outline-none bg-white">
                        <option value="IMMEDIATE">Immediate / Full-time Co-op</option>
                        <option value="SUMMER">Summer 2026 Batch</option>
                        <option value="FALL">Fall 2026 Batch</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Relevant Projects / Portfolio Highlights</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Highlight 2-3 key models you trained, GPU optimizations, or open-source repositories…"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-[#1755A7] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Resume / LinkedIn Profile URL</label>
                    <input
                      type="url"
                      required
                      placeholder="https://linkedin.com/in/..."
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-[#1755A7] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveOpp(null)}
                      className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#1755A7] px-4 py-2 font-bold text-white hover:bg-[#134486] transition-all shadow-xs"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Submit Application
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </StudentShell>
  );
}
