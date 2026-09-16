"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsoleCard } from "../../../components/console/ConsoleCard";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { CourseForm } from "../../../components/admin/CourseForm";
import { Button } from "../../../components/ui/Button";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { adminCoursesApi } from "../../../lib/api";

// Course Management (Admin/Mentor) — Assigned Courses feature, BR-13: only
// Admin/Mentor can create/edit/publish. Task management lives on the
// per-course detail page (/admin/courses/detail?id=).
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
        <p className="text-body text-text-muted">No courses yet.</p>
      ) : (
        <ConsoleCard className="divide-y divide-navy-700 p-0">
          {courses.data.map((c) => (
            <Link key={c.courseId} href={`/admin/courses/detail?id=${c.courseId}`} className="grid gap-4 px-6 py-4 hover:bg-surface-muted tablet:grid-cols-[1fr_auto] tablet:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-body text-ink">{c.title}</div>
                  {c.isFeatured ? <span className="rounded-full bg-accent/10 px-2 py-0.5 text-caption text-accent">Featured</span> : null}
                  {c.certificateAvailable ? <span className="rounded-full bg-surface-muted px-2 py-0.5 text-caption text-text-muted">Certificate</span> : null}
                </div>
                <div className="mt-1 text-caption text-text-muted">
                  {c.provider} · {c.category} · {c.difficulty} · {c.durationHours}h{c.durationWeeks ? ` / ${c.durationWeeks} weeks` : ""} · {c.deliveryMode}
                </div>
                <div className="mt-1 line-clamp-1 text-caption text-text-muted">
                  {c.shortDescription || `${c.pointsValue} pts · ${c.taskCount} task(s)${c.levelRequirement ? ` · Requires Level ${c.levelRequirement}` : ""}`}
                </div>
              </div>
              <div className="flex items-center gap-3 tablet:justify-end">
                <span className="font-mono text-caption text-accent">+{c.pointsValue}</span>
                <StatusBadge status={c.status} />
              </div>
            </Link>
          ))}
        </ConsoleCard>
      )}
    </ConsoleShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = { DRAFT: "text-text-muted", PUBLISHED: "text-accent", ARCHIVED: "text-rejected" };
  return <span className={"font-mono text-caption " + (colors[status] ?? "text-text-muted")}>{status}</span>;
}
