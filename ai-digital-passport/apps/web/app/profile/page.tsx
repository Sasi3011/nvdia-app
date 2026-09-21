"use client";

import { useEffect, useState } from "react";
import { departmentOptions } from "../../lib/departments";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { StudentShell } from "../../components/shell/StudentShell";
import { Spinner } from "../../components/ui/Spinner";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { meApi } from "../../lib/api";
import { useMe } from "../../lib/session";
import { 
  User, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  Save, 
  Mail, 
  Hash, 
  GraduationCap, 
  Building2,
  Calendar,
  Award
} from "lucide-react";

export default function ProfilePage() {
  const me = useMe(true);
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [cohortYear, setCohortYear] = useState(2026);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (me.data) {
      setFullName(me.data.fullName);
      setDepartment(me.data.department);
      setCohortYear(me.data.cohortYear);
    }
  }, [me.data]);

  const update = useMutation({
    mutationFn: () => meApi.update({ fullName, department, cohortYear }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  if (me.isLoading) {
    return (
      <StudentShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner label="Loading scholar profile…" />
        </div>
      </StudentShell>
    );
  }

  if (!me.data) return null;

  return (
    <StudentShell>
      <div className="space-y-6 max-w-4xl">
        
        {/* Top Header Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 lg:p-8 shadow-xs">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-gradient-to-br from-[#1755A7]/10 to-[#F8C401]/15 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#1755A7] text-white text-2xl font-black shadow-md">
                {fullName ? fullName.charAt(0) : "S"}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-slate-900">{fullName || "Student Scholar"}</h1>
                  <span className="rounded-full bg-[#1755A7]/10 px-2.5 py-0.5 text-xs font-bold text-[#1755A7]">
                    Level {me.data.level.levelId}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  {me.data.registerNum} · {me.data.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-xs">
              <Sparkles className="h-4 w-4 text-[#F8C401]" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Points</span>
                <span className="font-mono font-black text-[#1755A7]">{me.data.totalPoints.toLocaleString()} pts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 lg:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900">Scholar Profile & Academic Identity</h2>
              <p className="text-xs text-slate-500">Essential institutional credentials and identity details</p>
            </div>
            {saveSuccess && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Profile Updated!
              </span>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              update.mutate();
            }}
            className="space-y-5"
          >
            {update.isError && <ErrorBanner error={update.error} />}

            {/* Read-Only Keys */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Institutional Email ID</span>
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Read-Only
                  </span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    disabled
                    value={me.data.email}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-600 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>SECE Register / Roll Number</span>
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Read-Only
                  </span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    disabled
                    value={me.data.registerNum}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-4 py-2.5 text-xs font-mono font-semibold text-slate-600 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">Full Name (as on Degree Certificate)</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-xs font-medium text-slate-900 focus:border-[#1755A7] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">Academic Department</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <CustomSelect
                      value={department}
                      onChange={setDepartment}
                      options={[
                        { label: "Select Department...", value: "" },
                        ...departmentOptions(department).map((d) => ({ label: d, value: d }))
                      ]}
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs font-medium text-slate-900 focus-within:border-[#1755A7]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">Graduation Cohort Year</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="number"
                      required
                      min={2020}
                      max={2032}
                      value={cohortYear}
                      onChange={(e) => setCohortYear(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-xs font-medium text-slate-900 focus:border-[#1755A7] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={update.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1755A7] px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#134486] disabled:opacity-50 active:scale-95"
              >
                <Save className="h-4 w-4" />
                {update.isPending ? "Saving Changes…" : "Save Profile"}
              </button>
            </div>
          </form>
        </div>

      </div>
    </StudentShell>
  );
}
