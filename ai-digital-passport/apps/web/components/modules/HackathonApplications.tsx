"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Users } from "lucide-react";
import { externalHackathonsApi } from "../../lib/api";
import { ErrorBanner } from "../ui/ErrorBanner";
import { Spinner } from "../ui/Spinner";

const STATUS_STYLE: Record<string, string> = {
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
};

export function HackathonApplications({ queueHref }: { queueHref?: string }) {
  const rows = useQuery({ queryKey: ["hackathons", "applications"], queryFn: externalHackathonsApi.applications });
  const [open, setOpen] = useState<string | null>(null);

  if (rows.isLoading) return <div className="flex h-48 items-center justify-center"><Spinner label="Loading applications..." /></div>;
  if (rows.isError) return <ErrorBanner error={rows.error} />;
  const data = rows.data ?? [];
  const totalApplied = data.reduce((n, r) => n + r.total, 0);
  const totalPending = data.reduce((n, r) => n + r.pending, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Total applications" value={totalApplied} />
        <Stat label="Awaiting mentor verification" value={totalPending} />
        <Stat label="Hackathons with applicants" value={data.filter((r) => r.total > 0).length} />
      </div>
      {queueHref && totalPending > 0 && (
        <Link href={queueHref} className="inline-flex text-xs font-bold text-[#1755A7] hover:underline">
          Verify pending proofs in the review queue →
        </Link>
      )}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[560px] text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3">Hackathon</th>
              <th className="px-5 py-3 text-center">Applied</th>
              <th className="px-5 py-3 text-center">Verified</th>
              <th className="px-5 py-3 text-center">Pending</th>
              <th className="px-5 py-3 text-center">Rejected</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">No hackathons yet.</td></tr>
            )}
            {data.map((r) => (
              <Fragment key={r.externalId}>
                <tr className="cursor-pointer hover:bg-slate-50/60" onClick={() => setOpen(open === r.externalId ? null : r.externalId)}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      {open === r.externalId ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                      {r.title}
                    </div>
                    {r.organizer && <div className="ml-6 text-[11px] text-slate-500">{r.organizer}</div>}
                  </td>
                  <td className="px-5 py-3 text-center font-black text-slate-900"><Users className="mr-1 inline h-3.5 w-3.5 text-slate-400" />{r.total}</td>
                  <td className="px-5 py-3 text-center font-bold text-emerald-600">{r.approved}</td>
                  <td className="px-5 py-3 text-center font-bold text-amber-600">{r.pending}</td>
                  <td className="px-5 py-3 text-center font-bold text-rose-600">{r.rejected}</td>
                </tr>
                {open === r.externalId && (
                  <tr>
                    <td colSpan={5} className="bg-slate-50/60 px-3 py-3 sm:px-5"><div className="overflow-x-auto">
                      {r.applicants.length === 0 ? (
                        <p className="text-slate-500">No students have applied yet.</p>
                      ) : (
                        <table className="w-full min-w-[420px] text-left text-xs">
                          <thead className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            <tr><th className="py-1.5">Student</th><th>Applied</th><th>Status</th><th className="text-right">Points</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {r.applicants.map((a) => (
                              <tr key={a.registrationId}>
                                <td className="py-2"><div className="font-semibold text-slate-800">{a.studentName}</div><div className="text-[11px] text-slate-500">{a.studentEmail}</div></td>
                                <td className="text-slate-600">{new Date(a.appliedAt).toLocaleDateString()}</td>
                                <td><span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[a.status] ?? ""}`}>{a.status === "APPROVED" ? "VERIFIED" : a.status}</span>{a.feedback && <span className="ml-2 text-slate-500">{a.feedback}</span>}</td>
                                <td className="text-right font-bold text-slate-800">{a.status === "APPROVED" ? `+${a.pointsAwarded}` : "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div></td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-black text-slate-900">{value}</div>
    </div>
  );
}
