"use client";

import { Suspense, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { ProofType } from "@ai-digital-passport/shared-types";
import { StudentShell } from "../../../components/shell/StudentShell";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { PageHeader } from "../../../components/ui/PageHeader";
import { activitiesApi, uploadsApi } from "../../../lib/api";

// Page 14 — Submit Claim / Evidence (spec 02 Section 6.2). Proof type is
// one of PDF_FILE, GITHUB_LINK, DOI_LINK (Section 11.5) — TOTP_QR is never
// submitted here, it's handled by the live Scan page (Page 17) and
// auto-approved instantly. Route uses a query param for the pre-filled
// category (?category=) since this is a fixed static-export path, not a
// dynamic segment.
export default function SubmitClaimPage() {
  return (
    <StudentShell>
      <PageHeader title="Submit evidence" description="Proof is reviewed by a mentor before points are awarded." />
      <Suspense>
        <SubmitClaimForm />
      </Suspense>
    </StudentShell>
  );
}

type SubmittableProofType = typeof ProofType.PDF_FILE | typeof ProofType.GITHUB_LINK | typeof ProofType.DOI_LINK;

const PROOF_TYPES: { value: SubmittableProofType; label: string }[] = [
  { value: ProofType.PDF_FILE, label: "Upload PDF" },
  { value: ProofType.GITHUB_LINK, label: "GitHub link" },
  { value: ProofType.DOI_LINK, label: "DOI link" },
];

function SubmitClaimForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activities = useQuery({ queryKey: ["activities"], queryFn: () => activitiesApi.discover() });

  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [proofType, setProofType] = useState<SubmittableProofType>(ProofType.GITHUB_LINK);
  const [proofUrl, setProofUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<unknown>(null);

  const submit = useMutation({
    mutationFn: async () => {
      if (proofType === ProofType.PDF_FILE) {
        if (!file) throw new Error("Choose a PDF file first.");
        setUploadError(null);
        const uploaded = await uploadsApi.uploadPdf({
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          base64Data: await fileToBase64(file),
          entityType: "activity_claim",
        });
        return activitiesApi.createClaim({
          category,
          proofType,
          fileKey: uploaded.fileKey,
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        });
      }
      return activitiesApi.createClaim({ category, proofType, proofUrl });
    },
    onSuccess: () => router.push("/claims"),
    onError: (err) => setUploadError(err),
  });

  return (
    <Card className="max-w-md">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit.mutate();
        }}
      >
        {submit.isError || uploadError ? <ErrorBanner error={uploadError ?? submit.error} /> : null}

        <label className="flex flex-col gap-1">
          <span className="text-caption text-text-muted">Category</span>
          <select
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-card border border-border px-3 py-2 text-body"
          >
            <option value="" disabled>
              Choose a category
            </option>
            {(activities.data ?? []).map((a) => (
              <option key={a.category} value={a.category}>
                {a.label} (+{a.points} pts)
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-caption text-text-muted">Proof type</span>
          <select
            value={proofType}
            onChange={(e) => setProofType(e.target.value as typeof proofType)}
            className="rounded-card border border-border px-3 py-2 text-body"
          >
            {PROOF_TYPES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        {proofType === ProofType.PDF_FILE ? (
          <label className="flex flex-col gap-1">
            <span className="text-caption text-text-muted">PDF file</span>
            <input
              type="file"
              accept="application/pdf"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="rounded-card border border-border px-3 py-2 text-body"
            />
          </label>
        ) : (
          <label className="flex flex-col gap-1">
            <span className="text-caption text-text-muted">{proofType === ProofType.GITHUB_LINK ? "GitHub URL" : "DOI URL"}</span>
            <input
              type="url"
              required
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder={proofType === ProofType.GITHUB_LINK ? "https://github.com/…" : "https://doi.org/…"}
              className="rounded-card border border-border px-3 py-2 text-body"
            />
          </label>
        )}

        <Button type="submit" variant="primary" disabled={submit.isPending || !category}>
          {submit.isPending ? "Submitting…" : "Submit claim"}
        </Button>
      </form>
    </Card>
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
