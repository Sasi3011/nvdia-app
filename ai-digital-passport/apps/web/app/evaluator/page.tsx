"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StudentShell } from "../../components/shell/StudentShell";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { PageHeader } from "../../components/ui/PageHeader";
import { Spinner } from "../../components/ui/Spinner";
import { adminProgramApi, hackathonsApi } from "../../lib/api";

export default function EvaluatorPage() {
  const hackathons = useQuery({ queryKey: ["hackathons"], queryFn: hackathonsApi.list });
  const submissions = (hackathons.data ?? []).flatMap((h) => h.submissions.map((s) => ({ ...s, hackathonTitle: h.title })));

  return (
    <StudentShell>
      <PageHeader title="Evaluator / Jury" description="Score hackathon submissions using a rubric." />
      {hackathons.isLoading ? (
        <Spinner />
      ) : hackathons.isError ? (
        <ErrorBanner error={hackathons.error} />
      ) : submissions.length === 0 ? (
        <p className="text-body text-text-muted">No submissions available for evaluation yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
          {submissions.map((submission) => (
            <EvaluationCard key={submission.submission_id} submission={submission} />
          ))}
        </div>
      )}
    </StudentShell>
  );
}

function EvaluationCard({ submission }: { submission: { submission_id: string; title: string; hackathonTitle: string; evaluations: { total_score: number }[] } }) {
  const queryClient = useQueryClient();
  const [score, setScore] = useState(7);
  const [comments, setComments] = useState("");
  const evaluate = useMutation({
    mutationFn: () =>
      adminProgramApi.evaluateHackathon(submission.submission_id, {
        innovation: score,
        technical: score,
        impact: score,
        presentation: score,
        completeness: score,
        comments,
      }),
    onSuccess: () => {
      setComments("");
      queryClient.invalidateQueries({ queryKey: ["hackathons"] });
    },
  });

  return (
    <Card>
      <h2 className="text-h2 text-ink">{submission.title}</h2>
      <p className="text-caption text-text-muted">{submission.hackathonTitle} · {submission.evaluations.length} evaluation(s)</p>
      <form
        className="mt-4 flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          evaluate.mutate();
        }}
      >
        {evaluate.isError ? <ErrorBanner error={evaluate.error} /> : null}
        <label className="flex flex-col gap-1">
          <span className="text-caption text-text-muted">Score for all rubric dimensions</span>
          <input type="number" min={0} max={10} value={score} onChange={(e) => setScore(Number(e.target.value))} className="rounded-card border border-border px-3 py-2 text-body" />
        </label>
        <textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Evaluation comments" className="rounded-card border border-border px-3 py-2 text-body" />
        <Button type="submit" variant="primary" disabled={evaluate.isPending}>
          Submit score
        </Button>
      </form>
    </Card>
  );
}
