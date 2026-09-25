"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, X } from "lucide-react";
import { adminCoursesApi } from "../../lib/api";
import { ErrorBanner } from "../ui/ErrorBanner";
import { Spinner } from "../ui/Spinner";
import { safeUrl } from "../../lib/safe-url";

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-1 text-xs font-bold text-slate-900">{value}</div>
    </div>
  );
}

export function CourseDetailModal({ courseId, onClose }: { courseId: string; onClose: () => void }) {
  const course = useQuery({
    queryKey: ["admin", "courses", courseId],
    queryFn: () => adminCoursesApi.get(courseId),
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const c = course.data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div
        className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-[#1755A7] via-[#1E40AF] to-[#2563EB] px-6 py-4 text-white">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#F8C401]">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold">{c?.title ?? "Course details"}</h3>
              {c && <p className="truncate text-xs text-blue-100">{c.provider}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-6">
          {course.isLoading ? (
            <div className="flex h-40 items-center justify-center"><Spinner label="Loading course details..." /></div>
          ) : course.isError ? (
            <ErrorBanner error={course.error} />
          ) : c ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Info label="Accredited Provider" value={c.provider} />
                <Info label="Duration (Hours)" value={`${c.durationHours}h`} />
                <Info label="Duration (Weeks)" value={c.durationWeeks ? `${c.durationWeeks} weeks` : "-"} />
                <Info label="Certificate Required" value={c.certificateAvailable ? "Yes" : "No"} />
              </div>

              {c.shortDescription && (
                <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3.5 text-xs text-slate-700"><div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Catalog Summary</div>{c.shortDescription}</div>
              )}

              {c.description && (
                <div className="rounded-xl border border-slate-200/80 bg-white p-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Full Syllabus &amp; Learning Objective</h4>
                  <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-700">{c.description}</p>
                </div>
              )}

              {c.externalUrl && (
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">External Course / Enrollment URL</div>
                  <a
                    href={safeUrl(c.externalUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block break-all text-xs font-bold text-[#1755A7] hover:underline"
                  >
                    {c.externalUrl}
                  </a>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
