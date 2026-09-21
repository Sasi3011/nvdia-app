"use client";

import { useState } from "react";
import Link from "next/link";
import { StudentShell } from "../../components/shell/StudentShell";
import { useScoringPoints } from "../../lib/use-scoring-points";
import { 
  Microscope, 
  Sparkles, 
  BookOpen, 
  Cpu, 
  ArrowUpRight, 
  CheckCircle2, 
  FileText, 
  Award, 
  DollarSign, 
  X, 
  Send,
  Download,
  Building,
  Users
} from "lucide-react";

interface FellowshipGrant {
  id: string;
  title: string;
  domain: string;
  grantAmount: string;
  gpuCredits: string;
  pointsBounty: number;
  mentor: string;
  deadline: string;
  status: "OPEN" | "REVIEWING" | "CLOSED";
}

const FELLOWSHIPS: FellowshipGrant[] = [
  {
    id: "grant-1",
    title: "NVIDIA Generative BioNeMo & Molecular AI Fellowship",
    domain: "Computational Biology & Drug Discovery",
    grantAmount: "₹2,50,000",
    gpuCredits: "250 H100 Hours",
    pointsBounty: 500,
    mentor: "Dr. K. Senthil Kumar (AI Dean)",
    deadline: "Nov 30, 2026",
    status: "OPEN",
  },
  {
    id: "grant-2",
    title: "Edge TensorRT Deep Compression for Embedded Robotics",
    domain: "Edge AI & Embedded Systems",
    grantAmount: "₹1,80,000",
    gpuCredits: "150 L40S Hours",
    pointsBounty: 450,
    mentor: "Dr. M. Prakash (Robotics Lab Lead)",
    deadline: "Dec 15, 2026",
    status: "OPEN",
  },
  {
    id: "grant-3",
    title: "Distributed Neuromorphic Vision on DGX SuperPOD",
    domain: "Spiking Neural Networks & Neuromorphic Compute",
    grantAmount: "₹3,00,000",
    gpuCredits: "400 H100 Hours",
    pointsBounty: 500,
    mentor: "Prof. R. Anitha (HPC Director)",
    deadline: "Jan 10, 2027",
    status: "OPEN",
  },
];

export default function ResearchPage() {
  const researchPoints = useScoringPoints("research_patent");
  const [activeGrant, setActiveGrant] = useState<FellowshipGrant | null>(null);
  const [proposalSubmitted, setProposalSubmitted] = useState(false);

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
                  ₹52L NVIDIA Supercomputing Fund
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Grant Window Active
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900">AI Research Fellowships & Seed Grants</h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Publish high-impact papers in IEEE/ACM/NeurIPS or file national and international AI patents. Receive full GPU compute allocations on our H100 SuperPOD and up to +500 points per accepted publication.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/claims/new?category=research_patent"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1755A7] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#134486] hover:shadow-md hover:shadow-[#1755A7]/20 active:scale-95"
              >
                Submit Paper / Patent Evidence
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* 4 KPI Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Research Corpus</div>
            <div className="mt-2 text-2xl font-black text-amber-600">₹52,00,000</div>
            <div className="mt-1 text-xs text-slate-500">Sponsored seed grants</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Max Points Bounty</div>
            <div className="mt-2 text-2xl font-black text-[#1755A7]">{researchPoints != null ? `+${researchPoints} pts` : "—"}</div>
            <div className="mt-1 text-xs text-slate-500">Scored Q1 Journal / Patent</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Publications</div>
            <div className="mt-2 text-2xl font-black text-emerald-600">48+ Papers</div>
            <div className="mt-1 text-xs text-slate-500">IEEE, CVPR, NeurIPS 2026</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">GPU Grant Hours</div>
            <div className="mt-2 text-2xl font-black text-slate-900">5,000+ Hrs</div>
            <div className="mt-1 text-xs text-slate-500">Dedicated DGX allocation</div>
          </div>
        </div>

        {/* Active Fellowships Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Active Fellowship & Lab Grant Opportunities</h2>
            <span className="text-xs font-bold text-slate-400">Proposals reviewed bi-weekly by the Research Council</span>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {FELLOWSHIPS.map((grant) => (
              <div
                key={grant.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-[#1755A7]/40 hover:shadow-md"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200/60">
                      {grant.status}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F8C401]/15 px-2.5 py-0.5 font-mono text-xs font-black text-amber-900 border border-[#F8C401]/30">
                      <Sparkles className="h-3 w-3 text-[#F8C401]" />
                      +{grant.pointsBounty} pts
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{grant.domain}</span>
                    <h3 className="mt-1 text-base font-black text-slate-900 leading-snug">{grant.title}</h3>
                  </div>

                  <div className="space-y-2 rounded-xl bg-slate-50/80 p-3 text-xs border border-slate-100">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-medium">Direct Grant Amount</span>
                      <span className="font-bold text-slate-900">{grant.grantAmount}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-medium">Dedicated GPU Cluster</span>
                      <span className="font-bold text-[#1755A7]">{grant.gpuCredits}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-medium">Principal Mentor</span>
                      <span className="font-bold text-slate-900">{grant.mentor}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-medium">Proposal Deadline</span>
                      <span className="font-bold text-slate-900">{grant.deadline}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveGrant(grant)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1755A7] py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#134486] active:scale-95"
                  >
                    Submit Grant Proposal
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Research Workflow & Publication Venues */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Research Roadmap */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">4-Phase Research Lifecycle</h3>
                <p className="text-[11px] text-slate-500">From concept to Q1 publication and patent filing</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-slate-100 p-3 bg-slate-50/50">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>Phase 1: Proposal & Dataset Approval</span>
                  <span className="text-[#1755A7] font-mono">+100 pts</span>
                </div>
                <p className="mt-1 text-slate-500">Draft literature survey, objective, and submit to Dean AI Research Council.</p>
              </div>

              <div className="rounded-xl border border-slate-100 p-3 bg-slate-50/50">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>Phase 2: SuperPOD Experimentation</span>
                  <span className="text-[#1755A7] font-mono">+150 pts</span>
                </div>
                <p className="mt-1 text-slate-500">Run multi-node PyTorch / JAX distributed training on H100 clusters.</p>
              </div>

              <div className="rounded-xl border border-slate-100 p-3 bg-slate-50/50">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>Phase 3: Manuscript Submission & Peer Review</span>
                  <span className="text-[#1755A7] font-mono">+150 pts</span>
                </div>
                <p className="mt-1 text-slate-500">Submit manuscript to IEEE/ACM/Springer indexed conference or journal.</p>
              </div>

              <div className="rounded-xl border border-slate-100 p-3 bg-slate-50/50">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>Phase 4: Publication / Patent Grant & DOI Verification</span>
                  <span className="text-amber-600 font-mono">+500 pts</span>
                </div>
                <p className="mt-1 text-slate-500">Instant points crediting and entry into annual AI Excellence Awards.</p>
              </div>
            </div>
          </div>

          {/* Supported Publication Venues */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Recognized Publication Venues & Points Matrix</h3>
                <p className="text-[11px] text-slate-500">Automatic accreditation upon DOI / Patent Application receipt</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <strong className="text-slate-900">International AI Patent (USPTO / EPO / WIPO)</strong>
                  <div className="text-[11px] text-slate-500">Published / Granted status</div>
                </div>
                <span className="rounded-lg bg-amber-100 px-2.5 py-1 font-mono font-black text-amber-900">+500 pts</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <strong className="text-slate-900">Q1 Scopus / SCI-Indexed Journal (IEEE Trans, Nature MI)</strong>
                  <div className="text-[11px] text-slate-500">Impact factor &gt; 4.0</div>
                </div>
                <span className="rounded-lg bg-blue-100 px-2.5 py-1 font-mono font-black text-blue-900">+450 pts</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <strong className="text-slate-900">CORE A* Conference (NeurIPS, ICML, CVPR, ICLR)</strong>
                  <div className="text-[11px] text-slate-500">Main track oral / poster</div>
                </div>
                <span className="rounded-lg bg-purple-100 px-2.5 py-1 font-mono font-black text-purple-900">+400 pts</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <strong className="text-slate-900">Indian Patent Office (IPO) Patent Filing</strong>
                  <div className="text-[11px] text-slate-500">Official CBR number verified</div>
                </div>
                <span className="rounded-lg bg-emerald-100 px-2.5 py-1 font-mono font-black text-emerald-900">+350 pts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Grant Proposal Modal Dialog */}
        {activeGrant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
                    <Microscope className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Submit Research Grant Proposal</h3>
                    <p className="text-[11px] text-slate-500">{activeGrant.title}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveGrant(null);
                    setProposalSubmitted(false);
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {proposalSubmitted ? (
                <div className="p-6 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="text-base font-black text-slate-900">Research Proposal Submitted!</h4>
                  <p className="text-xs text-slate-600">
                    The Research Council and {activeGrant.mentor} have received your proposal. A review decision will be issued within 5 working days.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setProposalSubmitted(true);
                  }}
                  className="space-y-4 text-xs font-medium text-slate-700"
                >
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Research Project Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Low-Precision Quantization for Multi-Modal LLMs"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-[#1755A7] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-900 mb-1">Assigned Faculty Mentor</label>
                      <input
                        type="text"
                        disabled
                        value={activeGrant.mentor}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-600 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-900 mb-1">Target Venue</label>
                      <select className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-[#1755A7] focus:outline-none bg-white">
                        <option value="IEEE_TRANS">IEEE Transactions (Q1)</option>
                        <option value="NEURIPS_CVPR">NeurIPS / CVPR Conference</option>
                        <option value="PATENT_IPO">Indian Patent Office (IPO)</option>
                        <option value="PATENT_USPTO">USPTO International Patent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Abstract & Methodology Summary (PDF or Link)</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Summarize the core hypothesis, datasets, model architecture, and GPU compute pipeline…"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-[#1755A7] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Detailed Proposal Document URL (Google Drive / Overleaf)</label>
                    <input
                      type="url"
                      required
                      placeholder="https://drive.google.com/..."
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-[#1755A7] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveGrant(null)}
                      className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#1755A7] px-4 py-2 font-bold text-white hover:bg-[#134486] transition-all shadow-xs"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Submit Proposal for Review
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
