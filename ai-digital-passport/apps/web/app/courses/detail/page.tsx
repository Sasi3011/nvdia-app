"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { StudentShell } from "../../../components/shell/StudentShell";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Spinner } from "../../../components/ui/Spinner";
import { coursesApi, uploadsApi } from "../../../lib/api";

// Course Detail (student) — course info, external link and proof submission.
export default function CourseDetailPage() {
  return (
    <StudentShell>
      <Suspense>
        <CourseDetailContent />
      </Suspense>
    </StudentShell>
  );
}

function CourseDetailContent() {
  const id = useSearchParams().get("id");
  const queryClient = useQueryClient();
  const course = useQuery({ queryKey: ["courses", "detail", id], queryFn: () => coursesApi.detail(id!), enabled: !!id });

  const [proofUrl, setProofUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState<unknown>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["courses", "detail", id] });

  const submitProof = useMutation({
    mutationFn: async () => {
      if (file) {
        const uploaded = await uploadsApi.uploadPdf({
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          base64Data: await fileToBase64(file),
          entityType: "course_proof",
          entityId: id!,
        });
        return coursesApi.submitProof(id!, uploaded);
      }
      return coursesApi.submitProof(id!, { proofUrl });
    },
    onSuccess: () => {
      setSubmitError(null);
      refresh();
    },
    onError: setSubmitError,
  });

  if (!id) return <ErrorBanner error="No course id given." />;
  if (course.isLoading) return <Spinner label="Loading course…" />;
  if (course.isError) return <ErrorBanner error={course.error} />;
  if (!course.data) return null;

  const c = course.data;
  const canSubmit = c.enrollment.status === "NOT_STARTED" || c.enrollment.status === "IN_PROGRESS" || c.enrollment.status === "REJECTED";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={c.title} description={`${c.provider} · ${c.category} · ${c.difficulty} · +${c.pointsValue} points`} />

      <Card>
        <div className="grid grid-cols-2 gap-3 tablet:grid-cols-4">
          <Info label="Duration" value={`${c.durationHours}h${c.durationWeeks ? ` / ${c.durationWeeks} weeks` : ""}`} />
          <Info label="Mode" value={c.deliveryMode} />
          <Info label="Enrollment" value={c.enrollmentType} />
          <Info label="Certificate" value={c.certificateAvailable ? "Available" : "Not included"} />
        </div>
        <p className="mt-4 text-body text-ink">{c.description}</p>
        <a
          href={c.externalUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-body text-navy-700 underline underline-offset-2"
        >
          Open course on {c.provider} →
        </a>
      </Card>

      <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
        <Card>
          <h2 className="text-h2 text-ink">What you will learn</h2>
          <BulletList items={c.learningOutcomes} empty="Outcomes will be added by the admin." />
        </Card>
        <Card>
          <h2 className="text-h2 text-ink">Skills and tools</h2>
          <TagList items={[...c.skillsCovered, ...c.toolsRequired]} />
        </Card>
        <Card>
          <h2 className="text-h2 text-ink">Prerequisites</h2>
          <BulletList items={c.prerequisites} empty="No prerequisites listed." />
        </Card>
        <Card>
          <h2 className="text-h2 text-ink">Target students</h2>
          <p className="mt-3 text-body text-text-muted">{c.targetAudience || "Students who qualify for this AI Passport level."}</p>
          <p className="mt-3 text-caption text-text-muted">{c.levelRequirement ? `Unlock condition: AI Level ${c.levelRequirement} or above.` : "Unlock condition: open to all eligible students."}</p>
        </Card>
      </div>

      {c.enrollment.status === "REJECTED" || c.enrollment.reviewFeedback ? (
        <Card className="border-rejected/40 bg-rejected/5">
          <h3 className="text-caption text-rejected">Mentor feedback</h3>
          <p className="mt-1 text-body text-ink">{c.enrollment.reviewFeedback}</p>
        </Card>
      ) : null}

      <Card>
        <h2 className="text-h2 text-ink">Submit proof</h2>
        {c.enrollment.status === "SUBMITTED" ? (
          <p className="mt-3 text-body text-text-muted">Your proof is submitted and awaiting mentor review.</p>
        ) : c.enrollment.status === "APPROVED" ? (
          <p className="mt-3 text-body text-accent-deep">Approved — points already awarded.</p>
        ) : (
          <form
            className="mt-3 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              submitProof.mutate();
            }}
          >
            {submitError ? <ErrorBanner error={submitError} /> : null}
            <label className="flex flex-col gap-1">
              <span className="text-caption text-text-muted">Certificate PDF</span>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="rounded-card border border-border px-3 py-2 text-body"
              />
            </label>
            <span className="text-center text-caption text-text-muted">— or —</span>
            <label className="flex flex-col gap-1">
              <span className="text-caption text-text-muted">Proof link</span>
              <input
                type="url"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder="https://…"
                className="rounded-card border border-border px-3 py-2 text-body"
              />
            </label>
            <Button type="submit" variant="primary" disabled={!canSubmit || submitProof.isPending || (!file && !proofUrl.trim())}>
              {submitProof.isPending ? "Submitting…" : "Submit for review"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.includes(",") ? result.slice(result.indexOf(",") + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card bg-surface-muted p-3">
      <div className="text-caption text-text-muted">{label}</div>
      <div className="mt-1 text-body font-medium text-ink">{value}</div>
    </div>
  );
}

function BulletList({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <p className="mt-3 text-body text-text-muted">{empty}</p>;
  return (
    <ul className="mt-3 list-disc space-y-2 pl-5 text-body text-text-muted">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function TagList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="mt-3 text-body text-text-muted">Skills and tools will be added by the admin.</p>;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-surface-muted px-3 py-1 text-caption text-text-muted">
          {item}
        </span>
      ))}
    </div>
  );
}
