"use client";

import { StudentShell } from "../../components/shell/StudentShell";
import { AwardRequests } from "../../components/modules/AwardRequests";
import { Award, ShieldCheck, Trophy, TrendingUp } from "lucide-react";

export default function AwardsPage() {
  return (
    <StudentShell>
      <div className="flex flex-col gap-5 animate-in fade-in duration-300">

        {/* Page Header */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-6 shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#1755A7] via-[#F8C401] to-[#10B981]" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F8C401] to-[#F59E0B] text-white shadow-md shadow-amber-400/25">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">Awards and Credentials</h1>
                <p className="mt-0.5 text-xs text-slate-500">
                  Request an award for yourself, or nominate a mentor. Every request is reviewed by the admin team.
                </p>
              </div>
            </div>
          </div>

          {/* KPI strip */}
          <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-semibold">Available Awards</p>
                <p className="text-base font-black text-slate-900">Catalogue</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-semibold">Cryptographic Proof</p>
                <p className="text-base font-black text-emerald-700">Verified</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-semibold">Admin Reviewed</p>
                <p className="text-base font-black text-amber-700">Every Request</p>
              </div>
            </div>
          </div>
        </div>

        <AwardRequests isStaff={false} />
      </div>
    </StudentShell>
  );
}
