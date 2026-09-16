"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { Button } from "../../../components/ui/Button";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { adminScoringApi, type AdminScoringRuleResponse, type LevelResponse } from "../../../lib/api";
import { Calculator, Award, Save, Sparkles } from "lucide-react";

const inputClass = "w-24 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono text-slate-900 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7]";

export default function AdminScoringPage() {
  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader 
        title="Scoring Matrix & Tier Configuration" 
        description="Data-driven point allocations, level requirements, and compute privilege unlocks." 
      />
      <div className="flex flex-col gap-8 mt-6">
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

  if (rules.isLoading) return <Spinner label="Loading scoring matrix..." />;
  if (rules.isError) return <ErrorBanner error={rules.error} />;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="h-4.5 w-4.5 text-[#1755A7]" />
            Learning Pillar Scoring Matrix
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure automated points per verified credential or submission
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 rounded-l-lg">Category Key</th>
              <th className="px-4 py-3">Display Label</th>
              <th className="px-4 py-3">Points Awarded</th>
              <th className="px-4 py-3 text-right rounded-r-lg">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(rules.data ?? []).map((r) => {
              const edit = edits[r.category] ?? { label: r.label, points: r.points };
              return (
                <tr key={r.category} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-500 font-semibold">{r.category}</td>
                  <td className="px-4 py-3">
                    <input
                      value={edit.label}
                      onChange={(e) => setEdits((prev) => ({ ...prev, [r.category]: { ...edit, label: e.target.value } }))}
                      className="w-full max-w-sm rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={edit.points}
                      onChange={(e) => setEdits((prev) => ({ ...prev, [r.category]: { ...edit, points: Number(e.target.value) } }))}
                      className={inputClass}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={save.isPending}
                      onClick={() => save.mutate(r)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1755A7] via-[#1A5EB7] to-[#2563EB] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:from-[#124282] hover:to-[#1D4ED8] transition-all disabled:opacity-50 active:scale-95"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Save
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {save.isError ? <div className="mt-3"><ErrorBanner error={save.error} /></div> : null}
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

  if (levels.isLoading) return <Spinner label="Loading tier thresholds..." />;
  if (levels.isError) return <ErrorBanner error={levels.error} />;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Award className="h-4.5 w-4.5 text-[#F8C401]" />
            Competency Levels & Unlocked Privileges
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Set required points and GPU compute / research privileges unlocked per tier
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 rounded-l-lg">Tier</th>
              <th className="px-4 py-3">Min Points</th>
              <th className="px-4 py-3">Privileges & Supercomputing Quota</th>
              <th className="px-4 py-3 text-center">High Impact?</th>
              <th className="px-4 py-3 text-right rounded-r-lg">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(levels.data ?? [])
              .sort((a, b) => a.levelId - b.levelId)
              .map((l) => {
                const edit = edits[l.levelId] ?? { minPoints: l.minPoints, unlockedPrivilege: l.unlockedPrivilege };
                return (
                  <tr key={l.levelId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#1755A7]/10 font-mono font-bold text-[#1755A7]">
                          L{l.levelId}
                        </span>
                        <span className="font-bold text-slate-900">{l.levelName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={edit.minPoints}
                        onChange={(e) => setEdits((prev) => ({ ...prev, [l.levelId]: { ...edit, minPoints: Number(e.target.value) } }))}
                        className={inputClass}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={edit.unlockedPrivilege}
                        onChange={(e) => setEdits((prev) => ({ ...prev, [l.levelId]: { ...edit, unlockedPrivilege: e.target.value } }))}
                        className="w-full max-w-md rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7]"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {l.requiresHighImpact ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          <Sparkles className="h-3 w-3 text-amber-600" /> Yes (Fellowship)
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={save.isPending}
                        onClick={() => save.mutate(l)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#1755A7] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#124282] transition-colors disabled:opacity-50"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Save
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      {save.isError ? <div className="mt-3"><ErrorBanner error={save.error} /></div> : null}
    </div>
  );
}
