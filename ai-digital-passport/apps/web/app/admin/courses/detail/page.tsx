"use client";

import { Suspense, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ConsoleShell } from "../../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../../components/console/ConsolePageHeader";
import { ErrorBanner } from "../../../../components/ui/ErrorBanner";
import { Spinner } from "../../../../components/ui/Spinner";
import { CourseForm } from "../../../../components/admin/CourseForm";
import { adminCoursesApi } from "../../../../lib/api";
import { 
  BookOpen, 
  ArrowLeft, 
  Edit3, 
  Archive, 
  CheckCircle, 
  Plus, 
  Layers, 
  Award, 
  ShieldCheck, 
  Clock, 
  ExternalLink,
  Sparkles
} from "lucide-react";

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7] transition-colors";

export default function AdminCourseDetailPage() {
  return (
    <ConsoleShell role="ADMIN">
      <Suspense fallback={<div className="flex h-64 items-center justify-center"><Spinner label="Loading course..." /></div>}>
        <Content />
      </Suspense>
    </ConsoleShell>
  );
}

function Content() {
  const id = useSearchParams().get("id");
  const queryClient = useQueryClient();
  const [editingCourse, setEditingCourse] = useState(false);

  const course = useQuery({ queryKey: ["admin", "courses", id], queryFn: () => adminCoursesApi.get(id!), enabled: !!id });
  const refresh = () => {
    setEditingCourse(false);
    queryClient.invalidateQueries({ queryKey: ["admin", "courses"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "courses", id] });
  };

  const publish = useMutation({ mutationFn: () => adminCoursesApi.publish(id!), onSuccess: refresh });
  const archive = useMutation({ mutationFn: () => adminCoursesApi.archive(id!), onSuccess: refresh });

  if (!id) return <ErrorBanner error="No course id given." />;
  if (course.isLoading) return <div className="flex h-64 items-center justify-center"><Spinner label="Loading curriculum details…" /></div>;
  if (course.isError) return <ErrorBanner error={course.error} />;
  if (!course.data) return null;

  const c = course.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link 
          href="/admin/courses" 
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-xs font-bold text-slate-400">Back to Curriculum Catalog</span>
      </div>

      <ConsolePageHeader
        title={c.title}
        description={`${c.provider} • ${c.category} • ${c.difficulty} • +${c.pointsValue} pts`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditingCourse((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all"
            >
              <Edit3 className="h-3.5 w-3.5 text-[#1755A7]" />
              <span>{editingCourse ? "Close Editor" : "Edit Details"}</span>
            </button>
            {c.status !== "PUBLISHED" ? (
              <button
                disabled={publish.isPending}
                onClick={() => publish.mutate()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1755A7] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#124282] transition-all disabled:opacity-50"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Publish Course</span>
              </button>
            ) : (
              <button
                disabled={archive.isPending}
                onClick={() => archive.mutate()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 transition-all disabled:opacity-50"
              >
                <Archive className="h-3.5 w-3.5" />
                <span>Archive</span>
              </button>
            )}
          </div>
        }
      />

      {(publish.isError || archive.isError) && <ErrorBanner error={publish.error ?? archive.error} />}

      {editingCourse && (
        <CourseForm course={{ ...c, courseId: c.courseId }} onDone={refresh} onCancel={() => setEditingCourse(false)} />
      )}

      {/* Catalog Setup Overview */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[#1755A7]" />
          Curriculum Metadata & Pathway Rules
        </h3>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <InfoCard label="Track Pillar" value={c.category} />
          <InfoCard label="Difficulty Tier" value={c.difficulty} />
          <InfoCard label="Duration" value={`${c.durationHours}h${c.durationWeeks ? ` (${c.durationWeeks} weeks)` : ""}`} />
          <InfoCard label="Delivery Mode" value={c.deliveryMode} />
          <InfoCard label="Enrollment Type" value={c.enrollmentType} />
          <InfoCard label="Certificate" value={c.certificateAvailable ? "Verified Cert" : "No Certificate"} />
          <InfoCard label="Requisite Level" value={c.levelRequirement ? `Level ${c.levelRequirement}+` : "Open (Lvl 1)"} />
          <InfoCard label="Status" value={c.status} isHighlight={c.status === "PUBLISHED"} />
        </div>

        {c.description && (
          <div className="mt-4 rounded-xl border border-slate-200/80 bg-white p-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Description</h4>
            <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-700">{c.description}</p>
          </div>
        )}

        {c.externalUrl && (
          <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Course Link</div>
            <a href={c.externalUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block break-all text-xs font-bold text-[#1755A7] hover:underline">
              {c.externalUrl}
            </a>
          </div>
        )}

        {c.shortDescription && (
          <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
            {c.shortDescription}
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <ListBlock title="Skills Covered" items={c.skillsCovered} />
          <ListBlock title="Learning Outcomes" items={c.learningOutcomes} />
        </div>
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
  if (items.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</h4>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
