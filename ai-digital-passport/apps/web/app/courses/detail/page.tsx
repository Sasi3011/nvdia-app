"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { StudentShell } from "../../../components/shell/StudentShell";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Spinner } from "../../../components/ui/Spinner";
import { coursesApi } from "../../../lib/api";

import { 
  ArrowLeft, 
  Briefcase, 
  Award, 
  BookOpen, 
  Clock, 
  ShieldCheck, 
  FileCheck,
  CheckCircle2,
  ExternalLink,
  AlertCircle
} from "lucide-react";
import { safeUrl } from "../../../lib/safe-url";

// Course Detail (student) — course info, external link and proof submission.
export default function CourseDetailPage() {
  return (
    <StudentShell>
      <Suspense fallback={<div className="flex h-64 items-center justify-center"><Spinner label="Loading course..." /></div>}>
        <CourseDetailContent />
      </Suspense>
    </StudentShell>
  );
}

function CourseDetailContent() {
  const id = useSearchParams().get("id");
  const queryClient = useQueryClient();
  const course = useQuery({ queryKey: ["courses", "detail", id], queryFn: () => coursesApi.detail(id!), enabled: !!id });

  const [proofUrl, setProofUrl] = useState("");
  const [submitError, setSubmitError] = useState<unknown>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["courses", "detail", id] });

  const submitProof = useMutation({
    mutationFn: async () => coursesApi.submitProof(id!, { proofUrl }),
    onSuccess: () => {
      setSubmitError(null);
      refresh();
    },
    onError: setSubmitError,
  });

  if (!id) return <ErrorBanner error="No course id given." />;
  if (course.isLoading) return <div className="flex h-64 items-center justify-center"><Spinner label="Loading course…" /></div>;
  if (course.isError) return <ErrorBanner error={course.error} />;
  if (!course.data) return null;

  const c = course.data;
  const canSubmit = c.enrollment.status === "NOT_STARTED" || c.enrollment.status === "IN_PROGRESS" || c.enrollment.status === "REJECTED";

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 lg:p-8 shadow-xs">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-gradient-to-br from-[#1755A7]/10 to-[#F8C401]/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1755A7] hover:underline mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Curriculum Catalog
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#1755A7]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#1755A7]">
                  <Briefcase className="h-3 w-3" />
                  {c.provider}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                  {c.difficulty}
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{c.title}</h1>
              <p className="text-sm text-slate-500 mt-1 max-w-2xl">{c.category}</p>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F8C401]/15 px-4 py-2 font-mono text-sm font-black text-amber-900 border border-[#F8C401]/30 self-start sm:self-center shadow-sm">
              <Award className="h-4 w-4 text-[#F8C401]" />
              +{c.pointsValue} Points
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[#1755A7]" />
          Curriculum Metadata & Pathway Rules
        </h3>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <InfoCard label="Duration" value={`${c.durationHours}h${c.durationWeeks ? ` / ${c.durationWeeks} weeks` : ""}`} />
          <InfoCard label="Delivery Mode" value={c.deliveryMode} />
          <InfoCard label="Enrollment Type" value={c.enrollmentType} />
          <InfoCard label="Certificate" value={c.certificateAvailable ? "Available" : "Not included"} />
        </div>

        {c.description && (
          <div className="mt-4 rounded-xl border border-slate-200/80 bg-white p-4 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
            {c.description}
          </div>
        )}
        
        {c.externalUrl && (
          <a
            href={safeUrl(c.externalUrl)}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#1755A7] hover:underline bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 w-fit"
          >
            <ExternalLink className="h-4 w-4" /> Open course on {c.provider}
          </a>
        )}

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <ListBlock title="What you will learn" items={c.learningOutcomes} />
          <ListBlock title="Skills and tools" items={[...c.skillsCovered, ...(c.toolsRequired || [])]} />
          <ListBlock title="Prerequisites" items={c.prerequisites} />
          
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 flex flex-col h-full justify-center">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Target Students</h4>
            <p className="mt-2 text-xs font-bold text-slate-700">{c.targetAudience || "Students who qualify for this AI Passport level."}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-[#1755A7]" />
              {c.levelRequirement ? `Recommended: AI Level ${c.levelRequirement} or above. Open to all students.` : "Open to all students."}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1755A7]" />
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
          <FileCheck className="h-4.5 w-4.5 text-[#1755A7]" />
          Submit Evidence Proof
        </h2>

        {c.enrollment.status === "SUBMITTED" ? (
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-[#1755A7]" />
            <p className="text-xs font-bold text-[#1755A7]">Your proof is submitted and awaiting faculty review.</p>
          </div>
        ) : c.enrollment.status === "APPROVED" ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <p className="text-xs font-bold text-emerald-700">Approved — Points have been successfully awarded to your wallet.</p>
          </div>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              submitProof.mutate();
            }}
          >
            {c.enrollment.status === "REJECTED" || c.enrollment.reviewFeedback ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 mb-2">
                <h3 className="text-[11px] font-black uppercase tracking-wider text-red-600 mb-1 flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5"/> Revision Requested</h3>
                <p className="text-xs font-bold text-red-900">{c.enrollment.reviewFeedback}</p>
              </div>
            ) : null}
            {submitError ? <ErrorBanner error={submitError} /> : null}
            
            <label className="flex flex-col gap-2 p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-2"><ExternalLink className="h-4 w-4 text-slate-400"/> Public Verification Link</span>
              <input
                type="url"
                required
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder="https://coursera.org/verify/... or https://drive.google.com/..."
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7]"
              />
              <span className="text-[11px] text-slate-400">Any public link — course provider verification, Google Drive, or a direct link to your certificate.</span>
            </label>

            <button type="submit" disabled={!canSubmit || submitProof.isPending || !proofUrl.trim()} className="self-end mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1755A7] px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#124282] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {submitProof.isPending ? "Submitting securely…" : "Submit for Faculty Review"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function InfoCard({ label, value, isHighlight }: { label: string; value: string; isHighlight?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`mt-1 text-xs font-bold ${isHighlight ? "text-emerald-700" : "text-slate-900"}`}>{value}</div>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</h4>
      <p className="mt-2 text-xs text-slate-400 font-medium">None added by admin yet.</p>
    </div>
  );
  
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</h4>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
