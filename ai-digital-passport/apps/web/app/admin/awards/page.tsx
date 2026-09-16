"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsoleCard } from "../../../components/console/ConsoleCard";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { Button } from "../../../components/ui/Button";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { adminProgramApi } from "../../../lib/api";

const inputClass = "rounded-card border border-border bg-surface px-3 py-2 text-body text-ink placeholder:text-text-muted";

export default function AdminAwardsPage() {
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const [certificateType, setCertificateType] = useState("AI Excellence Award");
  const [badgeId, setBadgeId] = useState("");
  const [threshold, setThreshold] = useState(1000);

  const certificate = useMutation({ mutationFn: () => adminProgramApi.createCertificate({ userId, title, certificateType }) });
  const badgeRule = useMutation({ mutationFn: () => adminProgramApi.createBadgeRule({ badgeId, trigger: "TOTAL_POINTS", threshold }) });
  const applyBadges = useMutation({ mutationFn: () => adminProgramApi.applyBadges(userId) });

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader title="AI Excellence Awards" description="Issue certificates and configure badge unlock rules." />

      <div className="grid grid-cols-1 gap-6 desktop:grid-cols-2">
        <ConsoleCard>
          <h2 className="text-h2 text-ink">Generate certificate PDF</h2>
          <form
            className="mt-3 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              certificate.mutate();
            }}
          >
            {certificate.isError ? <ErrorBanner error={certificate.error} /> : null}
            <input required value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Student user id" className={inputClass} />
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Certificate title" className={inputClass} />
            <input required value={certificateType} onChange={(e) => setCertificateType(e.target.value)} placeholder="Certificate type" className={inputClass} />
            <Button type="submit" variant="primary" disabled={certificate.isPending}>Generate</Button>
          </form>
        </ConsoleCard>

        <ConsoleCard>
          <h2 className="text-h2 text-ink">Badge auto-unlock rule</h2>
          <form
            className="mt-3 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              badgeRule.mutate();
            }}
          >
            {badgeRule.isError ? <ErrorBanner error={badgeRule.error} /> : null}
            <input required value={badgeId} onChange={(e) => setBadgeId(e.target.value)} placeholder="Badge id" className={inputClass} />
            <input type="number" min={0} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className={inputClass} />
            <Button type="submit" variant="secondary" disabled={badgeRule.isPending}>Create rule</Button>
          </form>
          <Button type="button" variant="secondary" className="mt-4" disabled={!userId || applyBadges.isPending} onClick={() => applyBadges.mutate()}>
            Apply badge rules to user
          </Button>
        </ConsoleCard>
      </div>
    </ConsoleShell>
  );
}
