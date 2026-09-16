"use client";

import { Suspense, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { ProofType } from "@ai-digital-passport/shared-types";
import { StudentShell } from "../../../components/shell/StudentShell";
import { Spinner } from "../../../components/ui/Spinner";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { activitiesApi, uploadsApi } from "../../../lib/api";
import { 
  FileCheck, 
  Sparkles, 
  Upload, 
  Code2, 
  GitBranch,
  BookOpen, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowLeft, 
  Send,
  HelpCircle,
  FileText,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

type SubmittableProofType = typeof ProofType.PDF_FILE | typeof ProofType.GITHUB_LINK | typeof ProofType.DOI_LINK;

const PROOF_TYPES: { value: SubmittableProofType; label: string; icon: typeof Upload; desc: string }[] = [
  { 
    value: ProofType.PDF_FILE, 
    label: "PDF Certificate / Report", 
    icon: Upload, 
    desc: "NVIDIA certificate, paper preprint, or event receipt (Max 10MB)" 
  },
  { 
    value: ProofType.GITHUB_LINK, 
    label: "GitHub Repository", 
    icon: GitBranch, 
    desc: "Open source repo with code, models, and comprehensive README" 
  },
  { 
    value: ProofType.DOI_LINK, 
    label: "Published DOI / Patent Link", 
    icon: BookOpen, 
    desc: "Permanent DOI from IEEE, ACM, Springer, or Patent Office" 
  },
];

export default function SubmitClaimPage() {
  return (
    <StudentShell>
      <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Spinner label="Loading submission portal…" /></div>}>
        <SubmitClaimForm />
      </Suspense>
    </StudentShell>
  );
}

function SubmitClaimForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activities = useQuery({ queryKey: ["activities"], queryFn: () => activitiesApi.discover() });

  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [proofType, setProofType] = useState<SubmittableProofType>(ProofType.GITHUB_LINK);
  const [proofUrl, setProofUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<unknown>(null);

  const selectedActivity = (activities.data ?? []).find((a) => a.category === category);

  const submit = useMutation({
    mutationFn: async () => {
      if (proofType === ProofType.PDF_FILE) {
        if (!file) throw new Error("Please select a valid PDF file to upload.");
        setUploadError(null);
        const uploaded = await uploadsApi.uploadPdf({
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          base64Data: await fileToBase64(file),
          entityType: "activity_claim",
        });
        return activitiesApi.createClaim({
          category,
          proofType,
          fileKey: uploaded.fileKey,
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        });
      }
      return activitiesApi.createClaim({ category, proofType, proofUrl });
    },
    onSuccess: () => router.push("/claims"),
    onError: (err) => setUploadError(err),
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 lg:p-8 shadow-xs">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-gradient-to-br from-[#1755A7]/10 to-[#F8C401]/15 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Link
              href="/claims"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1755A7] hover:underline mb-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to My Claims
            </Link>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900">Submit Evidence & Claim Points</h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              File authentic proof for courses, hackathons, research publications, or startup milestones. Your submission will be routed directly to your faculty mentor queue.
            </p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Column (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/90 bg-white p-6 lg:p-8 shadow-xs">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit.mutate();
            }}
            className="space-y-6"
          >
            {Boolean(submit.isError || uploadError) && (
              <ErrorBanner error={uploadError ?? submit.error} />
            )}

            {/* Category Select */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-900">
                1. Select Claim Category
              </label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-900 focus:border-[#1755A7] focus:outline-none transition-all"
              >
                <option value="" disabled>
                  Choose a verified activity category…
                </option>
                {(activities.data ?? []).map((a) => (
                  <option key={a.category} value={a.category}>
                    {a.label} (+{a.points} pts)
                  </option>
                ))}
              </select>
              {selectedActivity && (
                <div className="flex items-center gap-2 pt-1 text-xs text-emerald-700 font-bold">
                  <Sparkles className="h-3.5 w-3.5 text-[#F8C401]" />
                  <span>Eligible Bounty: +{selectedActivity.points} Competency Points</span>
                </div>
              )}
            </div>

            {/* Proof Type Segmented Cards */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-900">
                2. Select Proof Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PROOF_TYPES.map((pt) => {
                  const Icon = pt.icon;
                  const isSelected = proofType === pt.value;
                  return (
                    <button
                      key={pt.value}
                      type="button"
                      onClick={() => setProofType(pt.value)}
                      className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-[#1755A7] bg-[#1755A7]/5 shadow-2xs"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg mb-2 ${
                        isSelected ? "bg-[#1755A7] text-white" : "bg-slate-100 text-slate-600"
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-black text-slate-900">{pt.label}</span>
                      <span className="text-[10px] text-slate-500 mt-1 leading-snug">{pt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Proof Input */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-900">
                3. Provide Proof Artifact
              </label>

              {proofType === ProofType.PDF_FILE ? (
                <div className="relative rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center hover:bg-slate-50 transition-colors">
                  <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                  <div className="text-xs font-bold text-slate-700">
                    {file ? file.name : "Click to choose or drag & drop PDF certificate"}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · Ready to upload` : "PDF format only, maximum 10MB"}
                  </div>
                  <input
                    type="file"
                    accept="application/pdf"
                    required
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <input
                    type="url"
                    required
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder={
                      proofType === ProofType.GITHUB_LINK
                        ? "https://github.com/username/project-repo"
                        : "https://doi.org/10.1109/..."
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs font-medium text-slate-900 focus:border-[#1755A7] focus:outline-none transition-all"
                  />
                  <span className="block text-[11px] text-slate-400">
                    Ensure the URL is public and accessible to reviewers without login restrictions.
                  </span>
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Link
                href="/claims"
                className="text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submit.isPending || !category}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1755A7] px-6 py-3 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#134486] hover:shadow-md hover:shadow-[#1755A7]/20 disabled:opacity-50 active:scale-95"
              >
                <Send className="h-4 w-4" />
                {submit.isPending ? "Uploading & Submitting…" : "Submit Claim for Mentor Review"}
              </button>
            </div>
          </form>
        </div>

        {/* Verification Guidelines Column (1 Col) */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Mentor Verification SLA</h3>
                <p className="text-[11px] text-slate-500">Fast-track quality assurance</p>
              </div>
            </div>

            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">24-Hour Review Turnaround:</strong> Assigned faculty mentors review submissions daily during working hours.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">Instant Points Crediting:</strong> Upon mentor approval, points immediately recalculate your level and leaderboard rank.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">Constructive Feedback:</strong> If changes are required, mentors provide specific actionable feedback for resubmission.
                </div>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-200/70 bg-amber-50/50 p-5 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span>Academic Integrity Notice</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              All code and documents are cross-checked by automated plagiarism detection and DGX compute telemetry logs. Submitting fabricated evidence results in disciplinary review.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.includes(",") ? result.slice(result.indexOf(",") + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
