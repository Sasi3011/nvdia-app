"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsoleCard } from "../../../components/console/ConsoleCard";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { mentorCoursesApi } from "../../../lib/api";

// Mentor review queue for course-proof submissions — a separate list from
// /mentor/queue (activity claims), clearly labeled, same review pattern.
export default function MentorCoursesQueuePage() {
  const queue = useQuery({ queryKey: ["mentor", "courses", "queue"], queryFn: mentorCoursesApi.queue });

  return (
    <ConsoleShell role="MENTOR">
      <ConsolePageHeader title={`Course Submissions (${queue.data?.length ?? "…"})`} description="Proof submitted for Admin/Mentor-assigned courses." />

      {queue.isLoading ? (
        <Spinner />
      ) : queue.isError ? (
        <ErrorBanner error={queue.error} />
      ) : !queue.data || queue.data.length === 0 ? (
        <p className="text-body text-text-muted">Nothing here — the queue is clear.</p>
      ) : (
        <ConsoleCard className="divide-y divide-navy-700 p-0">
          {queue.data.map((e) => (
            <Link key={e.enrollmentId} href={`/mentor/courses/detail?id=${e.enrollmentId}`} className="flex items-center justify-between px-6 py-4 hover:bg-surface-muted">
              <div>
                <div className="text-body text-ink">{e.student.fullName}</div>
                <div className="text-caption text-text-muted">
                  {e.student.department} · {e.courseTitle} · +{e.pointsValue} pts
                </div>
              </div>
              <span className="font-mono text-caption text-text-muted">{e.submittedAt ? new Date(e.submittedAt).toLocaleDateString() : ""}</span>
            </Link>
          ))}
        </ConsoleCard>
      )}
    </ConsoleShell>
  );
}
