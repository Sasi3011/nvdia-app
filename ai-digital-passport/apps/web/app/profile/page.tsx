"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { StudentShell } from "../../components/shell/StudentShell";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { PageHeader } from "../../components/ui/PageHeader";
import { meApi } from "../../lib/api";
import { useMe } from "../../lib/session";

// Page 18 — Profile & Settings (spec 02 Section 6.2). Email and register
// number are read-only post-onboarding — they're auth/points-integrity
// keys (Page 18 business rule).
export default function ProfilePage() {
  return (
    <StudentShell>
      <PageHeader title="Profile & Settings" />
      <ProfileForm />
    </StudentShell>
  );
}

function ProfileForm() {
  const me = useMe(true);
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [cohortYear, setCohortYear] = useState(0);

  useEffect(() => {
    if (me.data) {
      setFullName(me.data.fullName);
      setDepartment(me.data.department);
      setCohortYear(me.data.cohortYear);
    }
  }, [me.data]);

  const update = useMutation({
    mutationFn: () => meApi.update({ fullName, department, cohortYear }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });

  if (!me.data) return null;

  return (
    <Card className="max-w-md">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          update.mutate();
        }}
      >
        {update.isError ? <ErrorBanner error={update.error} /> : null}
        {update.isSuccess ? <p className="text-body text-accent-deep">Saved.</p> : null}

        <label className="flex flex-col gap-1">
          <span className="text-caption text-text-muted">Email</span>
          <input disabled value={me.data.email} className="rounded-card border border-border bg-surface-muted px-3 py-2 text-body text-text-muted" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-caption text-text-muted">Register number</span>
          <input
            disabled
            value={me.data.registerNum}
            className="rounded-card border border-border bg-surface-muted px-3 py-2 text-body text-text-muted"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-caption text-text-muted">Full name</span>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="rounded-card border border-border px-3 py-2 text-body"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-caption text-text-muted">Department</span>
          <input
            required
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="rounded-card border border-border px-3 py-2 text-body"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-caption text-text-muted">Cohort year</span>
          <input
            required
            type="number"
            value={cohortYear}
            onChange={(e) => setCohortYear(Number(e.target.value))}
            className="rounded-card border border-border px-3 py-2 text-body"
          />
        </label>

        <Button type="submit" variant="primary" disabled={update.isPending}>
          {update.isPending ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </Card>
  );
}
