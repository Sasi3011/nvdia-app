"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsoleCard } from "../../../components/console/ConsoleCard";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { Button } from "../../../components/ui/Button";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { mentorProctoringApi } from "../../../lib/api";

// Proctoring Locks (BR-16) — a locked live-proctored session can only be
// reopened here, by a mentor's explicit action. Every lock and unlock is
// also audit-logged server-side (BR-17).
export default function ProctoringLocksPage() {
  const queryClient = useQueryClient();
  const locks = useQuery({ queryKey: ["mentor", "proctoring", "locks"], queryFn: mentorProctoringApi.listLocked });

  const grant = useMutation({
    mutationFn: (sessionId: string) => mentorProctoringApi.grantAccess(sessionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mentor", "proctoring", "locks"] }),
  });

  return (
    <ConsoleShell role="MENTOR">
      <ConsolePageHeader
        title={`Proctoring Locks (${locks.data?.length ?? "…"})`}
        description="Students locked out of a live-proctored task after 4 violations. Granting access resets their strikes and lets them retry."
      />

      {locks.isLoading ? (
        <Spinner />
      ) : locks.isError ? (
        <ErrorBanner error={locks.error} />
      ) : !locks.data || locks.data.length === 0 ? (
        <p className="text-body text-text-muted">No locked sessions.</p>
      ) : (
        <ConsoleCard className="divide-y divide-navy-700 p-0">
          {locks.data.map((s) => (
            <div key={s.sessionId} className="flex items-center justify-between px-6 py-4">
              <div>
                <div className="text-body text-ink">{s.student.fullName}</div>
                <div className="text-caption text-text-muted">
                  {s.student.department} · {s.task.title} ({s.course.title}) · {s.violationCount} violations · locked{" "}
                  {s.lockedAt ? new Date(s.lockedAt).toLocaleString() : ""}
                </div>
              </div>
              <Button variant="primary" disabled={grant.isPending} onClick={() => grant.mutate(s.sessionId)}>
                {grant.isPending ? "Granting…" : "Grant access"}
              </Button>
            </div>
          ))}
        </ConsoleCard>
      )}
    </ConsoleShell>
  );
}
