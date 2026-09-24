"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { StudentShell } from "../../../components/shell/StudentShell";
import { DownloadLink } from "../../../components/shared/DownloadLink";
import { Card } from "../../../components/ui/Card";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Spinner } from "../../../components/ui/Spinner";
import { StatusChip, type Status } from "../../../components/ui/StatusChip";
import { claimsApi } from "../../../lib/api";

// Page 16 — Claim Detail (spec 02 Section 6.2). Query-param route
// (?id=) rather than a [id] path segment — apps/web is a static export,
// which can't pre-build arbitrary runtime claim ids into path segments.
export default function ClaimDetailPage() {
  return (
    <StudentShell>
      <Suspense>
        <ClaimDetailContent />
      </Suspense>
    </StudentShell>
  );
}

function ClaimDetailContent() {
  const id = useSearchParams().get("id");
  const claim = useQuery({
    queryKey: ["claims", "detail", id],
    queryFn: () => claimsApi.detail(id!),
    enabled: !!id,
  });

  if (!id) return <ErrorBanner error="No claim id given." />;
  if (claim.isLoading) return <Spinner />;
  if (claim.isError) return <ErrorBanner error={claim.error} />;
  if (!claim.data) return null;

  const c = claim.data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={c.category.replace(/_/g, " ")} actions={<StatusChip status={c.status as Status} />} />

      <Card className="flex flex-col gap-4">
        <Field label="Proof type" value={c.proofType.replace(/_/g, " ")} />
        {c.proofUrl ? (
          <Field
            label="Proof"
            value={
              <a href={c.proofUrl} target="_blank" rel="noreferrer" className="text-navy-700 underline underline-offset-2">
                {c.proofUrl}
              </a>
            }
          />
        ) : null}
        {c.attachments.map((a) => (
          <Field
            key={a.attachmentId}
            label="Attachment"
            value={<DownloadLink claimId={c.claimId} attachmentId={a.attachmentId} fileName={a.fileName} />}
          />
        ))}
        <Field label="Points requested" value={`${c.pointsRequested}`} mono />
        {c.pointsAwarded != null ? <Field label="Points awarded" value={`${c.pointsAwarded}`} mono /> : null}
        <Field label="Submitted" value={new Date(c.createdAt).toLocaleString()} mono />
        {c.reviewedAt ? <Field label="Reviewed" value={new Date(c.reviewedAt).toLocaleString()} mono /> : null}
      </Card>

      {c.status === "REJECTED" && c.mentorFeedback ? (
        <Card className="border-rejected/30 bg-rejected/5">
          <h3 className="text-h2 text-rejected">Faculty feedback</h3>
          <p className="mt-2 text-body text-ink">{c.mentorFeedback}</p>
        </Card>
      ) : null}

      {c.reviews.length > 0 ? (
        <div>
          <h3 className="mb-3 text-h2 text-ink">Review history</h3>
          <Card className="divide-y divide-border p-0">
            {c.reviews.map((r) => (
              <div key={r.reviewId} className="flex items-center justify-between px-6 py-4">
                <StatusChip status={r.decision as Status} />
                <span className="font-mono text-caption text-text-muted">{new Date(r.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-caption text-text-muted">{label}</span>
      <span className={"text-right text-body text-ink" + (mono ? " font-mono" : "")}>{value}</span>
    </div>
  );
}
