"use client";

import { useState } from "react";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { 
  Building, 
  Briefcase, 
  Users, 
  Award, 
  Plus, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  TrendingUp, 
  Sparkles,
  MapPin,
  X,
  Edit3,
  Trash2,
  Layers,
  GraduationCap
} from "lucide-react";

interface IndustryPartner {
  id: string;
  name: string;
  logo: string;
  tier: "Global Strategic" | "Tier 1 AI Partner" | "Innovation Lab Partner";
  focusTrack: string;
  location: string;
  activeProblems: number;
  internshipsOffered: number;
  avgPackage: string;
  status: "ACTIVE" | "HIRING_OPEN" | "REVIEW";
}

const INITIAL_PARTNERS: IndustryPartner[] = [
  {
    id: "p1",
    name: "NVIDIA Corporation",
    logo: "NV",
    tier: "Global Strategic",
    focusTrack: "LLMs, TensorRT, DGX Supercomputing & Omniverse",
    location: "Bengaluru & Santa Clara",
    activeProblems: 8,
    internshipsOffered: 24,
    avgPackage: "₹36.5 LPA",
    status: "HIRING_OPEN",
  },
  {
    id: "p2",
    name: "Siemens Healthineers AI",
    logo: "SH",
    tier: "Tier 1 AI Partner",
    focusTrack: "Medical Imaging & Multimodal Diagnostic AI",
    location: "Bengaluru Innovation Hub",
    activeProblems: 5,
    internshipsOffered: 16,
    avgPackage: "₹24.0 LPA",
    status: "HIRING_OPEN",
  },
  {
    id: "p3",
    name: "L&T Technology Services",
    logo: "LT",
    tier: "Tier 1 AI Partner",
    focusTrack: "Industrial Edge AI & Autonomous Robotics",
    location: "Chennai & Coimbatore",
    activeProblems: 6,
    internshipsOffered: 32,
    avgPackage: "₹18.5 LPA",
    status: "ACTIVE",
  },
  {
    id: "p4",
    name: "Zoho Corporation",
    logo: "ZH",
    tier: "Innovation Lab Partner",
    focusTrack: "Enterprise NLP & Distributed AI Systems",
    location: "Tenkasi & Chennai",
    activeProblems: 4,
    internshipsOffered: 20,
    avgPackage: "₹16.0 LPA",
    status: "ACTIVE",
  },
  {
    id: "p5",
    name: "Bosch Global Software",
    logo: "BG",
    tier: "Tier 1 AI Partner",
    focusTrack: "Mobility AI & Computer Vision ADAS",
    location: "Coimbatore Lab",
    activeProblems: 3,
    internshipsOffered: 14,
    avgPackage: "₹22.0 LPA",
    status: "REVIEW",
  },
];

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7] transition-colors";
const labelClass = "text-xs font-bold text-slate-700 flex items-center gap-1.5";

export default function AdminIndustryPage() {
  const [partners, setPartners] = useState<IndustryPartner[]>(INITIAL_PARTNERS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<IndustryPartner | null>(null);
  const [search, setSearch] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("ALL");

  const filteredPartners = partners.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.focusTrack.toLowerCase().includes(search.toLowerCase());
    const matchesTier = selectedTier === "ALL" || p.tier === selectedTier;
    return matchesSearch && matchesTier;
  });

  const totalInternships = partners.reduce((acc, p) => acc + p.internshipsOffered, 0);
  const totalProblems = partners.reduce((acc, p) => acc + p.activeProblems, 0);

  const handleDelete = (id: string) => {
    setPartners((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSave = (partner: IndustryPartner) => {
    if (editingPartner) {
      setPartners((prev) => prev.map((p) => (p.id === partner.id ? partner : p)));
      setEditingPartner(null);
    } else {
      setPartners((prev) => [partner, ...prev]);
      setShowAddModal(false);
    }
  };

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader
        title="Industry Connect & Corporate Placement Governance"
        description="Collaborate with tier-1 enterprise AI leaders, align grand challenge problem statements, and track scholar internships & high-value placement conversions."
        actions={
          <button
            onClick={() => {
              setEditingPartner(null);
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] via-[#1A5EB7] to-[#2563EB] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1D4ED8] transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Add Corporate Partner</span>
          </button>
        }
      />

      {/* Partner Modal Popup */}
      {(showAddModal || editingPartner) && (
        <PartnerModal
          partner={editingPartner}
          onClose={() => {
            setShowAddModal(false);
            setEditingPartner(null);
          }}
          onSave={handleSave}
        />
      )}

      {/* Top 4 KPI Metrics */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Corporate AI Partners</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
              <Building className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{partners.length}</span>
            <span className="text-xs font-semibold text-emerald-600">Enterprises</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Strategic Partner:</span>
            <span className="font-bold text-[#1755A7]">NVIDIA AI</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Live Industry Capstones</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8C401]/20 text-slate-900">
              <Briefcase className="h-4.5 w-4.5 text-amber-700" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalProblems}</span>
            <span className="text-xs font-semibold text-slate-500">Challenges</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Student Cohorts Active:</span>
            <span className="font-bold text-slate-800">420 Teams</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Internship Offers</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{totalInternships}</span>
            <span className="text-xs font-bold text-emerald-600">Scholars</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Conversion Rate:</span>
            <span className="font-bold text-slate-800">92.4% PPO</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Apex Package CTC</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
              <Award className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#1755A7]">₹36.5 LPA</span>
            <span className="text-xs font-bold text-slate-500">NVIDIA AI</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Median Package:</span>
            <span className="font-bold text-slate-800">₹19.2 LPA</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search enterprise partners or tech focus..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7]"
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
          <Building className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
          >
            <option value="ALL">All Partnership Tiers</option>
            <option value="Global Strategic">Global Strategic</option>
            <option value="Tier 1 AI Partner">Tier 1 AI Partner</option>
            <option value="Innovation Lab Partner">Innovation Lab Partner</option>
          </select>
        </div>
      </div>

      {/* Partners Table */}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3.5">Company & Track Focus</th>
              <th className="px-6 py-3.5">Partnership Tier</th>
              <th className="px-6 py-3.5 text-center">Active Problems</th>
              <th className="px-6 py-3.5 text-center">Internships / CTC</th>
              <th className="px-6 py-3.5 text-center">Recruitment Status</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPartners.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7] font-black text-sm">
                      {p.logo}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-[13px]">{p.name}</span>
                      <p className="text-xs text-slate-500 mt-0.5 max-w-sm">{p.focusTrack}</p>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3 text-slate-400" /> {p.location}
                      </span>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    p.tier === "Global Strategic"
                      ? "bg-amber-50 border border-amber-200 text-amber-800"
                      : p.tier === "Tier 1 AI Partner"
                      ? "bg-blue-50 border border-blue-200 text-[#1755A7]"
                      : "bg-slate-100 text-slate-700"
                  }`}>
                    {p.tier === "Global Strategic" && <Sparkles className="h-3 w-3 text-[#F8C401]" />}
                    {p.tier}
                  </span>
                </td>

                <td className="px-6 py-4 text-center">
                  <span className="font-bold text-slate-900 text-xs bg-slate-100 px-2.5 py-1 rounded-lg">
                    {p.activeProblems} Statements
                  </span>
                </td>

                <td className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-emerald-700 text-xs">{p.internshipsOffered} Offers</span>
                    <span className="font-mono text-[11px] text-slate-500">{p.avgPackage}</span>
                  </div>
                </td>

                <td className="px-6 py-4 text-center">
                  {p.status === "HIRING_OPEN" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Hiring Open
                    </span>
                  ) : p.status === "ACTIVE" ? (
                    <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-[11px] font-bold text-[#1755A7]">
                      Active Partner
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                      In Review
                    </span>
                  )}
                </td>

                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => setEditingPartner(p)}
                      className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-[#1755A7] transition-all active:scale-95"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
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
    </ConsoleShell>
  );
}

function PartnerModal({
  partner,
  onClose,
  onSave,
}: {
  partner: IndustryPartner | null;
  onClose: () => void;
  onSave: (p: IndustryPartner) => void;
}) {
  const [name, setName] = useState(partner?.name ?? "");
  const [tier, setTier] = useState<IndustryPartner["tier"]>(partner?.tier ?? "Tier 1 AI Partner");
  const [focusTrack, setFocusTrack] = useState(partner?.focusTrack ?? "");
  const [location, setLocation] = useState(partner?.location ?? "Bengaluru Innovation Hub");
  const [activeProblems, setActiveProblems] = useState(partner?.activeProblems ?? 4);
  const [internshipsOffered, setInternshipsOffered] = useState(partner?.internshipsOffered ?? 12);
  const [avgPackage, setAvgPackage] = useState(partner?.avgPackage ?? "₹18.0 LPA");
  const [status, setStatus] = useState<IndustryPartner["status"]>(partner?.status ?? "HIRING_OPEN");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const initials = name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    onSave({
      id: partner?.id ?? `partner_${Date.now()}`,
      name,
      logo: initials || "AI",
      tier,
      focusTrack,
      location,
      activeProblems: Number(activeProblems),
      internshipsOffered: Number(internshipsOffered),
      avgPackage,
      status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-[#1755A7] via-[#1E40AF] to-[#2563EB] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#F8C401]">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">{partner ? "Edit Corporate Partner" : "Add Enterprise AI Partner"}</h3>
              <p className="text-xs text-blue-100">Set collaboration track, problems assigned, and placement criteria</p>
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
              <span>Company / Corporate Name <span className="text-red-500">*</span></span>
            </label>
            <input required placeholder="E.g. NVIDIA Corporation" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Partnership Tier</label>
            <select value={tier} onChange={(e) => setTier(e.target.value as IndustryPartner["tier"])} className={inputClass}>
              <option value="Global Strategic">Global Strategic</option>
              <option value="Tier 1 AI Partner">Tier 1 AI Partner</option>
              <option value="Innovation Lab Partner">Innovation Lab Partner</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Recruitment / Hiring Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as IndustryPartner["status"])} className={inputClass}>
              <option value="HIRING_OPEN">Hiring Open</option>
              <option value="ACTIVE">Active Partner</option>
              <option value="REVIEW">Under Review</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className={labelClass}>
              <span>AI Technology Focus & Grand Challenge Track <span className="text-red-500">*</span></span>
            </label>
            <input required placeholder="E.g. TensorRT LLMs, Omniverse Digital Twins, Edge Autonomous Systems" value={focusTrack} onChange={(e) => setFocusTrack(e.target.value)} className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Location Hub</label>
            <input placeholder="E.g. Bengaluru / Coimbatore" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Average Package CTC</label>
            <input placeholder="E.g. ₹24.0 LPA" value={avgPackage} onChange={(e) => setAvgPackage(e.target.value)} className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Active Problem Statements</label>
            <input type="number" min={0} value={activeProblems} onChange={(e) => setActiveProblems(Number(e.target.value))} className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Internships Offered</label>
            <input type="number" min={0} value={internshipsOffered} onChange={(e) => setInternshipsOffered(Number(e.target.value))} className={inputClass} />
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
              {partner ? "Save Partner Changes" : "Create Partner Link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
