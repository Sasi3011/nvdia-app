"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StudentShell } from "../../components/shell/StudentShell";
import { Card } from "../../components/ui/Card";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { PageHeader } from "../../components/ui/PageHeader";
import { Spinner } from "../../components/ui/Spinner";
import { coursesApi, type EnrollmentStatusValue } from "../../lib/api";

const ENROLLMENT_LABELS: Record<EnrollmentStatusValue, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  SUBMITTED: "Submitted — awaiting review",
  APPROVED: "Completed",
  REJECTED: "Needs changes",
};

const ENROLLMENT_STYLES: Record<EnrollmentStatusValue, string> = {
  NOT_STARTED: "bg-surface-muted text-text-muted",
  IN_PROGRESS: "bg-pending/10 text-pending",
  SUBMITTED: "bg-pending/10 text-pending",
  APPROVED: "bg-accent/10 text-accent-deep",
  REJECTED: "bg-rejected/10 text-rejected",
};

// Admin/Mentor-Assigned Courses (additive feature) — student browse page.
// Only PUBLISHED courses the student's level qualifies for are returned by
// the API (BR-13/BR-14 context in schema.prisma); self-reported
// Certifications remain a separate, unrelated flow.
export default function CoursesPage() {
  const courses = useQuery({ queryKey: ["courses"], queryFn: coursesApi.list });
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [status, setStatus] = useState<"All" | EnrollmentStatusValue>("All");
  const [query, setQuery] = useState("");

  const categories = useMemo(() => ["All", ...Array.from(new Set((courses.data ?? []).map((c) => c.category)))], [courses.data]);
  const difficulties = useMemo(() => ["All", ...Array.from(new Set((courses.data ?? []).map((c) => c.difficulty)))], [courses.data]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (courses.data ?? []).filter((c) => {
      const matchesCategory = category === "All" || c.category === category;
      const matchesDifficulty = difficulty === "All" || c.difficulty === difficulty;
      const matchesStatus = status === "All" || c.enrollmentStatus === status;
      const haystack = [c.title, c.provider, c.category, c.difficulty, c.shortDescription, c.description, ...c.skillsCovered].join(" ").toLowerCase();
      return matchesCategory && matchesDifficulty && matchesStatus && (!normalized || haystack.includes(normalized));
    });
  }, [category, courses.data, difficulty, query, status]);

  return (
    <StudentShell>
      <PageHeader title="Learning Academy" description="Browse AI Foundation, Engineering, GPU Computing and advanced AI courses from internal and external platforms." />

      {courses.isLoading ? (
        <Spinner />
      ) : courses.isError ? (
        <ErrorBanner error={courses.error} />
      ) : !courses.data || courses.data.length === 0 ? (
        <p className="text-body text-text-muted">No courses assigned yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <Card className="grid grid-cols-1 gap-3 tablet:grid-cols-[1fr_180px_180px_180px]">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses, skills, platforms..."
              className="rounded-card border border-border px-3 py-2 text-body"
            />
            <Filter value={category} onChange={setCategory} options={categories} />
            <Filter value={difficulty} onChange={setDifficulty} options={difficulties} />
            <Filter value={status} onChange={(value) => setStatus(value as "All" | EnrollmentStatusValue)} options={["All", "NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "APPROVED", "REJECTED"]} />
          </Card>

          <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
          {filtered.map((c) => (
            <Link key={c.courseId} href={`/courses/detail?id=${c.courseId}`}>
              <Card className="flex h-full flex-col gap-2 transition-fast hover:border-navy-700">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      {c.isFeatured ? <span className="rounded-full bg-accent/10 px-2 py-0.5 text-caption font-medium text-accent-deep">Featured</span> : null}
                      {c.certificateAvailable ? <span className="rounded-full bg-navy-700/10 px-2 py-0.5 text-caption font-medium text-navy-700">Certificate</span> : null}
                    </div>
                    <h3 className="mt-2 text-h2 text-ink">{c.title}</h3>
                  </div>
                  <span className={"shrink-0 rounded-full px-3 py-1 text-caption font-medium " + ENROLLMENT_STYLES[c.enrollmentStatus]}>
                    {ENROLLMENT_LABELS[c.enrollmentStatus]}
                  </span>
                </div>
                <p className="text-caption text-text-muted">
                  {c.provider} · {c.category} · {c.difficulty} · {c.durationHours}h{c.durationWeeks ? ` / ${c.durationWeeks} weeks` : ""}
                </p>
                <p className="line-clamp-2 text-body text-text-muted">{c.shortDescription || c.description}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {c.skillsCovered.slice(0, 4).map((skill) => (
                    <span key={skill} className="rounded-full bg-surface-muted px-2 py-1 text-caption text-text-muted">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <p className="font-mono text-caption text-navy-700">+{c.pointsValue} points</p>
                  <p className="text-caption text-text-muted">{c.levelRequirement ? `Level ${c.levelRequirement}+` : "Open access"}</p>
                </div>
              </Card>
            </Link>
          ))}
          </div>
          {filtered.length === 0 ? <p className="text-body text-text-muted">No courses match these filters.</p> : null}
        </div>
      )}
    </StudentShell>
  );
}

function Filter({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-card border border-border px-3 py-2 text-body">
      {options.map((option) => (
        <option key={option} value={option}>
          {option === "NOT_STARTED" ? "Not started" : option === "IN_PROGRESS" ? "In progress" : option === "SUBMITTED" ? "Submitted" : option === "APPROVED" ? "Completed" : option === "REJECTED" ? "Needs changes" : option}
        </option>
      ))}
    </select>
  );
}
