"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsoleCard } from "../../../components/console/ConsoleCard";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { adminCoursesApi } from "../../../lib/api";

export default function MentorCourseCatalogPage() {
  const courses = useQuery({ queryKey: ["mentor", "course-catalog"], queryFn: adminCoursesApi.list });

  return (
    <ConsoleShell role="MENTOR">
      <ConsolePageHeader
        title="Course Catalog"
        description="Courses created by admin. Published courses are visible to students; submitted student proofs appear in Course Submissions."
      />

      {courses.isLoading ? (
        <Spinner />
      ) : courses.isError ? (
        <ErrorBanner error={courses.error} />
      ) : !courses.data || courses.data.length === 0 ? (
        <p className="text-body text-text-muted">No courses created yet.</p>
      ) : (
        <ConsoleCard className="divide-y divide-border p-0">
          {courses.data.map((course) => (
            <div key={course.courseId} className="grid gap-3 px-6 py-4 tablet:grid-cols-[1fr_auto] tablet:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-body text-ink">{course.title}</h2>
                  <StatusBadge status={course.status} />
                  {course.isFeatured ? <span className="rounded-full bg-accent/10 px-2 py-0.5 text-caption text-accent-deep">Featured</span> : null}
                </div>
                <p className="mt-1 text-caption text-text-muted">
                  {course.provider} · {course.category} · {course.difficulty} · {course.durationHours}h · +{course.pointsValue} pts
                </p>
                <p className="mt-1 line-clamp-1 text-caption text-text-muted">{course.shortDescription || "No short description added."}</p>
              </div>
              <Link href="/mentor/courses" className="text-caption text-accent underline underline-offset-2">
                Review submissions
              </Link>
            </div>
          ))}
        </ConsoleCard>
      )}
    </ConsoleShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className = status === "PUBLISHED" ? "bg-accent/10 text-accent-deep" : status === "ARCHIVED" ? "bg-rejected/10 text-rejected" : "bg-surface-muted text-text-muted";
  return <span className={"rounded-full px-2 py-0.5 font-mono text-caption " + className}>{status}</span>;
}
