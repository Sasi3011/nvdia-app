"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, ChevronRight, ExternalLink, Medal, Search, Trophy, Users, X } from "lucide-react";
import { externalHackathonsApi, mentorApi, type HackathonApplicationsRow, type HackathonProofInfo } from "../../lib/api";
import { ErrorBanner } from "../ui/ErrorBanner";
import { Spinner } from "../ui/Spinner";
import { safeUrl } from "../../lib/safe-url";

const STATUS_STYLE: Record<string, string> = {
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
};

type Applicant = HackathonApplicationsRow["applicants"][number];
type StatusFilter = "ALL" | "NEEDS_REVIEW" | "APPROVED" | "REJECTED";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "NEEDS_REVIEW", label: "Needs review" },
  { value: "APPROVED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
];

const needsReview = (a: Applicant) => a.status === "PENDING" || a.result?.status === "PENDING";

function matchesStatus(a: Applicant, f: StatusFilter) {
  if (f === "ALL") return true;
  if (f === "NEEDS_REVIEW") return needsReview(a);
  return a.status === f || a.result?.status === f;
}

function matchesSearch(a: Applicant, q: string) {
  return [
    a.studentName, a.studentEmail, a.studentRegisterNum, a.studentDepartment, a.teamName,
    ...a.teamMembers.flatMap((m) => [m.name, m.registerNum, m.email, m.department]),
  ].some((v) => v?.toLowerCase().includes(q));
}

export function HackathonApplications({ queueHref }: { queueHref?: string }) {
  const queryClient = useQueryClient();
  const rows = useQuery({ queryKey: ["hackathons", "applications"], queryFn: externalHackathonsApi.applications });
  const [open, setOpen] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [rejecting, setRejecting] = useState<{ claimId: string; label: string } | null>(null);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["hackathons", "applications"] });
    queryClient.invalidateQueries({ queryKey: ["hackathons", "external"] });
  };
  const approve = useMutation({ mutationFn: (claimId: string) => mentorApi.approve(claimId), onSuccess: refresh });
  const reject = useMutation({
    mutationFn: ({ claimId, feedback }: { claimId: string; feedback: string }) => mentorApi.reject(claimId, feedback),
    onSuccess: () => {
      refresh();
      setRejecting(null);
    },
  });

  const data = rows.data ?? [];
  const q = search.trim().toLowerCase();
  const filtering = !!q || statusFilter !== "ALL";

  // A hackathon shows when its title/organizer matches (all of its applicants
  // that pass the status filter) or when any of its applicants match.
  const visible = useMemo(
    () =>
      data
        .map((r) => {
          const titleHit = !!q && `${r.title} ${r.organizer ?? ""}`.toLowerCase().includes(q);
          const applicants = r.applicants.filter(
            (a) => matchesStatus(a, statusFilter) && (!q || titleHit || matchesSearch(a, q)),
          );
          return { row: r, applicants, show: !filtering || titleHit || applicants.length > 0 };
        })
        .filter((v) => v.show),
    [data, q, statusFilter, filtering],
  );

  if (rows.isLoading) return <div className="flex h-48 items-center justify-center"><Spinner label="Loading applications..." /></div>;
  if (rows.isError) return <ErrorBanner error={rows.error} />;

  const totalPending = data.reduce((n, r) => n + r.applicants.filter(needsReview).length, 0);
  const busy = approve.isPending || reject.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hackathon, student, team or member..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStatusFilter(s.value)}
              className={`rounded-full border px-3 py-1 text-[11px] font-bold transition-colors ${
                statusFilter === s.value ? "border-[#1755A7] bg-[#1755A7] text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {queueHref && totalPending > 0 && (
        <Link href={queueHref} className="inline-flex text-xs font-bold text-[#1755A7] hover:underline">
          Or verify pending proofs in the review queue →
        </Link>
      )}
      {(approve.error || reject.error) ? <ErrorBanner error={approve.error ?? reject.error} /> : null}

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
            {visible.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">{filtering ? "No applications match your search or filter." : "No hackathons yet."}</td></tr>
            )}
            {visible.map(({ row: r, applicants }) => {
              // While searching/filtering, rows with matching applicants open automatically.
              const expanded = open === r.externalId || (filtering && applicants.length > 0);
              return (
                <Fragment key={r.externalId}>
                  <tr className="cursor-pointer hover:bg-slate-50/60" onClick={() => setOpen(open === r.externalId ? null : r.externalId)}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 font-bold text-slate-900">
                        {expanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                        {r.title}
                      </div>
                      {r.organizer && <div className="ml-6 text-[11px] text-slate-500">{r.organizer}</div>}
                    </td>
                    <td className="px-5 py-3 text-center font-black text-slate-900"><Users className="mr-1 inline h-3.5 w-3.5 text-slate-400" />{r.total}</td>
                    <td className="px-5 py-3 text-center font-bold text-emerald-600">{r.approved}</td>
                    <td className="px-5 py-3 text-center font-bold text-amber-600">{r.pending}</td>
                    <td className="px-5 py-3 text-center font-bold text-rose-600">{r.rejected}</td>
                  </tr>
                  {expanded && (
                    <tr>
                      <td colSpan={5} className="bg-slate-50/60 px-3 py-3 sm:px-5">
                        {applicants.length === 0 ? (
                          <p className="text-slate-500">{r.applicants.length === 0 ? "No students have applied yet." : "No applicants match your filter."}</p>
                        ) : (
                          <div className="space-y-3">
                            {applicants.map((a) => (
                              <ApplicantCard
                                key={a.registrationId}
                                a={a}
                                busy={busy}
                                onApprove={(claimId) => approve.mutate(claimId)}
                                onReject={(claimId, label) => { reject.reset(); setRejecting({ claimId, label }); }}
                              />
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {rejecting && (
        <RejectModal
          label={rejecting.label}
          pending={reject.isPending}
          error={reject.error}
          onCancel={() => setRejecting(null)}
          onSubmit={(feedback) => reject.mutate({ claimId: rejecting.claimId, feedback })}
        />
      )}
    </div>
  );
}

function ApplicantCard({
  a, busy, onApprove, onReject,
}: {
  a: Applicant; busy: boolean; onApprove: (claimId: string) => void; onReject: (claimId: string, label: string) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-bold text-slate-900">{a.studentName}</div>
          <div className="text-[11px] text-slate-500">
            {[a.studentEmail, a.studentRegisterNum, a.studentDepartment].filter(Boolean).join(" · ")}
          </div>
        </div>
        <div className="text-[11px] text-slate-500">Applied {new Date(a.appliedAt).toLocaleDateString()}</div>
      </div>

      <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <Users className="h-3 w-3" /> Team {a.teamName ? <span className="normal-case tracking-normal text-slate-800">· {a.teamName}</span> : null}
        </div>
        {a.teamMembers.length === 0 ? (
          <p className="mt-1 text-[11px] text-slate-400">No team details (registered before team details were required).</p>
        ) : (
          <div className="mt-1.5 overflow-x-auto">
            <table className="w-full min-w-[380px] text-[11px]">
              <thead className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr><th className="py-1">Name</th><th>Register No.</th><th>Email</th><th>Department</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {a.teamMembers.map((m, i) => (
                  <tr key={i}>
                    <td className="py-1 font-semibold">{m.name}</td>
                    <td>{m.registerNum || "—"}</td>
                    <td>{m.email || "—"}</td>
                    <td>{m.department || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <ProofStep
          title="1. Registration proof"
          icon={<Check className="h-3.5 w-3.5" />}
          status={a.status}
          proof={a.registrationProof}
          feedback={a.feedback}
          points={a.status === "APPROVED" ? a.pointsAwarded : null}
          claimId={a.claimId}
          busy={busy}
          onApprove={onApprove}
          onReject={(id) => onReject(id, `${a.studentName} — registration proof`)}
        />
        {a.result ? (
          <ProofStep
            title={a.result.type === "WINNER" ? "2. Winner proof" : "2. Participation proof"}
            icon={a.result.type === "WINNER" ? <Trophy className="h-3.5 w-3.5" /> : <Medal className="h-3.5 w-3.5" />}
            status={a.result.status}
            proof={a.result}
            feedback={a.result.feedback}
            points={a.result.status === "APPROVED" ? a.result.pointsAwarded : null}
            claimId={a.result.claimId}
            busy={busy}
            onApprove={onApprove}
            onReject={(id) => onReject(id, `${a.studentName} — ${a.result?.type === "WINNER" ? "winner" : "participation"} proof`)}
          />
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 p-3 text-[11px] text-slate-400">
            <div className="font-bold uppercase tracking-wider text-slate-400">2. Participation / winner proof</div>
            <p className="mt-1">{a.status === "APPROVED" ? "Not submitted yet." : "Available to the student after registration is verified."}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProofStep({
  title, icon, status, proof, feedback, points, claimId, busy, onApprove, onReject,
}: {
  title: string; icon: React.ReactNode; status: string; proof: HackathonProofInfo; feedback: string | null; points: number | null;
  claimId: string | null; busy: boolean; onApprove: (claimId: string) => void; onReject: (claimId: string) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">{icon}{title}</span>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[status] ?? ""}`}>
          {status === "APPROVED" ? "VERIFIED" : status}
        </span>
      </div>
      <div className="mt-2 text-[11px]">
        {proof.proofUrl ? (
          <a href={safeUrl(proof.proofUrl)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 break-all font-bold text-[#1755A7] hover:underline">
            View proof <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        ) : proof.proofFileName ? (
          <span className="text-slate-600">File: {proof.proofFileName}</span>
        ) : (
          <span className="text-slate-400">No proof link</span>
        )}
        {points != null && <span className="ml-2 font-bold text-emerald-700">+{points} pts</span>}
      </div>
      {feedback && <p className="mt-1 text-[11px] text-rose-600">Feedback: {feedback}</p>}
      {status === "PENDING" && claimId && (
        <div className="mt-2.5 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => onApprove(claimId)}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <Check className="h-3 w-3" /> Approve
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onReject(claimId)}
            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
          >
            <X className="h-3 w-3" /> Reject
          </button>
        </div>
      )}
    </div>
  );
}

function RejectModal({
  label, pending, error, onCancel, onSubmit,
}: {
  label: string; pending: boolean; error: unknown; onCancel: () => void; onSubmit: (feedback: string) => void;
}) {
  const [feedback, setFeedback] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onCancel}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); onSubmit(feedback.trim()); }}
        className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div>
          <h3 className="text-sm font-black text-slate-900">Reject proof</h3>
          <p className="mt-0.5 text-xs text-slate-500">{label}</p>
        </div>
        <textarea
          required
          rows={3}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Tell the student why, so they can resubmit (e.g. screenshot doesn't show the team name)."
          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7]"
        />
        {error ? <ErrorBanner error={error} /> : null}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600">Cancel</button>
          <button type="submit" disabled={!feedback.trim() || pending} className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50">
            {pending ? "Rejecting..." : "Reject"}
          </button>
        </div>
      </form>
    </div>
  );
}
