"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { Button } from "../../../components/ui/Button";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { LevelBadge } from "../../../components/ui/LevelBadge";
import { adminScoringApi, type AdminScoringRuleResponse, type LevelResponse } from "../../../lib/api";
import { Calculator, Award, Pencil, Plus, Save } from "lucide-react";

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

  const [newLabel, setNewLabel] = useState("");
  const [newPoints, setNewPoints] = useState(20);
  const add = useMutation({
    mutationFn: () => {
      const key = newLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      return adminScoringApi.upsertRule(key, { label: newLabel.trim(), points: newPoints });
    },
    onSuccess: () => {
      setNewLabel("");
      setNewPoints(20);
      queryClient.invalidateQueries({ queryKey: ["admin", "scoring", "rules"] });
    },
  });

  if (rules.isLoading) return <Spinner label="Loading scoring matrix..." />;
  if (rules.isError) return <ErrorBanner error={rules.error} />;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
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

      <form
        className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          add.mutate();
        }}
      >
        <div className="flex w-full flex-1 flex-col gap-1 sm:min-w-[220px] sm:w-auto">
          <label className="text-[11px] font-bold text-slate-600">New activity / category name</label>
          <input
            required
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="e.g. CoE Class Attendance"
            className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-[#1755A7] focus:outline-none"
          />
        </div>
        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label className="text-[11px] font-bold text-slate-600">Points</label>
          <input type="number" min={0} required value={newPoints} onChange={(e) => setNewPoints(Number(e.target.value))} className={`${inputClass} min-h-10 w-full sm:w-24`} />
        </div>
        <button
          type="submit"
          disabled={add.isPending || !newLabel.trim() || !/[a-z0-9]/i.test(newLabel)}
          className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-[#1755A7] px-4 py-2 text-xs font-bold text-white hover:bg-[#124282] disabled:opacity-50 sm:w-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Category
        </button>
      </form>
      {add.isError ? <div className="mt-3"><ErrorBanner error={add.error} /></div> : null}
      <p className="mt-3 text-[11px] text-slate-500">
        These values drive every page: QR class check-ins, hackathon registrations, courses and claims all read their points from here.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-xs">
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
                      min={0}
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
  const [editingId, setEditingId] = useState<number | null>(null);

  const save = useMutation({
    mutationFn: (level: LevelResponse) =>
      adminScoringApi.updateLevel(level.levelId, {
        minPoints: edits[level.levelId]?.minPoints ?? level.minPoints,
        unlockedPrivilege: edits[level.levelId]?.unlockedPrivilege ?? level.unlockedPrivilege,
      }),
    onSuccess: () => {
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "scoring", "levels"] });
    },
  });

  if (levels.isLoading) return <Spinner label="Loading tier thresholds..." />;
  if (levels.isError) return <ErrorBanner error={levels.error} />;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
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
              <th className="px-4 py-3 text-right rounded-r-lg">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[...(levels.data ?? [])]
              .sort((a, b) => a.levelId - b.levelId)
              .map((l) => {
                const edit = edits[l.levelId] ?? { minPoints: l.minPoints, unlockedPrivilege: l.unlockedPrivilege };
                return (
                  <tr key={l.levelId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <LevelBadge levelId={l.levelId} size={52} />
                        <span className="font-bold text-slate-900">{l.levelName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {editingId === l.levelId ? (
                        <input
                          type="number"
                          min={0}
                          value={edit.minPoints}
                          onChange={(e) => setEdits((prev) => ({ ...prev, [l.levelId]: { ...edit, minPoints: Number(e.target.value) } }))}
                          className={inputClass}
                        />
                      ) : (
                        <span className="font-semibold text-slate-800">{l.minPoints}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          title="Edit"
                          aria-label={`Edit ${l.levelName}`}
                          onClick={() => setEditingId(l.levelId)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#1755A7] hover:bg-slate-50 transition-colors sm:h-8 sm:w-8"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Save"
                          aria-label={`Save ${l.levelName}`}
                          disabled={save.isPending || editingId !== l.levelId}
                          onClick={() => save.mutate(l)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#1755A7] text-white hover:bg-[#124282] transition-colors disabled:opacity-40 sm:h-8 sm:w-8"
                        >
                          <Save className="h-3.5 w-3.5" />
                        </button>
                      </div>
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
