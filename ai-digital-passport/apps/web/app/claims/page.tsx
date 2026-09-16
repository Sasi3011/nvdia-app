"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { StudentShell } from "../../components/shell/StudentShell";
import { Spinner } from "../../components/ui/Spinner";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { claimsApi } from "../../lib/api";
import { 
  FileCheck, 
  Sparkles, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowUpRight, 
  Search, 
  Filter, 
  FileText, 
  GitBranch, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Award
} from "lucide-react";

export default function ClaimsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "APPROVED" | "PENDING" | "REJECTED">("ALL");
  const [search, setSearch] = useState("");

  const claims = useQuery({ 
    queryKey: ["claims", page], 
    queryFn: () => claimsApi.list({ page, pageSize: 20 }) 
  });

  const rawItems = claims.data?.items ?? [];
  const approvedCount = rawItems.filter((c) => c.status === "APPROVED").length;
  const pendingCount = rawItems.filter((c) => c.status === "PENDING").length;
  const totalApprovedPoints = rawItems
    .filter((c) => c.status === "APPROVED")
    .reduce((sum, c) => sum + (c.pointsAwarded || 0), 0);

  const filteredItems = rawItems.filter((c) => {
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    const matchesSearch = c.category.toLowerCase().includes(search.toLowerCase()) || c.proofType.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <StudentShell>
      <div className="space-y-6">
        
        {/* Top Header Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 lg:p-8 shadow-xs">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-gradient-to-br from-[#1755A7]/10 to-[#F8C401]/15 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-3xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1755A7]/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#1755A7]">
                  <Sparkles className="h-3.5 w-3.5 text-[#F8C401]" />
                  Evidence & Claims Tracker
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Verification
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900">Submitted Evidence & Claims History</h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Track the live review status of your submitted certifications, hackathon projects, research papers, and GPU workloads. Approved points are credited instantly to your AI competence score.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/claims/new"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1755A7] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#134486] hover:shadow-md hover:shadow-[#1755A7]/20 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Submit New Evidence
              </Link>
            </div>
          </div>
        </div>

        {/* 4 KPI Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Submissions</div>
            <div className="mt-2 text-2xl font-black text-slate-900">{claims.data?.total || rawItems.length}</div>
            <div className="mt-1 text-xs text-slate-500">All-time evidence filings</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Approved & Credited</div>
            <div className="mt-2 text-2xl font-black text-emerald-600">{approvedCount} Claims</div>
            <div className="mt-1 text-xs text-slate-500">+{totalApprovedPoints.toLocaleString()} points added</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Under Review</div>
            <div className="mt-2 text-2xl font-black text-amber-600">{pendingCount} Claims</div>
            <div className="mt-1 text-xs text-slate-500">Assigned to faculty mentors</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Mentor Review SLA</div>
            <div className="mt-2 text-2xl font-black text-[#1755A7]">&lt; 24 Hours</div>
            <div className="mt-1 text-xs text-slate-500">Target turnaround time</div>
          </div>
        </div>

        {/* Filters & Search Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by category, proof type…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {(["ALL", "APPROVED", "PENDING", "REJECTED"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                  statusFilter === st
                    ? "bg-[#1755A7] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {st === "ALL" ? "All Submissions" : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Claims Content List */}
        {claims.isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Spinner label="Loading evidence records…" />
          </div>
        ) : claims.isError ? (
          <ErrorBanner error={claims.error} />
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center shadow-xs space-y-4 max-w-md mx-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1755A7]/10 text-[#1755A7]">
              <FileCheck className="h-7 w-7 text-[#1755A7]" />
            </div>
            <h3 className="text-base font-black text-slate-900">No Evidence Claims Found</h3>
            <p className="text-xs text-slate-600">
              Submit proof for your completed courses, hackathons, or research publications to earn competency points.
            </p>
            <div className="pt-2">
              <Link
                href="/claims/new"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1755A7] px-4 py-2 text-xs font-bold text-white hover:bg-[#134486] transition-all shadow-xs"
              >
                <Plus className="h-4 w-4" />
                Submit Evidence Now
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3.5">
              {filteredItems.map((c) => {
                const isApproved = c.status === "APPROVED";
                const isPending = c.status === "PENDING";
                const isRejected = c.status === "REJECTED";

                return (
                  <div
                    key={c.claimId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-[#1755A7]/40 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                          isApproved
                            ? "bg-emerald-100 text-emerald-700"
                            : isPending
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {isApproved && <CheckCircle2 className="h-5 w-5" />}
                        {isPending && <Clock className="h-5 w-5" />}
                        {isRejected && <AlertCircle className="h-5 w-5" />}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900 capitalize">
                            {c.category.replace(/_/g, " ")}
                          </h4>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                            {c.proofType.replace(/_/g, " ")}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                          <span>Submitted on {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                          <span>•</span>
                          <span className="font-mono">
                            {c.pointsAwarded != null ? `+${c.pointsAwarded} pts awarded` : `${c.pointsRequested} pts requested`}
                          </span>
                        </div>

                        {isRejected && c.mentorFeedback && (
                          <div className="mt-2 rounded-xl bg-rose-50 border border-rose-200/60 p-2.5 text-xs text-rose-800 space-y-0.5">
                            <strong className="block font-bold">Mentor Feedback:</strong>
                            <p>{c.mentorFeedback}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                          isApproved
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            : isPending
                            ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                            : "bg-rose-50 text-rose-700 border border-rose-200/60"
                        }`}
                      >
                        {c.status}
                      </span>

                      {c.pointsAwarded != null && c.pointsAwarded > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#F8C401]/15 px-2.5 py-0.5 font-mono text-xs font-black text-amber-900 border border-[#F8C401]/30">
                          <Sparkles className="h-3 w-3 text-[#F8C401]" />
                          +{c.pointsAwarded} pts
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {claims.data && claims.data.total > claims.data.pageSize && (
              <div className="flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <span className="text-xs font-bold text-slate-600">
                  Page {claims.data.page} of {Math.ceil(claims.data.total / claims.data.pageSize)}
                </span>
                <button
                  type="button"
                  disabled={page * claims.data.pageSize >= claims.data.total}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </StudentShell>
  );
}
