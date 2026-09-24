"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, CheckCircle2, ChevronRight, Clock, Inbox, Send, ShieldCheck, TrendingUp, Trophy, Users, X, XCircle } from "lucide-react";
import { awardsApi, type AwardCatalogEntry } from "../../lib/api";
import { ConsolePageHeader } from "../console/ConsolePageHeader";
import { AwardBadge } from "../ui/AwardBadge";
import { ErrorBanner } from "../ui/ErrorBanner";
import { Spinner } from "../ui/Spinner";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7] transition-all";

// Same labels/colours as the admin Award Requests Queue.
const STATUS = {
  NOMINATED: { label: "Pending", cls: "border-amber-200 bg-amber-50 text-amber-700", icon: Clock },
  CONFIRMED: { label: "Approved / Winner", cls: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  DECLINED: { label: "Declined", cls: "border-red-200 bg-red-50 text-red-700", icon: XCircle },
} as const;

type MyRequest = AwardCatalogEntry["myRequests"][number] & { awardId: string; awardName: string };

/**
 * The Awards page for students and faculty, laid out like the admin Awards
 * page: KPI cards, the award catalogue, and a requests list — showing the
 * viewer's own requests/nominations instead of the admin review queue.
 */
export function AwardRequests({ isStaff }: { isStaff: boolean }) {
  const queryClient = useQueryClient();
  const awards = useQuery({ queryKey: ["awards"], queryFn: awardsApi.list });
  const [active, setActive] = useState<AwardCatalogEntry | null>(null);
  const [reason, setReason] = useState("");
  const [nomineeEmail, setNomineeEmail] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState("ALL");

  const submit = useMutation({
    mutationFn: () => awardsApi.request({ awardId: active!.awardId, reason, nomineeEmail: nomineeEmail.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["awards"] });
      setNotice(`Request for ${active?.name} submitted. The admin will review it.`);
      close();
    },
  });

  function close() {
    setActive(null);
    setReason("");
    setNomineeEmail("");
    submit.reset();
  }

  const catalog = awards.data ?? [];
  const mine: MyRequest[] = catalog
    .flatMap((a) => a.myRequests.map((r) => ({ ...r, awardId: a.awardId, awardName: a.name })))
    .sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime());
  const pending = mine.filter((r) => r.status === "NOMINATED").length;
  const approved = mine.filter((r) => r.status === "CONFIRMED").length;
  const awardNames = ["ALL", ...Array.from(new Set(mine.map((r) => r.awardName)))];
  const shown = mine.filter((r) => filter === "ALL" || r.awardName === filter);
  const needsNominee = !!active && active.audience === "STAFF" && !isStaff;

  return (
    <>
      <ConsolePageHeader
        title="Awards"
        description={
          isStaff
            ? "Request an award, or nominate a student or fellow faculty member (by email). The admin reviews every request."
            : "Request an award for yourself, or nominate a faculty member. The admin reviews every request."
        }
      />

      {notice && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Awards Catalog"
          value={catalog.length}
          tag={<span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">Active Awards</span>}
          footLeft="Available to request"
          footRight={isStaff ? "Students & Faculty" : "All Students"}
          icon={<Trophy className="h-4 w-4" />}
          bar="from-[#1755A7] via-[#2563EB] to-[#38BDF8]"
          tone="from-[#1755A7]/15 to-[#2563EB]/10 text-[#1755A7]"
        />
        <Kpi
          label="My Requests"
          value={mine.length}
          valueClass="bg-gradient-to-r from-[#1755A7] to-[#2563EB] bg-clip-text text-transparent"
          tag={<span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-slate-500">Total</span>}
          footLeft="All time"
          footRight="Requests & Nominations"
          icon={<Inbox className="h-4 w-4 text-amber-600" />}
          bar="from-[#F8C401] via-[#F59E0B] to-[#EA580C]"
          tone="from-[#F8C401]/25 to-[#EA580C]/15"
          hover="hover:border-amber-400/40"
        />
        <Kpi
          label="Pending Review"
          value={pending}
          tag={<span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">With Admin</span>}
          footLeft="Status"
          footRight="Awaiting Approval"
          icon={<Clock className="h-4 w-4 text-indigo-600" />}
          bar="from-indigo-400 via-purple-400 to-pink-400"
          tone="from-indigo-400/20 to-purple-400/15"
          hover="hover:border-indigo-400/40"
        />
        <Kpi
          label="Awards Won"
          value={approved}
          valueClass="text-emerald-700"
          tag={<span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600"><TrendingUp className="h-3 w-3" /> Confirmed</span>}
          footLeft="Approved by"
          footRight="Admin"
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          bar="from-emerald-400 via-teal-400 to-cyan-400"
          tone="from-emerald-400/20 to-teal-400/15"
          hover="hover:border-emerald-400/40"
        />
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-black text-slate-900">
          <Trophy className="h-4 w-4 text-[#1755A7]" />
          Award Catalog
        </h2>
        <p className="mb-5 text-xs text-slate-500">Every active award. Request one for yourself or nominate someone.</p>

        {awards.isLoading ? (
          <div className="py-8"><Spinner label="Loading awards..." /></div>
        ) : awards.isError ? (
          <div className="mt-3"><ErrorBanner error={awards.error} /></div>
        ) : catalog.length === 0 ? (
          <p className="py-8 text-center text-xs font-semibold text-slate-400">No awards available yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {catalog.map((a) => {
              const isPending = a.myRequests.some((r) => r.status === "NOMINATED");
              const won = a.myRequests.some((r) => r.status === "CONFIRMED");
              const staffAward = a.audience === "STAFF";
              return (
                <div
                  key={a.awardId}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-white p-5 shadow-xs transition-all hover:shadow-md ${
                    won ? "border-emerald-300/70" : "border-slate-200 hover:border-[#1755A7]/40"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <AwardBadge awardId={a.awardId} name={a.name} size={52} />
                      {won ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                          <ShieldCheck className="h-3 w-3" /> Won
                        </span>
                      ) : isPending ? (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">Pending</span>
                      ) : staffAward ? (
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-[#1755A7]">Faculty Award</span>
                      ) : null}
                    </div>
                    <h3 className="mt-4 line-clamp-2 text-sm font-bold text-slate-900 transition-colors group-hover:text-[#1755A7]">{a.name}</h3>
                    {a.description && <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-slate-500">{a.description}</p>}
                  </div>
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <div className="mb-2.5 flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>My requests</span>
                      <span className="text-slate-800">{a.myRequests.length}</span>
                    </div>
                    <button
                      type="button"
                      disabled={isPending || won}
                      onClick={() => setActive(a)}
                      className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold transition-all active:scale-95 ${
                        won
                          ? "cursor-default border border-emerald-200 bg-emerald-50 text-emerald-700"
                          : isPending
                            ? "cursor-not-allowed border border-amber-200 bg-amber-50 text-amber-700"
                            : "bg-[#1755A7] text-white shadow-sm hover:bg-[#103E7E]"
                      }`}
                    >
                      {won ? (
                        <><ShieldCheck className="h-3.5 w-3.5" /> Already Won</>
                      ) : isPending ? (
                        <><Clock className="h-3.5 w-3.5" /> Request Pending</>
                      ) : staffAward && !isStaff ? (
                        <><Users className="h-3.5 w-3.5" /> Nominate Faculty <ChevronRight className="h-3.5 w-3.5" /></>
                      ) : (
                        <><Award className="h-3.5 w-3.5" /> Request Award <ChevronRight className="h-3.5 w-3.5" /></>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-sm font-black text-slate-900">My Award Requests</h2>
            <p className="mt-0.5 text-xs text-slate-500">Requests and nominations you submitted, and the admin&apos;s decision</p>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1755A7]/20 sm:w-auto"
          >
            {awardNames.map((n) => (
              <option key={n} value={n}>{n === "ALL" ? "All awards" : n}</option>
            ))}
          </select>
        </div>

        {awards.isLoading ? (
          <div className="py-8"><Spinner label="Loading requests..." /></div>
        ) : shown.length === 0 ? (
          <p className="py-8 text-center text-xs font-semibold text-slate-400">No award requests yet. Pick an award above to get started.</p>
        ) : (
          <div className="mt-4 divide-y divide-slate-100">
            {shown.map((r) => {
              const st = STATUS[r.status];
              const Icon = st.icon;
              return (
                <div key={r.nominationId} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-black text-slate-900">{r.awardName}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${st.cls}`}>
                        <Icon className="h-3 w-3" /> {st.label}
                      </span>
                    </div>
                    {r.reason && <p className="whitespace-pre-wrap text-xs text-slate-500">{r.reason}</p>}
                    {r.adminNote && <p className="text-[11px] font-semibold text-slate-500">Admin note: {r.adminNote}</p>}
                  </div>
                  <span className="shrink-0 text-[11px] font-medium text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <form
            className="w-full max-w-lg space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onSubmit={(e) => {
              e.preventDefault();
              submit.mutate();
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <AwardBadge awardId={active.awardId} name={active.name} size={40} />
                <div>
                  <h3 className="text-sm font-black text-slate-900">{needsNominee ? "Nominate Faculty" : "Request Award"}</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500">{active.name}</p>
                </div>
              </div>
              <button type="button" onClick={close} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="h-px bg-slate-100" />

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Why is this award deserved? *</label>
              <textarea
                required
                minLength={10}
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe the achievements and impact in detail..."
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">{needsNominee ? "Faculty member's email *" : "Nominate someone else (optional)"}</label>
              <input
                type="email"
                required={needsNominee}
                value={nomineeEmail}
                onChange={(e) => setNomineeEmail(e.target.value)}
                placeholder={needsNominee ? "faculty@sece.ac.in" : "Leave empty to request for yourself"}
                className={inputClass}
              />
            </div>

            {submit.error ? <ErrorBanner error={submit.error} /> : null}

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={close} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submit.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1755A7] px-5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#103E7E] disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {submit.isPending ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

// Same KPI card as the admin Awards page.
function Kpi({
  label, value, valueClass = "text-slate-900", tag, footLeft, footRight, icon, bar, tone, hover = "hover:border-[#1755A7]/40",
}: {
  label: string; value: number; valueClass?: string; tag: React.ReactNode; footLeft: string; footRight: string;
  icon: React.ReactNode; bar: string; tone: string; hover?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm transition-all hover:shadow-md ${hover}`}>
      <div className={`absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${bar}`} />
      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${tone}`}>{icon}</div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className={`text-3xl font-black tracking-tight ${valueClass}`}>{value}</span>
        {tag}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
        <span>{footLeft}</span>
        <span className="font-bold text-slate-800">{footRight}</span>
      </div>
    </div>
  );
}
