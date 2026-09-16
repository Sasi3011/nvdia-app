"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Calendar, GraduationCap, IdCard, Landmark, Sparkles } from "lucide-react";
import { authApi } from "../../lib/api";
import { useSession } from "../../lib/session";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { Spinner } from "../../components/ui/Spinner";

// Page 2 — Onboarding (spec 02 Section 6.1). Authenticated, first-time
// user only. Collects Register Number, Department, Cohort Year; backend
// initializes the profile at Level 1 / 0 points / 0 GPU credits (BR-02).
// Returning users skip this page entirely.
export default function OnboardingPage() {
  const router = useRouter();
  const session = useSession();
  const [registerNum, setRegisterNum] = useState("");
  const [department, setDepartment] = useState("");
  const [cohortYear, setCohortYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (session.isLoading) return;
    if (!session.data?.authenticated) {
      router.replace("/login");
    } else if (session.data.onboarded) {
      const roles = session.data.roles ?? [];
      if (roles.includes("ADMIN")) {
        router.replace("/admin");
      } else if (roles.includes("MENTOR")) {
        router.replace("/mentor");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [session.isLoading, session.data, router]);

  const onboard = useMutation({
    mutationFn: () => authApi.onboard({ registerNum, department, cohortYear }),
    onSuccess: async () => {
      await session.refetch();
      router.replace("/dashboard");
    },
  });

  if (session.isLoading || !session.data?.authenticated || session.data.onboarded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-lg p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-card bg-accent text-white shadow-[0_10px_28px_rgba(118,185,0,0.30)]">
            <GraduationCap className="h-6 w-6" />
          </span>
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-caption font-semibold text-accent-deep">
              <Sparkles className="h-3.5 w-3.5" />
              Passport setup
            </div>
            <h1 className="mt-2 text-h1 font-bold text-ink">Complete your profile</h1>
          </div>
        </div>
        <p className="text-body text-text-muted">Welcome, {session.data.fullName}. A few details to set up your AI journey.</p>

        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onboard.mutate();
          }}
        >
          {onboard.isError ? <ErrorBanner error={onboard.error} /> : null}

          <label className="flex flex-col gap-1">
            <span className="text-caption text-text-muted">Register Number</span>
            <div className="relative">
              <IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input required value={registerNum} onChange={(e) => setRegisterNum(e.target.value)} className="w-full rounded-card border border-border bg-surface-muted py-3 pl-10 pr-3 text-body outline-none focus:border-accent focus:bg-white" placeholder="21CS001" />
            </div>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-caption text-text-muted">Department</span>
            <div className="relative">
              <Landmark className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input required value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full rounded-card border border-border bg-surface-muted py-3 pl-10 pr-3 text-body outline-none focus:border-accent focus:bg-white" placeholder="Computer Science" />
            </div>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-caption text-text-muted">Cohort Year</span>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input required type="number" min={2000} max={2100} value={cohortYear} onChange={(e) => setCohortYear(Number(e.target.value))} className="w-full rounded-card border border-border bg-surface-muted py-3 pl-10 pr-3 text-body outline-none focus:border-accent focus:bg-white" />
            </div>
          </label>

          <Button type="submit" variant="primary" disabled={onboard.isPending}>
            {onboard.isPending ? "Creating your passport…" : "Create my passport"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
