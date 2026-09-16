"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsoleCard } from "../../../components/console/ConsoleCard";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { Button } from "../../../components/ui/Button";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { adminScoringApi, type AdminScoringRuleResponse, type LevelResponse } from "../../../lib/api";

const inputClass = "w-24 rounded-card border border-border bg-surface px-2 py-1 text-body text-ink";

// Page 28 — Scoring & Level Configuration (spec 02 Section 6.4). Changing
// these is itself an auditable admin action (Section 17). Level 6's
// "High Impact" condition has no numeric rule (open decision #1) — it's
// exposed here as the requiresHighImpact toggle, not a guessed number.
export default function AdminScoringPage() {
  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader title="Scoring & Level Configuration" description="Data-driven — no redeploy needed to change these." />
      <div className="flex flex-col gap-8">
        <ScoringRulesTable />
        <LevelsTable />
      </div>
    </ConsoleShell>
  );
}

function ScoringRulesTable() {
  const queryClient = useQueryClient();
  const rules = useQuery({ queryKey: ["admin", "scoring", "rules"], queryFn: adminScoringApi.listRules });
  const [edits, setEdits] = useState<Record<string, { label: string; points: number }>>({});

  const save = useMutation({
    mutationFn: (rule: AdminScoringRuleResponse) =>
      adminScoringApi.upsertRule(rule.category, {
        label: edits[rule.category]?.label ?? rule.label,
        points: edits[rule.category]?.points ?? rule.points,
        maxClaimsPerUser: rule.maxClaimsPerUser,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "scoring", "rules"] }),
  });

  if (rules.isLoading) return <Spinner />;
  if (rules.isError) return <ErrorBanner error={rules.error} />;

  return (
    <div>
      <h2 className="mb-3 text-h2 text-ink">Scoring matrix</h2>
      <ConsoleCard className="overflow-x-auto p-0">
        <table className="w-full text-left">
          <thead className="border-b border-navy-700 text-caption text-text-muted">
            <tr>
              <th className="px-6 py-3 font-normal">Category</th>
              <th className="px-6 py-3 font-normal">Label</th>
              <th className="px-6 py-3 font-normal">Points</th>
              <th className="px-6 py-3 font-normal"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-700">
            {(rules.data ?? []).map((r) => {
              const edit = edits[r.category] ?? { label: r.label, points: r.points };
              return (
                <tr key={r.category}>
                  <td className="px-6 py-3 font-mono text-caption text-text-muted">{r.category}</td>
                  <td className="px-6 py-3">
                    <input
                      value={edit.label}
                      onChange={(e) => setEdits((prev) => ({ ...prev, [r.category]: { ...edit, label: e.target.value } }))}
                      className={inputClass + " w-64"}
                    />
                  </td>
                  <td className="px-6 py-3">
                    <input
                      type="number"
                      value={edit.points}
                      onChange={(e) => setEdits((prev) => ({ ...prev, [r.category]: { ...edit, points: Number(e.target.value) } }))}
                      className={inputClass}
                    />
                  </td>
                  <td className="px-6 py-3">
                    <Button variant="secondary" disabled={save.isPending} onClick={() => save.mutate(r)}>
                      Save
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ConsoleCard>
      {save.isError ? <div className="mt-2"><ErrorBanner error={save.error} /></div> : null}
    </div>
  );
}

function LevelsTable() {
  const queryClient = useQueryClient();
  const levels = useQuery({ queryKey: ["admin", "scoring", "levels"], queryFn: adminScoringApi.listLevels });
  const [edits, setEdits] = useState<Record<number, { minPoints: number; unlockedPrivilege: string }>>({});

  const save = useMutation({
    mutationFn: (level: LevelResponse) =>
      adminScoringApi.updateLevel(level.levelId, {
        minPoints: edits[level.levelId]?.minPoints ?? level.minPoints,
        unlockedPrivilege: edits[level.levelId]?.unlockedPrivilege ?? level.unlockedPrivilege,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "scoring", "levels"] }),
  });

  if (levels.isLoading) return <Spinner />;
  if (levels.isError) return <ErrorBanner error={levels.error} />;

  return (
    <div>
      <h2 className="mb-3 text-h2 text-ink">Levels</h2>
      <ConsoleCard className="overflow-x-auto p-0">
        <table className="w-full text-left">
          <thead className="border-b border-navy-700 text-caption text-text-muted">
            <tr>
              <th className="px-6 py-3 font-normal">Level</th>
              <th className="px-6 py-3 font-normal">Min points</th>
              <th className="px-6 py-3 font-normal">Privilege</th>
              <th className="px-6 py-3 font-normal">High Impact?</th>
              <th className="px-6 py-3 font-normal"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-700">
            {(levels.data ?? [])
              .sort((a, b) => a.levelId - b.levelId)
              .map((l) => {
                const edit = edits[l.levelId] ?? { minPoints: l.minPoints, unlockedPrivilege: l.unlockedPrivilege };
                return (
                  <tr key={l.levelId}>
                    <td className="px-6 py-3 text-body text-ink">
                      {l.levelId} — {l.levelName}
                    </td>
                    <td className="px-6 py-3">
                      <input
                        type="number"
                        value={edit.minPoints}
                        onChange={(e) => setEdits((prev) => ({ ...prev, [l.levelId]: { ...edit, minPoints: Number(e.target.value) } }))}
                        className={inputClass}
                      />
                    </td>
                    <td className="px-6 py-3">
                      <input
                        value={edit.unlockedPrivilege}
                        onChange={(e) => setEdits((prev) => ({ ...prev, [l.levelId]: { ...edit, unlockedPrivilege: e.target.value } }))}
                        className={inputClass + " w-56"}
                      />
                    </td>
                    <td className="px-6 py-3 font-mono text-caption text-text-muted">{l.requiresHighImpact ? "Yes" : "No"}</td>
                    <td className="px-6 py-3">
                      <Button variant="secondary" disabled={save.isPending} onClick={() => save.mutate(l)}>
                        Save
                      </Button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </ConsoleCard>
      <p className="mt-2 text-caption text-text-muted">
        Level 6&apos;s &quot;High Impact&quot; condition has no numeric rule in the source spec — it&apos;s enforced per-student via
        the high-impact flag on the Users page, not editable here.
      </p>
    </div>
  );
}
