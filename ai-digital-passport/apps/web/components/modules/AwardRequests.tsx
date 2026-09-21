"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Award, CheckCircle2, Clock, Send, Trophy, X, XCircle,
  Sparkles, ChevronRight, Users, Star, ShieldCheck,
} from "lucide-react";
import { awardsApi, type AwardCatalogEntry } from "../../lib/api";
import { ErrorBanner } from "../ui/ErrorBanner";
import { Spinner } from "../ui/Spinner";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7] transition-all";

const STATUS_LABEL = { NOMINATED: "Pending review", CONFIRMED: "Approved", DECLINED: "Declined" } as const;

const CARD_ACCENTS = [
  "from-[#1755A7] via-[#2563EB] to-[#38BDF8]",
  "from-[#F8C401] via-[#F59E0B] to-[#EA580C]",
  "from-emerald-400 via-teal-400 to-cyan-400",
  "from-[#1755A7] via-indigo-400 to-purple-400",
  "from-[#F8C401] via-amber-400 to-amber-600",
  "from-emerald-500 via-green-400 to-teal-400",
  "from-[#2563EB] via-blue-400 to-sky-400",
  "from-purple-500 via-violet-400 to-indigo-400",
];

const ICON_COLORS = [
  { bg: "from-[#1755A7]/15 to-[#2563EB]/10", text: "text-[#1755A7]" },
  { bg: "from-amber-400/20 to-orange-400/15",  text: "text-amber-600" },
  { bg: "from-emerald-400/20 to-teal-400/15",  text: "text-emerald-600" },
  { bg: "from-indigo-400/20 to-purple-400/15", text: "text-indigo-600" },
  { bg: "from-amber-400/20 to-amber-600/15",   text: "text-amber-700" },
  { bg: "from-emerald-500/20 to-green-400/15", text: "text-emerald-700" },
  { bg: "from-blue-400/20 to-sky-400/15",      text: "text-blue-600" },
  { bg: "from-purple-500/20 to-violet-400/15", text: "text-purple-600" },
];

export function AwardRequests({ isStaff }: { isStaff: boolean }) {
  const queryClient = useQueryClient();
  const awards = useQuery({ queryKey: ["awards"], queryFn: awardsApi.list });
  const [active, setActive] = useState<AwardCatalogEntry | null>(null);
  const [reason, setReason] = useState("");
  const [nomineeEmail, setNomineeEmail] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: () =>
      awardsApi.request({ awardId: active!.awardId, reason, nomineeEmail: nomineeEmail.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["awards"] });
      setNotice("Request for " + active?.name + " submitted. The admin will review it.");
      close();
    },
  });

  function close() {
    setActive(null);
    setReason("");
    setNomineeEmail("");
    submit.reset();
  }

  const needsNominee = !!active && active.audience === "STAFF" && !isStaff;

  return (
    <div className="space-y-5">
      {notice && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          {notice}
        </div>
      )}

      {awards.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner label="Loading awards catalogue..." />
        </div>
      ) : awards.isError ? (
        <ErrorBanner error={awards.error} />
      ) : (
        <>
          {/* Section label */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#F8C401]" />
                Award Catalogue
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {(awards.data ?? []).length} awards available - select one to request or nominate
              </p>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {(awards.data ?? []).filter((a) => a.myRequests.some((r) => r.status === "CONFIRMED")).length} Earned
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(awards.data ?? []).map((a, idx) => {
              const latest = a.myRequests[0];
              const pending = a.myRequests.some((r) => r.status === "NOMINATED");
              const confirmed = a.myRequests.some((r) => r.status === "CONFIRMED");
              const declined = latest?.status === "DECLINED";
              const accent = CARD_ACCENTS[idx % CARD_ACCENTS.length];
              const iconStyle = ICON_COLORS[idx % ICON_COLORS.length]!;
              const isStaffAward = a.audience === "STAFF";

              return (
                <div
                  key={a.awardId}
                  className={"relative overflow-hidden flex flex-col justify-between rounded-2xl border bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm transition-all " +
                    (confirmed
                      ? "border-emerald-300/60 shadow-emerald-100"
                      : "border-slate-200/90 hover:border-[#1755A7]/40 hover:shadow-md")}
                >
                  {/* Top accent bar */}
                  <div className={"absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r " + accent} />

                  {/* Confirmed ribbon */}
                  {confirmed && (
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                        <ShieldCheck className="h-2.5 w-2.5" /> Earned
                      </span>
                    </div>
                  )}

                  <div className="space-y-3 mt-1">
                    {/* Icon + order + audience */}
                    <div className="flex items-center justify-between">
                      <div className={"flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br " + iconStyle.bg}>
                        {isStaffAward
                          ? <Users className={"h-5 w-5 " + iconStyle.text} />
                          : <Trophy className={"h-5 w-5 " + iconStyle.text} />}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-500">
                          #{a.order}
                        </span>
                        {isStaffAward && (
                          <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold text-[#1755A7]">
                            Mentor Award
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Name & description */}
                    <div>
                      <h3 className="text-sm font-black text-slate-900 leading-tight">{a.name}</h3>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{a.description}</p>
                    </div>

                    {/* Status chip */}
                    {latest && (
                      <div className={"inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold " +
                        (latest.status === "CONFIRMED"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : latest.status === "DECLINED"
                          ? "border-red-200 bg-red-50 text-red-700"
                          : "border-amber-200 bg-amber-50 text-amber-700")}>
                        {latest.status === "CONFIRMED"
                          ? <CheckCircle2 className="h-3.5 w-3.5" />
                          : latest.status === "DECLINED"
                          ? <XCircle className="h-3.5 w-3.5" />
                          : <Clock className="h-3.5 w-3.5" />}
                        <span>
                          {STATUS_LABEL[latest.status]}
                          {latest.adminNote ? ": " + latest.adminNote : ""}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    type="button"
                    disabled={pending || confirmed}
                    onClick={() => setActive(a)}
                    className={"mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all active:scale-95 " +
                      (confirmed
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                        : pending
                        ? "bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed opacity-70"
                        : declined
                        ? "bg-gradient-to-r from-[#1755A7] to-[#2563EB] text-white shadow-sm hover:from-[#103E7E] hover:to-[#1D4ED8]"
                        : "bg-[#1755A7] text-white shadow-sm hover:bg-[#103E7E]")}
                  >
                    {confirmed ? (
                      <><ShieldCheck className="h-3.5 w-3.5" /> Already Earned</>
                    ) : pending ? (
                      <><Clock className="h-3.5 w-3.5" /> Request Pending</>
                    ) : isStaffAward && !isStaff ? (
                      <><Users className="h-3.5 w-3.5" /> Nominate a Mentor <ChevronRight className="h-3.5 w-3.5" /></>
                    ) : (
                      <><Award className="h-3.5 w-3.5" /> Request This Award <ChevronRight className="h-3.5 w-3.5" /></>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Request Modal */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form
            className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl border border-slate-200"
            onSubmit={(e) => { e.preventDefault(); submit.mutate(); }}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1755A7]/15 to-[#2563EB]/10 text-[#1755A7]">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Request Award</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{active.name}</p>
                </div>
              </div>
              <button type="button" onClick={close} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all">
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
              <label className="text-xs font-bold text-slate-700">
                {needsNominee ? "Mentor's email *" : "Nominate someone else (optional)"}
              </label>
              <input
                type="email"
                required={needsNominee}
                value={nomineeEmail}
                onChange={(e) => setNomineeEmail(e.target.value)}
                placeholder={needsNominee ? "mentor@college.edu" : "Leave empty to request for yourself"}
                className={inputClass}
              />
            </div>

            {submit.error ? <ErrorBanner error={submit.error} /> : null}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={close}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submit.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1755A7] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#103E7E] disabled:opacity-50 transition-all"
              >
                <Send className="h-3.5 w-3.5" />
                {submit.isPending ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
