"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { CourseForm } from "../../../components/admin/CourseForm";
import { Button } from "../../../components/ui/Button";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { adminCoursesApi } from "../../../lib/api";
import { BookOpen, Briefcase, Clock, Layers, Award, ShieldCheck, MapPin } from "lucide-react";

export default function AdminCoursesPage() {
  const queryClient = useQueryClient();
  const courses = useQuery({ queryKey: ["admin", "courses"], queryFn: adminCoursesApi.list });
  const [creating, setCreating] = useState(false);

  const invalidate = () => {
    setCreating(false);
    queryClient.invalidateQueries({ queryKey: ["admin", "courses"] });
  };

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader
        title="Course Management"
        description="Create Coursera, Udemy, NVIDIA, NPTEL and internal AI Academy courses with points, levels, certificates and tasks."
        actions={
          <Button variant="primary" onClick={() => setCreating(true)}>
            New course
          </Button>
        }
      />

      {creating ? <CourseForm onDone={invalidate} onCancel={() => setCreating(false)} /> : null}

      {courses.isLoading ? (
        <Spinner />
      ) : courses.isError ? (
        <ErrorBanner error={courses.error} />
      ) : !courses.data || courses.data.length === 0 ? (
        <p className="text-[14px] text-text-muted">No courses yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-surface-muted text-[12px] font-bold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-6 py-4">Course Name</th>
                <th className="px-6 py-4">Provider & Category</th>
                <th className="px-6 py-4">Duration & Level</th>
                <th className="px-6 py-4 text-right">Points</th>
                <th className="px-6 py-4 text-right">Status</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {courses.data.map((c) => (
                <tr key={c.courseId} className="group transition-colors hover:bg-blue-50/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-ink">{c.title}</span>
                        <div className="mt-1 flex items-center gap-2">
                          {c.isFeatured ? <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase text-orange-700">Featured</span> : null}
                          {c.certificateAvailable ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">Cert</span> : null}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1.5 font-medium text-ink"><Briefcase className="h-4 w-4 text-gray-400" /> {c.provider}</span>
                      <span className="text-[12px] text-text-muted">{c.category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1.5 font-medium text-ink"><Clock className="h-4 w-4 text-gray-400" /> {c.durationHours}h {c.durationWeeks ? `(${c.durationWeeks}w)` : ""}</span>
                      <span className="flex items-center gap-1.5 text-[12px] text-text-muted"><Layers className="h-3.5 w-3.5" /> {c.difficulty} {c.levelRequirement ? `(Lvl ${c.levelRequirement}+)` : ""}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center gap-1.5 font-bold text-accent"><Award className="h-4 w-4" /> +{c.pointsValue}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Link href={`/admin/courses/detail?id=${c.courseId}`} className="inline-flex items-center justify-center rounded-lg bg-surface-muted px-4 py-2 text-[13px] font-bold text-ink transition-colors hover:bg-gray-200">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ConsoleShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "PUBLISHED") {
    return <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">Published</span>;
  }
  if (status === "ARCHIVED") {
    return <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-600">Archived</span>;
  }
  return <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700">Draft</span>;
}
