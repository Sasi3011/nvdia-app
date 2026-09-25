"use client";

import { Suspense, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { ConsoleShell } from "../../../../components/console/ConsoleShell";
import { ConsoleCard } from "../../../../components/console/ConsoleCard";
import { ConsolePageHeader } from "../../../../components/console/ConsolePageHeader";
import { DownloadLink } from "../../../../components/shared/DownloadLink";
import { Button } from "../../../../components/ui/Button";
import { ErrorBanner } from "../../../../components/ui/ErrorBanner";
import { Spinner } from "../../../../components/ui/Spinner";
import { StatusChip, type Status } from "../../../../components/ui/StatusChip";
import { claimsApi, mentorApi } from "../../../../lib/api";
import { safeUrl } from "../../../../lib/safe-url";

// Page 22 — Mentor Claim Review Detail (spec 02 Section 6.3). Evidence
// viewer on one side, approve/reject on the other (design system 18.6);
// rejection feedback is mandatory (FR-VERIF-03), visibly required rather
// than just optional-looking.
export default function MentorClaimReviewPage() {
  return (
    <ConsoleShell role="MENTOR">
      <Suspense>
        <ReviewContent />
      </Suspense>
    </ConsoleShell>
  );
}

function ReviewContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = useSearchParams().get("id");
  const [feedback, setFeedback] = useState("");
  const [actionError, setActionError] = useState<unknown>(null);

  const claim = useQuery({
    queryKey: ["claims", "detail", id],
    queryFn: () => claimsApi.detail(id!),
    enabled: !!id,
  });

  const approve = useMutation({
    mutationFn: () => mentorApi.approve(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentor", "queue"] });
      router.push("/mentor/queue");
    },
    onError: setActionError,
  });

  const reject = useMutation({
    mutationFn: () => mentorApi.reject(id!, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentor", "queue"] });
      router.push("/mentor/queue");
    },
    onError: setActionError,
  });

  if (!id) return <ErrorBanner error="No claim id given." />;
  if (claim.isLoading) return <Spinner label="Loading claim…" />;
  if (claim.isError) return <ErrorBanner error={claim.error} />;
  if (!claim.data) return null;

  const c = claim.data;
  const alreadyReviewed = c.status !== "PENDING";

  return (
    <div className="flex flex-col gap-6">
      <ConsolePageHeader
        title={c.claimant.fullName}
        description={`${c.category.replace(/_/g, " ")} · ${c.pointsRequested} points requested`}
        actions={<StatusChip status={c.status as Status} />}
      />

      <div className="grid grid-cols-1 gap-6 desktop:grid-cols-2">
        <ConsoleCard>
          <h2 className="text-h2 text-ink">Evidence</h2>
          <div className="mt-4 flex flex-col gap-3">
            <Field label="Proof type" value={c.proofType.replace(/_/g, " ")} />
            {c.proofUrl ? (
              <Field
                label="Link"
                value={
                  <a href={safeUrl(c.proofUrl)} target="_blank" rel="noreferrer" className="text-accent underline underline-offset-2">
                    {c.proofUrl}
                  </a>
                }
              />
            ) : null}
            {c.attachments.map((a) => (
              <Field
                key={a.attachmentId}
                label="File"
                value={
                  <DownloadLink
                    claimId={c.claimId}
                    attachmentId={a.attachmentId}
                    fileName={a.fileName}
                    className="text-accent underline underline-offset-2"
                  />
                }
              />
            ))}
            <Field label="Submitted" value={new Date(c.createdAt).toLocaleString()} />
          </div>
        </ConsoleCard>

        <ConsoleCard>
          <h2 className="text-h2 text-ink">Decision</h2>

          {alreadyReviewed ? (
            <p className="mt-4 text-body text-text-muted">
              This claim was already reviewed — no further action needed.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-4">
              {actionError ? <ErrorBanner error={actionError} /> : null}

              <Button variant="primary" disabled={approve.isPending || reject.isPending} onClick={() => approve.mutate()}>
                {approve.isPending ? "Approving…" : `Approve (+${c.pointsRequested} pts)`}
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
                <Button
                  variant="destructive"
                  className="mt-3"
                  disabled={!feedback.trim() || approve.isPending || reject.isPending}
                  onClick={() => reject.mutate()}
                >
                  {reject.isPending ? "Rejecting…" : "Reject"}
                </Button>
              </div>
            </div>
          )}
        </ConsoleCard>
      </div>

      {c.reviews.length > 0 ? (
        <div>
          <h2 className="mb-3 text-h2 text-ink">Review history</h2>
          <ConsoleCard className="divide-y divide-navy-700 p-0">
            {c.reviews.map((r) => (
              <div key={r.reviewId} className="flex items-center justify-between px-6 py-4">
                <div>
                  <StatusChip status={r.decision as Status} />
                  {r.comment ? <p className="mt-2 text-body text-text-muted">{r.comment}</p> : null}
                </div>
                <span className="font-mono text-caption text-text-muted">{new Date(r.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </ConsoleCard>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-navy-700 pb-3 last:border-0 last:pb-0">
      <span className="text-caption text-text-muted">{label}</span>
      <span className="text-right font-mono text-body text-ink">{value}</span>
    </div>
  );
}
