"use client";

import { useState } from "react";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { 
  Microscope, 
  Award, 
  FileText, 
  Cpu, 
  TrendingUp, 
  Plus, 
  Users, 
  Building, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  PieChart,
  Layers,
  X,
  Edit3,
  Trash2,
  Search
} from "lucide-react";

interface ResearchFellow {
  id: string;
  scholar: string;
  dept: string;
  guide: string;
  title: string;
  domain: string;
  gpuAllocated: number;
  gpuUsed: number;
  grant: string;
  output: string;
  status: "ONGOING" | "COMPLETED" | "REVIEW";
  progress: number;
}

const INITIAL_FELLOWS: ResearchFellow[] = [
  {
    id: "RF-2026-01",
    scholar: "Aadhithya V.",
    dept: "AI & Data Science",
    guide: "Dr. R. Kumar (Principal Scientist)",
    title: "Low-Latency Diffusion Architecture for Surgical Edge Vision",
    domain: "Healthcare AI & Diagnostics",
    gpuAllocated: 600,
    gpuUsed: 480,
    grant: "₹4.50 Lakhs",
    output: "Patent Filed (SECE-AI-PAT-88)",
    status: "ONGOING",
    progress: 80,
  },
  {
    id: "RF-2026-02",
    scholar: "Sneha Ramachandran",
    dept: "Computer Science & Eng",
    guide: "Prof. Anitha M.",
    title: "Multimodal Foundation Model Fine-Tuning with TensorRT-LLM",
    domain: "Multimodal Foundation Models",
    gpuAllocated: 800,
    gpuUsed: 710,
    grant: "₹5.20 Lakhs",
    output: "NeurIPS 2026 Paper Accepted",
    status: "COMPLETED",
    progress: 100,
  },
  {
    id: "RF-2026-03",
    scholar: "Vikram Sundaram",
    dept: "AI & Machine Learning",
    guide: "Dr. S. Karthikeyan",
    title: "Autonomous Fleet Path Planning using NVIDIA Isaac Sim & Omniverse",
    domain: "Autonomous Systems & Robotics",
    gpuAllocated: 500,
    gpuUsed: 320,
    grant: "₹3.80 Lakhs",
    output: "IEEE Robotics Letter (Under Review)",
    status: "ONGOING",
    progress: 65,
  },
  {
    id: "RF-2026-04",
    scholar: "Pooja Dharshini",
    dept: "Information Technology",
    guide: "Dr. B. Meenakshi",
    title: "Quantum-Classical Hybrid Optimization for Supercomputing Schedulers",
    domain: "Multimodal Foundation Models",
    gpuAllocated: 400,
    gpuUsed: 190,
    grant: "₹3.50 Lakhs",
    output: "Patent Pending (SECE-AI-PAT-92)",
    status: "ONGOING",
    progress: 48,
  },
  {
    id: "RF-2026-05",
    scholar: "Rahul Nambiar",
    dept: "Electronics & Comm",
    guide: "Dr. V. Rajesh",
    title: "Sub-10mW TinyML Neural Accelerator for Edge Anomaly Detection",
    domain: "Edge TinyML & Hardware",
    gpuAllocated: 500,
    gpuUsed: 440,
    grant: "₹4.00 Lakhs",
    output: "ISCA 2026 Submission",
    status: "ONGOING",
    progress: 88,
  },
];

const RESEARCH_DOMAINS = [
  { name: "Healthcare AI & Diagnostics", share: 34, grant: "₹17.8L", color: "from-[#1755A7] to-[#2563EB]" },
  { name: "Multimodal Foundation Models", share: 28, grant: "₹14.6L", color: "from-[#1D4ED8] to-[#3B82F6]" },
  { name: "Autonomous Systems & Robotics", share: 22, grant: "₹11.5L", color: "from-[#F8C401] to-[#EAB308]" },
  { name: "Edge TinyML & Hardware", share: 16, grant: "₹8.5L", color: "from-[#F59E0B] to-[#F8C401]" },
];

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7] transition-colors";
const labelClass = "text-xs font-bold text-slate-700 flex items-center gap-1.5";

export default function AdminResearchPage() {
  const [fellows, setFellows] = useState<ResearchFellow[]>(INITIAL_FELLOWS);
  const [showModal, setShowModal] = useState(false);
  const [editingFellow, setEditingFellow] = useState<ResearchFellow | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const filteredFellows = fellows.filter((f) => {
    const matchesDomain = selectedDomain === "ALL" || f.domain.toLowerCase().includes(selectedDomain.toLowerCase());
    const matchesSearch = f.scholar.toLowerCase().includes(search.toLowerCase()) || f.title.toLowerCase().includes(search.toLowerCase());
    return matchesDomain && matchesSearch;
  });

  const handleSave = (fellow: ResearchFellow) => {
    if (editingFellow) {
      setFellows((prev) => prev.map((f) => (f.id === fellow.id ? fellow : f)));
      setEditingFellow(null);
    } else {
      setFellows((prev) => [fellow, ...prev]);
      setShowModal(false);
    }
  };

  const handleDelete = (id: string) => {
    setFellows((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader
        title="Research Fellowships & Supercomputing Labs"
        description="Manage high-impact research fellowship cycles, grant allocations, mentor mentorship, DGX supercomputing clusters, and patent / IEEE publications."
        actions={
          <button
            onClick={() => {
              setEditingFellow(null);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] via-[#1A5EB7] to-[#2563EB] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1D4ED8] transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Open Fellowship Cycle</span>
          </button>
        }
      />

      {/* Fellowship Modal Popup */}
      {(showModal || editingFellow) && (
        <FellowshipModal
          fellow={editingFellow}
          onClose={() => {
            setShowModal(false);
            setEditingFellow(null);
          }}
          onSave={handleSave}
        />
      )}

      {/* Top 4 Research Metric Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Fellowship Grants</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
              <Award className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#1755A7]">₹52.4L</span>
            <span className="text-xs font-bold text-emerald-600 inline-flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> Allocated
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Cycle Budget:</span>
            <span className="font-bold text-slate-800">₹75.0 Lakhs Total</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Fellows</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8C401]/20 text-slate-900">
              <Users className="h-4.5 w-4.5 text-amber-700" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{fellows.length} Scholars</span>
            <span className="text-xs font-semibold text-slate-500">Full Fellowship</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Level 6 Distinction:</span>
            <span className="font-bold text-[#1755A7]">Direct Fast-Track</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Patents & Publications</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
              <FileText className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">6 Patents</span>
            <span className="text-xs font-bold text-emerald-600">+ 8 Q1 Papers</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>IEEE / NeurIPS / Nature:</span>
            <span className="font-bold text-slate-800">Peer Reviewed</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Dedicated GPU Compute</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8C401]/20 text-slate-900">
              <Cpu className="h-4.5 w-4.5 text-amber-700" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">2,800 hrs</span>
            <span className="text-xs font-bold text-[#1755A7]">DGX A100</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Utilization Rate:</span>
            <span className="font-bold text-emerald-600">82.4% Active</span>
          </div>
        </div>
      </div>

      {/* Grant Breakdown Chart & Domain Allocation */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PieChart className="h-4.5 w-4.5 text-[#1755A7]" />
              Grant & Compute Allocation by AI Research Domain
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribution of institutional supercomputing grants and lab infrastructure
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#1755A7] bg-[#1755A7]/10 px-2.5 py-1 rounded-lg">
            4 Core AI Labs
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {RESEARCH_DOMAINS.map((domain, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/70">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">{domain.name}</span>
                <span className="text-xs font-mono font-black text-[#1755A7]">{domain.share}%</span>
              </div>
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${domain.color}`} 
                  style={{ width: `${domain.share}%` }} 
                />
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Lab Grant Share:</span>
                <span className="font-mono font-bold text-slate-900">{domain.grant}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Research Scholars & Projects Table */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Microscope className="h-4.5 w-4.5 text-[#1755A7]" />
              Active Research Scholars & Projects Roster ({fellows.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live fellowship milestones, guide oversight, GPU utilization, and patent deliverables
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search scholars..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#1755A7]"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {["ALL", "Healthcare", "Foundation", "Robotics"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedDomain(tab)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    selectedDomain === tab
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab === "ALL" ? "All Labs" : tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Research Scholar & Topic</th>
                <th className="px-5 py-3.5">Domain & Faculty Guide</th>
                <th className="px-5 py-3.5 text-center">DGX GPU Quota</th>
                <th className="px-5 py-3.5">Target Output / Patent</th>
                <th className="px-5 py-3.5 text-right">Grant</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFellows.map((fellow) => (
                <tr key={fellow.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
                        <Microscope className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-[13px]">{fellow.scholar}</span>
                        <span className="text-[11px] text-slate-400 font-mono ml-2">({fellow.dept})</span>
                        <p className="mt-0.5 text-xs font-medium text-slate-700 max-w-md">{fellow.title}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-[#1755A7]">{fellow.domain}</span>
                      <span className="text-[11px] text-slate-500">{fellow.guide}</span>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="font-mono font-bold text-slate-900">{fellow.gpuUsed} / {fellow.gpuAllocated} hrs</span>
                      <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
                        <div 
                          className="h-full rounded-full bg-[#1755A7]" 
                          style={{ width: `${(fellow.gpuUsed / fellow.gpuAllocated) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-[11px]">
                      <Sparkles className="h-3 w-3 text-emerald-600" />
                      {fellow.output}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <span className="font-mono font-black text-slate-900 text-xs">{fellow.grant}</span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setEditingFellow(fellow)}
                        className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-[#1755A7] transition-all active:scale-95"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(fellow.id)}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-all active:scale-95"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ConsoleShell>
  );
}

function FellowshipModal({
  fellow,
  onClose,
  onSave,
}: {
  fellow: ResearchFellow | null;
  onClose: () => void;
  onSave: (f: ResearchFellow) => void;
}) {
  const [scholar, setScholar] = useState(fellow?.scholar ?? "");
  const [dept, setDept] = useState(fellow?.dept ?? "AI & Data Science");
  const [guide, setGuide] = useState(fellow?.guide ?? "Dr. R. Kumar (Principal Scientist)");
  const [title, setTitle] = useState(fellow?.title ?? "");
  const [domain, setDomain] = useState(fellow?.domain ?? "Healthcare AI & Diagnostics");
  const [gpuAllocated, setGpuAllocated] = useState(fellow?.gpuAllocated ?? 500);
  const [grant, setGrant] = useState(fellow?.grant ?? "₹4.00 Lakhs");
  const [output, setOutput] = useState(fellow?.output ?? "Patent / IEEE Q1 Paper Target");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: fellow?.id ?? `RF-${Date.now()}`,
      scholar,
      dept,
      guide,
      title,
      domain,
      gpuAllocated: Number(gpuAllocated),
      gpuUsed: fellow?.gpuUsed ?? 0,
      grant,
      output,
      status: fellow?.status ?? "ONGOING",
      progress: fellow?.progress ?? 10,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-[#1755A7] via-[#1E40AF] to-[#2563EB] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#F8C401]">
              <Microscope className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">{fellow ? "Edit Research Fellowship" : "Launch AI Research Fellowship Cycle"}</h3>
              <p className="text-xs text-blue-100">Allocate lab grants, DGX GPU quotas, and guide supervision</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="p-6 grid grid-cols-1 gap-4 sm:grid-cols-2 max-h-[75vh] overflow-y-auto minute-scrollbar" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className={labelClass}>
              <span>Research Scholar Name <span className="text-red-500">*</span></span>
            </label>
            <input required placeholder="E.g. Aadhithya V." value={scholar} onChange={(e) => setScholar(e.target.value)} className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Department</label>
            <input placeholder="E.g. AI & Data Science" value={dept} onChange={(e) => setDept(e.target.value)} className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Faculty Research Guide</label>
            <input placeholder="E.g. Dr. R. Kumar" value={guide} onChange={(e) => setGuide(e.target.value)} className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className={labelClass}>
              <span>Research Project Topic / Abstract <span className="text-red-500">*</span></span>
            </label>
            <textarea required rows={3} placeholder="E.g. Low-Latency Diffusion Architecture for Surgical Edge Vision" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Research Domain Track</label>
            <select value={domain} onChange={(e) => setDomain(e.target.value)} className={inputClass}>
              <option value="Healthcare AI & Diagnostics">Healthcare AI & Diagnostics</option>
              <option value="Multimodal Foundation Models">Multimodal Foundation Models</option>
              <option value="Autonomous Systems & Robotics">Autonomous Systems & Robotics</option>
              <option value="Edge TinyML & Hardware">Edge TinyML & Hardware</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Dedicated GPU Quota (Hours)</label>
            <input type="number" min={50} value={gpuAllocated} onChange={(e) => setGpuAllocated(Number(e.target.value))} className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Grant Allocation (₹)</label>
            <input placeholder="E.g. ₹4.50 Lakhs" value={grant} onChange={(e) => setGrant(e.target.value)} className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Expected Deliverable Output</label>
            <input placeholder="E.g. Patent / IEEE Paper" value={output} onChange={(e) => setOutput(e.target.value)} className={inputClass} />
          </div>

          <div className="mt-2 flex items-center justify-end gap-3 sm:col-span-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#2563EB] px-5 py-2 text-xs font-bold text-white shadow-2xs hover:from-[#124282] hover:to-[#1D4ED8] transition-all active:scale-95"
            >
              {fellow ? "Save Fellowship Changes" : "Create Fellowship Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
