"use client";

import { Suspense, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { ConsoleShell } from "../../../../components/console/ConsoleShell";
import { Spinner } from "../../../../components/ui/Spinner";
import { ErrorBanner } from "../../../../components/ui/ErrorBanner";
import { API_BASE_URL, mentorCoursesApi } from "../../../../lib/api";
import { 
  FileCheck, 
  Sparkles, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Download, 
  ExternalLink, 
  User, 
  Building2, 
  BookOpen, 
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

export default function MentorCourseReviewPage() {
  return (
    <ConsoleShell role="MENTOR">
      <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Spinner label="Loading submission review…" /></div>}>
        <Content />
      </Suspense>
    </ConsoleShell>
  );
}

function Content() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = useSearchParams().get("id");
  const [feedback, setFeedback] = useState("");
  const [actionError, setActionError] = useState<unknown>(null);

  const queue = useQuery({ queryKey: ["mentor", "courses", "queue"], queryFn: mentorCoursesApi.queue });
  const item = queue.data?.find((e) => e.enrollmentId === id);

  const loadDownload = useMutation({
    mutationFn: () => mentorCoursesApi.proofDownloadUrl(id!),
    onSuccess: (res) => window.open(res.downloadUrl.startsWith("/") ? `${API_BASE_URL}${res.downloadUrl}` : res.downloadUrl, "_blank", "noopener,noreferrer"),
    onError: setActionError,
  });

  const approve = useMutation({
    mutationFn: () => mentorCoursesApi.approve(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentor", "courses", "queue"] });
      router.push("/mentor/courses");
    },
    onError: setActionError,
  });

  const reject = useMutation({
    mutationFn: () => mentorCoursesApi.reject(id!, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentor", "courses", "queue"] });
      router.push("/mentor/courses");
    },
    onError: setActionError,
  });

  if (!id) return <ErrorBanner error="No enrollment ID provided." />;
  if (queue.isLoading) return <Spinner label="Loading submission…" />;
  if (queue.isError) return <ErrorBanner error={queue.error} />;
  if (!item) {
    return (
      <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center shadow-xs space-y-3">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <h3 className="text-base font-black text-slate-900">Submission Resolved</h3>
        <p className="text-xs text-slate-500">This submission is no longer pending in the review queue.</p>
        <div className="pt-2">
          <Link
            href="/mentor/courses"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1755A7] px-4 py-2 text-xs font-bold text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Return to Queue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 lg:p-8 shadow-xs">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-gradient-to-br from-[#1755A7]/10 to-[#F8C401]/15 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <Link
            href="/mentor/courses"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1755A7] hover:underline mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Course Queue
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900">{item.student.fullName}</h1>
              <p className="text-xs text-slate-500 font-medium">
                {item.student.department} · Course: <span className="text-slate-800 font-bold">{item.courseTitle}</span>
              </p>
            </div>

            <span className="inline-flex items-center gap-1 rounded-full bg-[#F8C401]/15 px-3 py-1 font-mono text-xs font-black text-amber-900 border border-[#F8C401]/30 self-start">
              <Sparkles className="h-3.5 w-3.5 text-[#F8C401]" />
              +{item.pointsValue} Points Bounty
            </span>
          </div>
        </div>
      </div>

      {actionError ? <ErrorBanner error={actionError} /> : null}

      {/* 2-Column Proof & Decision Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Proof Deliverables */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
              <FileCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Submitted Proof Artifacts</h2>
              <p className="text-[11px] text-slate-500">Student certification files and links</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {item.submittedProofUrl ? (
              <div className="space-y-1.5 rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                <span className="font-bold text-slate-700 block">External Certificate / Verification Link:</span>
                <a
                  href={item.submittedProofUrl.startsWith("http") ? item.submittedProofUrl : `https://${item.submittedProofUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#1755A7] font-mono break-all hover:underline flex items-center gap-1 font-bold"
                >
                  {item.submittedProofUrl} <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
              </div>
            ) : null}

            <div className="space-y-2">
              <span className="font-bold text-slate-700 block">Attached Proof File (PDF / Image):</span>
              <button
                type="button"
                disabled={loadDownload.isPending}
                onClick={() => loadDownload.mutate()}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {loadDownload.isPending ? "Generating Secure URL…" : "Download / Inspect Certificate"}
              </button>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 text-slate-500 space-y-1">
              <strong className="text-slate-800">Verification Checklist:</strong>
              <p>• Check that the student&apos;s name matches the certificate recipient.</p>
              <p>• Verify certificate issue date and official NVIDIA DLI hash.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Decision & Feedback Form */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Faculty Mentor Decision</h2>
              <p className="text-[11px] text-slate-500">Approve points or provide revision feedback</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-900 mb-1">
                Feedback Remarks (Required if rejecting)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                placeholder="Provide clear instructions if certificate is illegible, mismatched, or incomplete…"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#1755A7] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={approve.isPending || reject.isPending}
                onClick={() => approve.mutate()}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-all disabled:opacity-50 active:scale-95"
              >
                <CheckCircle2 className="h-4 w-4" />
                {approve.isPending ? "Approving…" : `Approve (+${item.pointsValue} pts)`}
              </button>

              <button
                type="button"
                disabled={!feedback.trim() || approve.isPending || reject.isPending}
                onClick={() => reject.mutate()}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition-all disabled:opacity-40 active:scale-95"
              >
                <XCircle className="h-4 w-4" />
                {reject.isPending ? "Rejecting…" : "Request Changes"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
