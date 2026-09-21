"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { awardsApi, type AdminAwardRequest } from "../../lib/api";
import { ErrorBanner } from "../ui/ErrorBanner";
import { Spinner } from "../ui/Spinner";

const STATUS = {
  NOMINATED: { label: "Pending", cls: "border-amber-200 bg-amber-50 text-amber-700", icon: Clock },
  CONFIRMED: { label: "Approved / Winner", cls: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  DECLINED: { label: "Declined", cls: "border-red-200 bg-red-50 text-red-700", icon: XCircle },
} as const;

export function AdminAwardRequests() {
  const queryClient = useQueryClient();
  const requests = useQuery({ queryKey: ["admin", "award-requests"], queryFn: awardsApi.adminRequests });
  const [filter, setFilter] = useState<string>("ALL");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const review = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "CONFIRMED" | "DECLINED" }) =>
      awardsApi.adminReview(id, status, notes[id]?.trim() || undefined),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "award-requests"] }),
  });

  const rows = requests.data ?? [];
  const awardNames = ["ALL", ...Array.from(new Set(rows.map((r) => r.awardName)))];
  const shown = rows.filter((r) => filter === "ALL" || r.awardName === filter);

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-black text-slate-900">Award Requests Queue</h2>
          <p className="text-xs text-slate-500 mt-0.5">Review nominations from students and staff</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1755A7]/20 sm:w-auto"
        >
          {awardNames.map((n) => (
            <option key={n} value={n}>
              {n === "ALL" ? "All awards" : n}
            </option>
          ))}
        </select>
      </div>

      {review.error ? <div className="mt-3"><ErrorBanner error={review.error} /></div> : null}

      {requests.isLoading ? (
        <div className="py-8"><Spinner label="Loading requests..." /></div>
      ) : requests.isError ? (
        <div className="mt-3"><ErrorBanner error={requests.error} /></div>
      ) : shown.length === 0 ? (
        <p className="py-8 text-center text-xs font-semibold text-slate-400">No award requests yet.</p>
      ) : (
        <div className="mt-4 divide-y divide-slate-100">
          {shown.map((r: AdminAwardRequest) => {
            const st = STATUS[r.status];
            const Icon = st.icon;
            const self = r.requester.userId === r.nominee.userId;
            return (
              <div key={r.nominationId} className="flex flex-col gap-3 py-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-black text-slate-900">{r.awardName}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${st.cls}`}>
                      <Icon className="h-3 w-3" /> {st.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {self ? (
                      <>Requested by <b>{r.requester.fullName}</b> ({r.requester.email})</>
                    ) : (
                      <>Nominee <b>{r.nominee.fullName}</b> ({r.nominee.email}), nominated by <b>{r.requester.fullName}</b></>
                    )}
                  </p>
                  {r.reason && <p className="whitespace-pre-wrap text-xs text-slate-500">{r.reason}</p>}
                  {r.adminNote && <p className="text-[11px] font-semibold text-slate-500">Note: {r.adminNote}</p>}
                </div>
                {r.status === "NOMINATED" && (
                  <div className="flex shrink-0 flex-col gap-2 lg:w-64">
                    <input
                      placeholder="Optional note"
                      value={notes[r.nominationId] ?? ""}
                      onChange={(e) => setNotes((n) => ({ ...n, [r.nominationId]: e.target.value }))}
                      className="h-10 rounded-xl border border-slate-200 px-3 text-xs"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={review.isPending}
                        onClick={() => review.mutate({ id: r.nominationId, status: "CONFIRMED" })}
                        className="flex-1 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                      >
                        Approve / Winner
                      </button>
                      <button
                        type="button"
                        disabled={review.isPending}
                        onClick={() => review.mutate({ id: r.nominationId, status: "DECLINED" })}
                        className="flex-1 rounded-xl border border-red-200 px-3 py-2.5 text-xs font-bold text-red-600 disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
