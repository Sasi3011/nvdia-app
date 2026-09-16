"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { adminProgramApi } from "../../../lib/api";
import { 
  Award, 
  Sparkles, 
  FileText, 
  ShieldCheck, 
  Plus, 
  CheckCircle2, 
  X, 
  Download, 
  Zap,
  TrendingUp,
  Layers,
  GraduationCap
} from "lucide-react";

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7] transition-colors";
const labelClass = "text-xs font-bold text-slate-700 flex items-center gap-1.5";

const SAMPLE_BADGE_RULES = [
  { badgeId: "nvidia_dli_certified", title: "NVIDIA DLI Certified Practitioner", trigger: "TOTAL_POINTS", threshold: 500, icon: "nvidia" },
  { badgeId: "dgx_supercomputer_operator", title: "DGX-A100 SuperPOD Operator", trigger: "TOTAL_POINTS", threshold: 1200, icon: "gpu" },
  { badgeId: "ai_grandmaster_elite", title: "Sri Eshwar AI Grandmaster", trigger: "TOTAL_POINTS", threshold: 2500, icon: "trophy" },
  { badgeId: "multimodal_hackathon_winner", title: "Grand Challenge Champion", trigger: "TOTAL_POINTS", threshold: 800, icon: "award" },
];

export default function AdminAwardsPage() {
  const [showCertModal, setShowCertModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [rules, setRules] = useState(SAMPLE_BADGE_RULES);
  const [applyUserTarget, setApplyUserTarget] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const applyBadges = useMutation({ 
    mutationFn: (userId: string) => adminProgramApi.applyBadges(userId),
    onSuccess: () => {
      setSuccessMsg(`Badge rules evaluated and applied successfully to scholar ID: ${applyUserTarget}`);
    }
  });

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader 
        title="AI Excellence Awards & Credential Engine" 
        description="Issue official Sri Eshwar NVIDIA digital certificates, configure automated badge unlock triggers, and trigger institutional credential audits." 
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowRuleModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-all active:scale-95"
            >
              <Zap className="h-4 w-4 text-[#F8C401]" />
              <span>New Unlock Rule</span>
            </button>
            <button
              onClick={() => setShowCertModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] via-[#1A5EB7] to-[#2563EB] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1D4ED8] transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Issue Certificate</span>
            </button>
          </div>
        }
      />

      {/* Modals */}
      {showCertModal && (
        <CertificateModal
          onClose={() => setShowCertModal(false)}
          onIssued={(title) => {
            setShowCertModal(false);
            setSuccessMsg(`Successfully generated official credential: "${title}"`);
          }}
        />
      )}

      {showRuleModal && (
        <BadgeRuleModal
          onClose={() => setShowRuleModal(false)}
          onCreated={(newRule) => {
            setRules((prev) => [newRule, ...prev]);
            setShowRuleModal(false);
            setSuccessMsg(`New automatic unlock trigger for "${newRule.title}" activated!`);
          }}
        />
      )}

      {/* Top 4 KPI Metrics */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Certificates Issued</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
              <FileText className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">1,842</span>
            <span className="text-xs font-semibold text-emerald-600">Verifiable</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Cryptographic Proof:</span>
            <span className="font-bold text-[#1755A7]">SHA-256 Enabled</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Unlock Triggers</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8C401]/20 text-slate-900">
              <Zap className="h-4.5 w-4.5 text-amber-700" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{rules.length}</span>
            <span className="text-xs font-semibold text-slate-500">Auto-Rules</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Trigger Criterion:</span>
            <span className="font-bold text-slate-800">Point Milestones</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Grandmaster Badges</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
              <Award className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-700">128</span>
            <span className="text-xs font-bold text-purple-600">Scholars</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Top 5% Cohort:</span>
            <span className="font-bold text-slate-800">2,500+ pts</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">NVIDIA DLI Accreditation</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">100%</span>
            <span className="text-xs font-bold text-emerald-600">Institutional</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Co-Branded Credential:</span>
            <span className="font-bold text-slate-800">Sri Eshwar & NVIDIA</span>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between text-xs font-bold text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Badge Auto-Unlock Rules Table */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#F8C401]" />
              Automated Competency Badge Rules ({rules.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Badges unlock automatically when student total competency points satisfy threshold bounds.</p>
          </div>

          {/* Quick Apply Rule to Student */}
          <div className="flex items-center gap-2">
            <input
              placeholder="Student User ID / Reg No"
              value={applyUserTarget}
              onChange={(e) => setApplyUserTarget(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#1755A7]"
            />
            <button
              onClick={() => applyUserTarget.trim() && applyBadges.mutate(applyUserTarget.trim())}
              disabled={!applyUserTarget.trim() || applyBadges.isPending}
              className="rounded-xl bg-[#1755A7] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#124282] transition-colors active:scale-95 disabled:opacity-50"
            >
              {applyBadges.isPending ? "Auditing…" : "Evaluate Badges"}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Badge Title & Credential Key</th>
                <th className="px-6 py-3.5">Trigger Parameter</th>
                <th className="px-6 py-3.5 text-center">Point Threshold</th>
                <th className="px-6 py-3.5 text-center">Rule State</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rules.map((r, i) => (
                <tr key={r.badgeId || i} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F8C401]/20 text-[#1755A7]">
                        <Award className="h-5 w-5 text-amber-700" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-[13px]">{r.title}</span>
                        <p className="font-mono text-[11px] text-slate-400 mt-0.5">{r.badgeId}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                      <Zap className="h-3 w-3 text-[#F8C401]" />
                      {r.trigger.replace(/_/g, " ")}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="font-black text-slate-900 text-sm">{r.threshold} pts</span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Active Live
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setRules((prev) => prev.filter((_, idx) => idx !== i))}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 hover:border-rose-200 transition-colors active:scale-95"
                    >
                      Remove Rule
                    </button>
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

function CertificateModal({ onClose, onIssued }: { onClose: () => void; onIssued: (title: string) => void }) {
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("NVIDIA AI Excellence Award in Deep Learning & Generative AI");
  const [certificateType, setCertificateType] = useState("AI Excellence Award");

  const certificate = useMutation({ 
    mutationFn: () => adminProgramApi.createCertificate({ userId, title, certificateType }),
    onSuccess: () => onIssued(title)
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-[#1755A7] via-[#1E40AF] to-[#2563EB] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#F8C401]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Issue Official Digital Certificate</h3>
              <p className="text-xs text-blue-100">Cryptographically signed Sri Eshwar & NVIDIA AI credential</p>
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

        <form
          className="p-6 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            certificate.mutate();
          }}
        >
          {certificate.isError && <ErrorBanner error={certificate.error} />}

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <span>Recipient Scholar User ID or Reg No <span className="text-red-500">*</span></span>
            </label>
            <input
              required
              placeholder="E.g. user_cm123abc or 71812104001"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <span>Certificate Title / Distinction <span className="text-red-500">*</span></span>
            </label>
            <input
              required
              placeholder="E.g. NVIDIA AI Supercomputing Grandmaster Fellow"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Certificate Category</label>
            <select
              value={certificateType}
              onChange={(e) => setCertificateType(e.target.value)}
              className={inputClass}
            >
              <option value="AI Excellence Award">AI Excellence Award</option>
              <option value="NVIDIA DLI Specialization">NVIDIA DLI Specialization</option>
              <option value="Research Fellowship Grant">Research Fellowship Grant</option>
              <option value="Hackathon Grand Champion">Hackathon Grand Champion</option>
            </select>
          </div>

          <div className="mt-2 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={certificate.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#2563EB] px-5 py-2 text-xs font-bold text-white shadow-2xs hover:from-[#124282] hover:to-[#1D4ED8] transition-all active:scale-95 disabled:opacity-50"
            >
              {certificate.isPending ? "Generating PDF…" : "Generate Official Certificate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BadgeRuleModal({ 
  onClose, 
  onCreated 
}: { 
  onClose: () => void; 
  onCreated: (rule: { badgeId: string; title: string; trigger: string; threshold: number; icon: string }) => void 
}) {
  const [badgeId, setBadgeId] = useState("");
  const [title, setTitle] = useState("");
  const [threshold, setThreshold] = useState(500);

  const badgeRule = useMutation({ 
    mutationFn: () => adminProgramApi.createBadgeRule({ badgeId, trigger: "TOTAL_POINTS", threshold }),
    onSuccess: () => {
      onCreated({
        badgeId,
        title: title || badgeId.replace(/_/g, " ").toUpperCase(),
        trigger: "TOTAL_POINTS",
        threshold,
        icon: "award"
      });
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-[#1755A7] via-[#1E40AF] to-[#2563EB] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#F8C401]">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Configure Badge Auto-Unlock Rule</h3>
              <p className="text-xs text-blue-100">Automatically award badges when students reach point milestones</p>
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

        <form
          className="p-6 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            badgeRule.mutate();
          }}
        >
          {badgeRule.isError && <ErrorBanner error={badgeRule.error} />}

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <span>Badge Identifier (Slug) <span className="text-red-500">*</span></span>
            </label>
            <input
              required
              placeholder="E.g. nvidia_h100_cluster_specialist"
              value={badgeId}
              onChange={(e) => setBadgeId(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <span>Display Title <span className="text-red-500">*</span></span>
            </label>
            <input
              required
              placeholder="E.g. NVIDIA H100 Cluster Specialist"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <span>Point Threshold Requirement <span className="text-red-500">*</span></span>
            </label>
            <input
              type="number"
              min={1}
              required
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className={inputClass}
            />
          </div>

          <div className="mt-2 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={badgeRule.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#2563EB] px-5 py-2 text-xs font-bold text-white shadow-2xs hover:from-[#124282] hover:to-[#1D4ED8] transition-all active:scale-95 disabled:opacity-50"
            >
              {badgeRule.isPending ? "Activating Rule…" : "Activate Unlock Rule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
