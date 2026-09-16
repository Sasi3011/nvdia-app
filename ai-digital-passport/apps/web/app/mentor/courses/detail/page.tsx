"use client";

import { Suspense, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { ConsoleShell } from "../../../../components/console/ConsoleShell";
import { ConsoleCard } from "../../../../components/console/ConsoleCard";
import { ConsolePageHeader } from "../../../../components/console/ConsolePageHeader";
import { Button } from "../../../../components/ui/Button";
import { ErrorBanner } from "../../../../components/ui/ErrorBanner";
import { Spinner } from "../../../../components/ui/Spinner";
import { API_BASE_URL, mentorCoursesApi } from "../../../../lib/api";

// Course submission review (BR-14) — approve triggers PointsService (same
// path every other approval uses) once required tasks are complete;
// reject requires feedback and returns the student to IN_PROGRESS.
export default function MentorCourseReviewPage() {
  return (
    <ConsoleShell role="MENTOR">
      <Suspense>
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

  if (!id) return <ErrorBanner error="No enrollment id given." />;
  if (queue.isLoading) return <Spinner label="Loading submission…" />;
  if (queue.isError) return <ErrorBanner error={queue.error} />;
  if (!item) return <p className="text-body text-text-muted">This submission isn&apos;t in the pending queue (already reviewed, or not found).</p>;

  const isExternalLink = item.submittedProofUrl && /^https?:\/\//.test(item.submittedProofUrl);

  return (
    <div className="flex flex-col gap-6">
      <ConsolePageHeader title={item.student.fullName} description={`${item.student.department} · ${item.courseTitle} · +${item.pointsValue} points`} />

      <div className="grid grid-cols-1 gap-6 desktop:grid-cols-2">
        <ConsoleCard>
          <h2 className="text-h2 text-ink">Proof</h2>
          <div className="mt-4">
            {isExternalLink ? (
              <a href={item.submittedProofUrl!} target="_blank" rel="noreferrer" className="text-accent underline underline-offset-2">
                {item.submittedProofUrl}
              </a>
            ) : (
              <Button variant="secondary" disabled={loadDownload.isPending} onClick={() => loadDownload.mutate()}>
                {loadDownload.isPending ? "Opening…" : "View uploaded file"}
              </Button>
            )}
          </div>
        </ConsoleCard>

        <ConsoleCard>
          <h2 className="text-h2 text-ink">Decision</h2>
          <div className="mt-4 flex flex-col gap-4">
            {actionError ? <ErrorBanner error={actionError} /> : null}
            <p className="text-caption text-text-muted">
              Approving requires every required task (including any Live Proctored task) to be completed for this student, not just
              locked or in-progress.
            </p>
            <Button variant="primary" disabled={approve.isPending || reject.isPending} onClick={() => approve.mutate()}>
              {approve.isPending ? "Approving…" : `Approve (+${item.pointsValue} pts)`}
            </Button>

            <div className="border-t border-navy-700 pt-4">
              <label className="flex flex-col gap-1">
                <span className="text-caption text-text-muted">
                  Feedback <span className="text-rejected">(required to reject)</span>
                </span>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  className="rounded-card border border-border bg-surface px-3 py-2 text-body text-ink placeholder:text-text-muted"
                  placeholder="Explain what's missing or incorrect…"
                />
              </label>
              <Button variant="destructive" className="mt-3" disabled={!feedback.trim() || approve.isPending || reject.isPending} onClick={() => reject.mutate()}>
                {reject.isPending ? "Rejecting…" : "Reject"}
              </Button>
            </div>
          </div>
        </ConsoleCard>
      </div>
    </div>
  );
}
