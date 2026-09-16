"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { StudentShell } from "../../../components/shell/StudentShell";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Spinner } from "../../../components/ui/Spinner";
import { coursesApi, proctoringApi, type ViolationTypeValue } from "../../../lib/api";

/**
 * Proctored Live Session (Feature 2). Detection approach, confirmed with
 * the product owner before implementation:
 *
 * - Web: the real Fullscreen API (`requestFullscreen`/`fullscreenchange`)
 *   plus `document.visibilitychange` (tab switch) and `window blur`
 *   (switched to another app/window).
 * - Native (Capacitor Android/iOS app): the Fullscreen API is unreliable
 *   inside a WebView and meaningless anyway (there's no browser chrome to
 *   escape), so instead this uses `@capacitor/app`'s `appStateChange`
 *   listener — `isActive: false` means the student backgrounded the app
 *   (switched to another app or the home screen), which is the native
 *   equivalent of a tab switch.
 *
 * BE HONEST WITH THE STUDENT (and read this if you're re-reading this
 * code): this flags fullscreen-exit and tab/app-switch events as a
 * deterrent. It cannot detect a second physical device (e.g. a phone)
 * being used alongside the session — it does not "prevent AI tool use."
 * A stronger guarantee (e.g. webcam proctoring) would need a separate,
 * explicit product decision.
 */
export default function ProctoringPage() {
  return (
    <StudentShell>
      <Suspense>
        <ProctoringContent />
      </Suspense>
    </StudentShell>
  );
}

type Phase = "intro" | "active" | "locked" | "completed" | "denied";

function ProctoringContent() {
  const router = useRouter();
  const params = useSearchParams();
  const taskId = params.get("taskId");
  const courseId = params.get("courseId");
  const isNative = Capacitor.isNativePlatform();

  const course = useQuery({ queryKey: ["courses", "detail", courseId], queryFn: () => coursesApi.detail(courseId!), enabled: !!courseId });
  const task = course.data?.tasks.find((t) => t.taskId === taskId);

  const [phase, setPhase] = useState<Phase>("intro");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const appStateListenerRef = useRef<{ remove: () => void } | null>(null);

  const start = useMutation({
    mutationFn: () => proctoringApi.start(taskId!),
    onSuccess: (session) => {
      setSessionId(session.sessionId);
      setPhase("active");
    },
    onError: (err) => {
      setError(err);
      setPhase("denied");
    },
  });

  const reportViolation = useMutation({
    mutationFn: (violationType: ViolationTypeValue) => proctoringApi.reportViolation(sessionId!, violationType),
    onSuccess: (res) => {
      if (res.locked) {
        setPhase("locked");
        cleanupListeners();
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      } else {
        setWarning(`Violation ${res.violationCount}/4 — ${res.remaining} attempt(s) left before this session locks.`);
        setTimeout(() => setWarning(null), 6000);
      }
    },
  });

  const complete = useMutation({
    mutationFn: () => proctoringApi.complete(sessionId!),
    onSuccess: () => {
      setPhase("completed");
      cleanupListeners();
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    },
  });

  const cleanupListeners = useCallback(() => {
    document.removeEventListener("fullscreenchange", onFullscreenChange);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("blur", onBlur);
    document.removeEventListener("contextmenu", preventDefault);
    document.removeEventListener("copy", preventDefault);
    document.removeEventListener("paste", preventDefault);
    appStateListenerRef.current?.remove();
    appStateListenerRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function preventDefault(e: Event) {
    e.preventDefault();
  }

  function onFullscreenChange() {
    if (!document.fullscreenElement) reportViolation.mutate("FULLSCREEN_EXIT");
  }

  function onVisibilityChange() {
    if (document.hidden) reportViolation.mutate("TAB_SWITCH");
  }

  function onBlur() {
    reportViolation.mutate("WINDOW_BLUR");
  }

  async function handleStart() {
    setError(null);
    if (!isNative) {
      try {
        await containerRef.current?.requestFullscreen();
      } catch {
        setError("Your browser blocked fullscreen mode, which this proctored session requires. Please allow fullscreen and try again.");
        return;
      }
    }
    start.mutate();
  }

  useEffect(() => {
    if (phase !== "active") return;
    document.addEventListener("contextmenu", preventDefault);
    document.addEventListener("copy", preventDefault);
    document.addEventListener("paste", preventDefault);

    if (isNative) {
      import("@capacitor/app").then(({ App }) => {
        App.addListener("appStateChange", ({ isActive }) => {
          if (!isActive) reportViolation.mutate("TAB_SWITCH");
        }).then((handle) => {
          appStateListenerRef.current = handle;
        });
      });
    } else {
      document.addEventListener("fullscreenchange", onFullscreenChange);
      document.addEventListener("visibilitychange", onVisibilityChange);
      window.addEventListener("blur", onBlur);
    }

    return cleanupListeners;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (!taskId || !courseId) return <ErrorBanner error="Missing task." />;
  if (course.isLoading) return <Spinner label="Loading session…" />;
  if (course.isError) return <ErrorBanner error={course.error} />;

  return (
    <div ref={containerRef} className="flex flex-col gap-6 bg-surface-muted p-2">
      <PageHeader title={task?.title ?? "Live Proctored Session"} description="Stay in fullscreen and on this tab for the whole session." />

      <Card className="border-pending/40 bg-pending/5">
        <p className="text-caption text-text-muted">
          <strong>What this actually checks:</strong> whether you leave fullscreen, switch tabs/apps, or lose window focus. It flags
          those events — it does <strong>not</strong> detect a second device (e.g. a phone) being used alongside this session. Copy,
          paste, and right-click are disabled here as an additional deterrent, not a guarantee.
        </p>
      </Card>

      {phase === "intro" ? (
        <Card>
          {task?.instructions ? <p className="mb-4 text-body text-ink">{task.instructions}</p> : null}
          {error ? <InlineBanner text={typeof error === "string" ? error : "Could not start the session — please try again."} /> : null}
          <Button variant="primary" disabled={start.isPending} onClick={handleStart}>
            {start.isPending ? "Starting…" : isNative ? "Start session" : "Enter fullscreen & start session"}
          </Button>
        </Card>
      ) : null}

      {phase === "denied" ? (
        <Card className="border-rejected/40 bg-rejected/5">
          <InlineBanner text={typeof error === "string" ? error : "This session could not be started."} />
        </Card>
      ) : null}

      {phase === "active" ? (
        <Card>
          {warning ? <InlineBanner text={warning} /> : null}
          <p className="text-body text-ink">Session in progress — complete the live task, then end the session below.</p>
          <Button variant="primary" className="mt-4" disabled={complete.isPending} onClick={() => complete.mutate()}>
            {complete.isPending ? "Ending…" : "End session (mark complete)"}
          </Button>
        </Card>
      ) : null}

      {phase === "locked" ? (
        <Card className="border-rejected/40 bg-rejected/5">
          <h2 className="text-h2 text-rejected">Session locked</h2>
          <p className="mt-2 text-body text-ink">
            This session was locked after repeated violations. A mentor must grant you access before you can retry — check your
            notifications, or ask your department mentor.
          </p>
          <Button variant="secondary" className="mt-4" onClick={() => router.push(`/courses/detail?id=${courseId}`)}>
            Back to course
          </Button>
        </Card>
      ) : null}

      {phase === "completed" ? (
        <Card className="border-accent/40 bg-accent/5">
          <h2 className="text-h2 text-accent-deep">Session complete</h2>
          <Button variant="primary" className="mt-4" onClick={() => router.push(`/courses/detail?id=${courseId}`)}>
            Back to course
          </Button>
        </Card>
      ) : null}
    </div>
  );
}

function InlineBanner({ text }: { text: string }) {
  return <div className="mb-4 rounded-card border border-rejected/30 bg-rejected/5 px-4 py-3 text-body text-rejected">{text}</div>;
}
