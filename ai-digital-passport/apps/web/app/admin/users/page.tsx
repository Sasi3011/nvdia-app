"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserRole } from "@ai-digital-passport/shared-types";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { adminMentorDepartmentApi, adminUsersApi, type AdminUserResponse } from "../../../lib/api";
import {
  getWhitelistEntries,
  saveWhitelistEntries,
  bulkAddEmailsToWhitelist,
  parseRawTextOrCsvToEmails,
  exportWhitelistToCsvString,
  type WhitelistEntry,
} from "../../../lib/whitelist";
import { 
  UserCircle, 
  Mail, 
  ShieldAlert, 
  Cpu, 
  Search, 
  X, 
  Award, 
  CheckCircle2, 
  Sparkles, 
  Users, 
  ShieldCheck, 
  Building, 
  Sliders, 
  ChevronRight,
  Upload,
  FileSpreadsheet,
  Download,
  Plus,
  Lock,
  Unlock,
  Trash2,
  Edit3,
  FileText,
  AlertTriangle,
  Layers,
  Filter
} from "lucide-react";

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7] transition-colors";
const labelClass = "text-xs font-bold text-slate-700 flex items-center gap-1.5";

export default function AdminUsersPage() {
  const [mainTab, setMainTab] = useState<"whitelist" | "scholars">("whitelist");
  
  // Whitelist State
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [whitelistSearch, setWhitelistSearch] = useState("");
  const [whitelistRoleFilter, setWhitelistRoleFilter] = useState<string>("ALL");
  const [whitelistStatusFilter, setWhitelistStatusFilter] = useState<string>("ALL");
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddSingleModal, setShowAddSingleModal] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // Scholars State
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [managingUser, setManagingUser] = useState<AdminUserResponse | null>(null);

  useEffect(() => {
    setWhitelist(getWhitelistEntries());
  }, []);

  const refreshWhitelist = () => {
    setWhitelist(getWhitelistEntries());
  };

  const users = useQuery({ 
    queryKey: ["admin", "users", q], 
    queryFn: () => adminUsersApi.search({ q: q || undefined, page: 1, pageSize: 100 }) 
  });

  const allUsers = users.data?.items ?? [];
  const filteredUsers = allUsers.filter((u) => {
    const matchesRole = roleFilter === "ALL" || u.roles.includes(roleFilter as UserRole);
    return matchesRole;
  });

  const filteredWhitelist = whitelist.filter((entry) => {
    const matchesSearch = 
      entry.email.toLowerCase().includes(whitelistSearch.toLowerCase()) || 
      (entry.fullName && entry.fullName.toLowerCase().includes(whitelistSearch.toLowerCase())) ||
      entry.department.toLowerCase().includes(whitelistSearch.toLowerCase()) ||
      entry.source.toLowerCase().includes(whitelistSearch.toLowerCase());
    const matchesRole = whitelistRoleFilter === "ALL" || entry.role === whitelistRoleFilter;
    const matchesStatus = whitelistStatusFilter === "ALL" || entry.status === whitelistStatusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalWhitelisted = whitelist.length;
  const authorizedCount = whitelist.filter(w => w.status === "AUTHORIZED").length;
  const suspendedCount = whitelist.filter(w => w.status === "SUSPENDED").length;
  const studentWhitelisted = whitelist.filter(w => w.role === "STUDENT").length;

  const handleToggleStatus = (email: string) => {
    const updated = whitelist.map((item) => {
      if (item.email.toLowerCase() === email.toLowerCase()) {
        const nextStatus: "AUTHORIZED" | "SUSPENDED" = item.status === "AUTHORIZED" ? "SUSPENDED" : "AUTHORIZED";
        return { ...item, status: nextStatus };
      }
      return item;
    });
    setWhitelist(updated);
    saveWhitelistEntries(updated);
    setBannerNotice(`Access permissions updated for ${email}`);
  };

  const handleDeleteWhitelist = (email: string) => {
    const updated = whitelist.filter((item) => item.email.toLowerCase() !== email.toLowerCase());
    setWhitelist(updated);
    saveWhitelistEntries(updated);
    setBannerNotice(`Removed ${email} from authorized access whitelist.`);
  };

  const handleExportCsv = () => {
    const csvContent = exportWhitelistToCsvString(whitelist);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SECE_NVIDIA_Portal_Email_Whitelist_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader 
        title="Scholars, Access Whitelist & Governance" 
        description="Upload institutional CSV/Excel rosters to restrict portal access exclusively to authorized emails, assign roles, and allocate GPU compute quotas." 
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-all active:scale-95"
            >
              <Download className="h-4 w-4 text-[#1755A7]" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setShowAddSingleModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4 text-[#1755A7]" />
              <span>Add Email</span>
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] via-[#1A5EB7] to-[#2563EB] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1D4ED8] transition-all active:scale-95"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Import CSV / Excel</span>
            </button>
          </div>
        }
      />

      {/* Notice Banner */}
      {bannerNotice && (
        <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between text-xs font-bold text-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{bannerNotice}</span>
          </div>
          <button onClick={() => setBannerNotice(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <ImportCsvModal
          onClose={() => setShowImportModal(false)}
          onImported={(summary) => {
            setShowImportModal(false);
            refreshWhitelist();
            setBannerNotice(`Successfully processed CSV roster! Added ${summary.addedCount} new emails and updated ${summary.updatedCount} existing entries.`);
          }}
        />
      )}

      {/* Add Single Email Modal */}
      {showAddSingleModal && (
        <AddSingleEmailModal
          onClose={() => setShowAddSingleModal(false)}
          onAdded={(email) => {
            setShowAddSingleModal(false);
            refreshWhitelist();
            setBannerNotice(`Access permission successfully granted for "${email}"!`);
          }}
        />
      )}

      {/* Manage Scholar Modal */}
      {managingUser && (
        <ManageUserModal
          user={managingUser}
          onClose={() => setManagingUser(null)}
          onUpdated={(updatedUser) => {
            setManagingUser(updatedUser);
          }}
        />
      )}

      {/* Top 4 KPI Overview Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Authorized Whitelist</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalWhitelisted}</span>
            <span className="text-xs font-bold text-emerald-600">Access Granted</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Enforcement Protocol:</span>
            <span className="font-bold text-[#1755A7]">Strict Whitelist Only</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Student Scholars</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8C401]/20 text-slate-900">
              <Users className="h-4.5 w-4.5 text-amber-700" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{studentWhitelisted}</span>
            <span className="text-xs font-semibold text-slate-500">Enrolled Roster</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Faculty Mentors:</span>
            <span className="font-bold text-slate-800">{whitelist.filter(w => w.role === "MENTOR").length} Verified</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Suspended / Blocked</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
              <Lock className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700">{suspendedCount}</span>
            <span className="text-xs font-bold text-rose-600">Restricted</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Unauthorized Rejections:</span>
            <span className="font-bold text-slate-800">Auto-Blocked</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">CSV & Excel Batches</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <FileSpreadsheet className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">
              {new Set(whitelist.map(w => w.source)).size}
            </span>
            <span className="text-xs font-bold text-emerald-600">Rosters Active</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Instant Access Sync:</span>
            <span className="font-bold text-slate-800">Live Active</span>
          </div>
        </div>
      </div>

      {/* Main View Mode Selector Tabs */}
      <div className="mt-8 flex items-center gap-3 border-b border-slate-200">
        <button
          onClick={() => setMainTab("whitelist")}
          className={`flex items-center gap-2 pb-3.5 px-4 text-xs font-bold border-b-2 transition-all ${
            mainTab === "whitelist"
              ? "border-[#1755A7] text-[#1755A7]"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Authorized Email Whitelist ({whitelist.length})</span>
          <span className="rounded-full bg-[#1755A7]/10 text-[#1755A7] px-2 py-0.5 text-[10px] font-bold">
            Access Control
          </span>
        </button>

        <button
          onClick={() => setMainTab("scholars")}
          className={`flex items-center gap-2 pb-3.5 px-4 text-xs font-bold border-b-2 transition-all ${
            mainTab === "scholars"
              ? "border-[#1755A7] text-[#1755A7]"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Active Scholar Roster & Points Management</span>
        </button>
      </div>

      {/* TAB 1: EMAIL ACCESS WHITELIST VIEW */}
      {mainTab === "whitelist" && (
        <div className="mt-6 flex flex-col gap-4">
          {/* Info Banner */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1755A7] text-white">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-slate-900">
                  Strict Email Whitelist Access Control Enabled
                </p>
                <p className="text-slate-600 mt-0.5">
                  Only the institutional emails listed in this whitelist can log in and access the Sri Eshwar NVIDIA AI platform. Any unlisted email attempting to sign in is immediately blocked.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-[#1755A7] shadow-2xs hover:bg-slate-50 shrink-0 active:scale-95"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Import New CSV Roster</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search whitelisted email, scholar name, or department..."
                value={whitelistSearch}
                onChange={(e) => setWhitelistSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                <Sliders className="h-3.5 w-3.5 text-slate-400" />
                <select
                  value={whitelistRoleFilter}
                  onChange={(e) => setWhitelistRoleFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="ALL">All Roles</option>
                  <option value="STUDENT">Students</option>
                  <option value="MENTOR">Faculty Mentors</option>
                  <option value="ADMIN">Administrators</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <select
                  value={whitelistStatusFilter}
                  onChange={(e) => setWhitelistStatusFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="ALL">All Access Statuses</option>
                  <option value="AUTHORIZED">Access Granted</option>
                  <option value="SUSPENDED">Access Suspended</option>
                </select>
              </div>
            </div>
          </div>

          {/* Whitelist Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Whitelisted Email & Scholar</th>
                  <th className="px-6 py-3.5">Assigned Role & Department</th>
                  <th className="px-6 py-3.5">Import Source / Batch</th>
                  <th className="px-6 py-3.5 text-center">Portal Access</th>
                  <th className="px-6 py-3.5 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWhitelist.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400">
                      <ShieldAlert className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                      <p className="font-bold text-slate-700">No whitelisted emails found.</p>
                      <p className="text-xs text-slate-400 mt-1">Upload a CSV or add an email to grant access.</p>
                    </td>
                  </tr>
                ) : (
                  filteredWhitelist.map((w) => (
                    <tr key={w.email} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm ${
                            w.status === "AUTHORIZED" ? "bg-[#1755A7]/10 text-[#1755A7]" : "bg-rose-50 text-rose-700"
                          }`}>
                            {w.fullName ? w.fullName.charAt(0) : w.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-[13px]">{w.email}</span>
                            <p className="text-xs text-slate-500 mt-0.5">{w.fullName || "Unspecified Scholar"}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            w.role === "ADMIN" 
                              ? "bg-purple-100 text-purple-700" 
                              : w.role === "MENTOR" 
                              ? "bg-amber-100 text-amber-800" 
                              : "bg-slate-100 text-slate-700"
                          }`}>
                            {w.role}
                          </span>
                          <span className="text-[11px] text-slate-500">{w.department}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-xs font-semibold text-slate-800">{w.source}</span>
                          <span className="text-[11px] text-slate-400">Added {new Date(w.addedAt).toLocaleDateString()}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        {w.status === "AUTHORIZED" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            Access Granted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-1 text-[11px] font-bold text-rose-700">
                            <Lock className="h-3 w-3" />
                            Suspended
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(w.email)}
                            className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                              w.status === "AUTHORIZED"
                                ? "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                                : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                            title={w.status === "AUTHORIZED" ? "Suspend Portal Access" : "Grant Portal Access"}
                          >
                            {w.status === "AUTHORIZED" ? (
                              <><Lock className="h-3.5 w-3.5" /> Suspend</>
                            ) : (
                              <><Unlock className="h-3.5 w-3.5" /> Grant</>
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteWhitelist(w.email)}
                            className="rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-all active:scale-95"
                            title="Delete from whitelist"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE REGISTERED SCHOLARS & POINTS */}
      {mainTab === "scholars" && (
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search registered scholars by full name, email, or register number…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7]"
              />
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
              <Sliders className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value="ALL">All Roles</option>
                <option value="STUDENT">Students Only</option>
                <option value="MENTOR">Faculty Mentors</option>
                <option value="ADMIN">Platform Admins</option>
              </select>
            </div>
          </div>
          
          {/* Users Table */}
          {users.isLoading ? (
            <div className="mt-8 flex h-64 items-center justify-center">
              <Spinner label="Loading user directory..." />
            </div>
          ) : users.isError ? (
            <div className="mt-6">
              <ErrorBanner error={users.error} />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <UserCircle className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-bold text-slate-700">No users match your criteria.</p>
              <p className="text-xs text-slate-400 mt-1">Try clearing the search query or changing role filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-3.5">Scholar / Faculty Details</th>
                    <th className="px-6 py-3.5">Institutional Identifier</th>
                    <th className="px-6 py-3.5">Level & Badges</th>
                    <th className="px-6 py-3.5">Compute & Points</th>
                    <th className="px-6 py-3.5 text-right">Governance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.userId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7] font-bold text-sm">
                            {u.fullName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-[13px]">{u.fullName}</span>
                            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                              <Mail className="h-3 w-3 text-slate-400" />
                              <span>{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono font-bold text-slate-800 text-xs">{u.registerNum || "FACULTY-SECE"}</span>
                          <span className="text-[11px] text-slate-500">{u.department || "Artificial Intelligence & Data Science"}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1.5">
                          <span className="inline-flex items-center gap-1 font-bold text-xs text-[#1755A7] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                            <Sparkles className="h-3 w-3 text-[#F8C401]" />
                            {u.levelName}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {u.roles.map((r) => (
                              <span 
                                key={r} 
                                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                  r === "ADMIN" 
                                    ? "bg-purple-100 text-purple-700" 
                                    : r === "MENTOR" 
                                    ? "bg-amber-100 text-amber-800" 
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-xs">
                          <span className="font-bold text-slate-900 flex items-center gap-1">
                            <Award className="h-3.5 w-3.5 text-[#1755A7]" />
                            {u.totalPoints.toLocaleString()} pts
                          </span>
                          <span className="font-semibold text-emerald-700 flex items-center gap-1 text-[11px]">
                            <Cpu className="h-3 w-3 text-emerald-600" />
                            {u.gpuCreditBalance.toLocaleString()} GPU credits
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setManagingUser(u)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1755A7] via-[#1A5EB7] to-[#2563EB] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:from-[#124282] hover:to-[#1D4ED8] transition-all active:scale-95"
                        >
                          <span>Manage</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </ConsoleShell>
  );
}

function ImportCsvModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: (summary: { addedCount: number; updatedCount: number; invalidCount: number }) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState("");
  const [defaultRole, setDefaultRole] = useState<"STUDENT" | "MENTOR" | "ADMIN">("STUDENT");
  const [defaultDept, setDefaultDept] = useState("Artificial Intelligence & Data Science");
  const [batchName, setBatchName] = useState("Cohort_2026_AI_Roster.csv");
  const [parsedEmails, setParsedEmails] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setBatchName(selected.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setRawText(text);
          const extracted = parseRawTextOrCsvToEmails(text);
          setParsedEmails(extracted);
        }
      };
      reader.readAsText(selected);
    }
  };

  const handleTextChange = (text: string) => {
    setRawText(text);
    const extracted = parseRawTextOrCsvToEmails(text);
    setParsedEmails(extracted);
  };

  const handleConfirm = () => {
    if (parsedEmails.length === 0) return;
    setIsProcessing(true);
    try {
      const res = bulkAddEmailsToWhitelist(parsedEmails, {
        role: defaultRole,
        department: defaultDept,
        source: batchName || "Manual CSV Import",
      });
      onImported(res);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#1755A7] via-[#1E40AF] to-[#2563EB] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#F8C401]">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Import CSV / Excel Whitelist Roster</h3>
              <p className="text-xs text-blue-100">Grant portal access exclusively to the email addresses in this spreadsheet</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-4 max-h-[75vh] overflow-y-auto minute-scrollbar">
          {/* File Upload Area */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-[#1755A7] bg-slate-50/70 hover:bg-blue-50/30 rounded-2xl p-6 text-center cursor-pointer transition-colors"
          >
            <input 
              ref={fileInputRef} 
              type="file" 
              accept=".csv, .xlsx, .xls, .txt" 
              onChange={handleFileChange} 
              className="hidden" 
            />
            <div className="flex flex-col items-center">
              <Upload className="h-8 w-8 text-[#1755A7] mb-2" />
              <p className="text-xs font-bold text-slate-800">
                {file ? file.name : "Click to select CSV or Excel sheet (or drag & drop here)"}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Supports `.csv`, `.xlsx`, `.xls` with email columns or comma/newline separated emails
              </p>
            </div>
          </div>

          {/* Or Paste Raw Text */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <span>Or Paste Raw Email List (Comma / Newline Separated)</span>
            </label>
            <textarea
              rows={3}
              placeholder="student1@sece.ac.in, student2@sece.ac.in, mentor@sece.ac.in..."
              value={rawText}
              onChange={(e) => handleTextChange(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Parsing Summary Pill */}
          {parsedEmails.length > 0 && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-emerald-900">
                  Detected {parsedEmails.length} valid institutional email addresses!
                </span>
              </div>
              <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md text-[11px]">
                Ready to Authorize
              </span>
            </div>
          )}

          {/* Batch Settings */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2 border-t border-slate-100">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Assign Role</label>
              <select
                value={defaultRole}
                onChange={(e) => setDefaultRole(e.target.value as "STUDENT" | "MENTOR" | "ADMIN")}
                className={inputClass}
              >
                <option value="STUDENT">Student Scholar</option>
                <option value="MENTOR">Faculty Mentor</option>
                <option value="ADMIN">Platform Admin</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Assign Department</label>
              <input
                value={defaultDept}
                onChange={(e) => setDefaultDept(e.target.value)}
                className={inputClass}
                placeholder="Department"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Roster Batch Tag</label>
              <input
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                className={inputClass}
                placeholder="E.g. AI_Batch_2026.csv"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-3 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={parsedEmails.length === 0 || isProcessing}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#2563EB] px-5 py-2 text-xs font-bold text-white shadow-2xs hover:from-[#124282] hover:to-[#1D4ED8] transition-all active:scale-95 disabled:opacity-50"
          >
            {isProcessing ? "Processing Roster..." : `Grant Access to ${parsedEmails.length || 0} Emails`}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddSingleEmailModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (email: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"STUDENT" | "MENTOR" | "ADMIN">("STUDENT");
  const [department, setDepartment] = useState("Artificial Intelligence & Data Science");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    bulkAddEmailsToWhitelist([email.trim()], {
      role,
      department,
      source: "Manual Admin Whitelist Entry",
    });
    onAdded(email.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-[#1755A7] via-[#1E40AF] to-[#2563EB] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#F8C401]">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Whitelist Single Email</h3>
              <p className="text-xs text-blue-100">Authorize access for an individual scholar or mentor</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <span>Institutional Email Address <span className="text-red-500">*</span></span>
            </label>
            <input
              type="email"
              required
              placeholder="scholar@sece.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <span>Scholar Full Name</span>
            </label>
            <input
              placeholder="E.g. Sasikiran V."
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Role Privilege</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "STUDENT" | "MENTOR" | "ADMIN")}
                className={inputClass}
              >
                <option value="STUDENT">Student Scholar</option>
                <option value="MENTOR">Faculty Mentor</option>
                <option value="ADMIN">Platform Admin</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Department</label>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="mt-2 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#2563EB] px-5 py-2 text-xs font-bold text-white shadow-2xs hover:from-[#124282] hover:to-[#1D4ED8] transition-all active:scale-95"
            >
              Authorize & Whitelist Email
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ManageUserModal({
  user,
  onClose,
  onUpdated,
}: {
  user: AdminUserResponse;
  onClose: () => void;
  onUpdated: (u: AdminUserResponse) => void;
}) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"roles" | "points" | "gpu" | "dept">("roles");
  
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.MENTOR);
  const [pointsDelta, setPointsDelta] = useState(0);
  const [pointsReason, setPointsReason] = useState("");
  const [creditsDelta, setCreditsDelta] = useState(0);
  const [creditsReason, setCreditsReason] = useState("");
  const [mentorDepartment, setMentorDepartment] = useState(user.mentorDepartment ?? "");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] });

  const assignRole = useMutation({
    mutationFn: () => adminUsersApi.assignRole(user.userId, selectedRole),
    onSuccess: () => {
      const updated = { ...user, roles: user.roles.includes(selectedRole) ? user.roles : [...user.roles, selectedRole] };
      onUpdated(updated);
      setFeedback(`Role ${selectedRole} successfully assigned!`);
      refresh();
    },
    onError: setError,
  });

  const adjustPoints = useMutation({
    mutationFn: () => adminUsersApi.adjustPoints(user.userId, pointsDelta, pointsReason),
    onSuccess: (res) => {
      const updated = { ...user, totalPoints: res.totalPoints };
      onUpdated(updated);
      setPointsDelta(0);
      setPointsReason("");
      setFeedback(`Points updated! New balance: ${res.totalPoints.toLocaleString()} pts`);
      refresh();
    },
    onError: setError,
  });

  const adjustCredits = useMutation({
    mutationFn: () => adminUsersApi.adjustGpuCredits(user.userId, creditsDelta, creditsReason),
    onSuccess: (res) => {
      const updated = { ...user, gpuCreditBalance: res.gpuCreditBalance };
      onUpdated(updated);
      setCreditsDelta(0);
      setCreditsReason("");
      setFeedback(`GPU Credits updated! New quota: ${res.gpuCreditBalance.toLocaleString()} credits`);
      refresh();
    },
    onError: setError,
  });

  const setDepartment = useMutation({
    mutationFn: () => adminMentorDepartmentApi.set(user.userId, mentorDepartment.trim() || null),
    onSuccess: (res) => {
      const updated = { ...user, mentorDepartment: res.mentorDepartment };
      onUpdated(updated);
      setFeedback(`Mentor department set to: ${res.mentorDepartment}`);
      refresh();
    },
    onError: setError,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#1755A7] via-[#1E40AF] to-[#2563EB] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white font-bold text-base">
              {user.fullName.charAt(0)}
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                {user.fullName}
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-mono">{user.registerNum}</span>
              </h3>
              <p className="text-xs text-blue-100">{user.email} • {user.department || "SECE AI Labs"}</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Current Stats Strip */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-bold text-slate-800">
              <Award className="h-3.5 w-3.5 text-[#1755A7]" />
              {user.totalPoints.toLocaleString()} Points
            </span>
            <span className="flex items-center gap-1.5 font-bold text-emerald-700">
              <Cpu className="h-3.5 w-3.5 text-emerald-600" />
              {user.gpuCreditBalance.toLocaleString()} GPU Credits
            </span>
          </div>
          <span className="font-bold text-[#1755A7] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full text-[11px]">
            {user.levelName}
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 pt-2 bg-white">
          <button
            type="button"
            onClick={() => { setActiveTab("roles"); setFeedback(null); }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === "roles" ? "border-[#1755A7] text-[#1755A7]" : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Roles & Privileges
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("points"); setFeedback(null); }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === "points" ? "border-[#1755A7] text-[#1755A7]" : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Adjust Points
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("gpu"); setFeedback(null); }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === "gpu" ? "border-[#1755A7] text-[#1755A7]" : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            GPU Compute Quota
          </button>
          {user.roles.includes(UserRole.MENTOR) && (
            <button
              type="button"
              onClick={() => { setActiveTab("dept"); setFeedback(null); }}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors ${
                activeTab === "dept" ? "border-[#1755A7] text-[#1755A7]" : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              Mentor Dept
            </button>
          )}
        </div>

        {/* Modal Form Body */}
        <div className="p-6">
          {Boolean(error) && <div className="mb-4"><ErrorBanner error={error} /></div>}
          {feedback && (
            <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Roles Tab */}
          {activeTab === "roles" && (
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>Assigned Platform Roles</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {user.roles.map((r) => (
                    <span 
                      key={r} 
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-[#1755A7]" />
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <label className={labelClass}>Grant Additional Privilege</label>
                <div className="mt-2 flex items-center gap-3">
                  <select 
                    value={selectedRole} 
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)} 
                    className={inputClass}
                  >
                    {Object.values(UserRole).map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => assignRole.mutate()}
                    disabled={assignRole.isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#2563EB] px-5 py-2.5 text-xs font-bold text-white shadow-2xs hover:from-[#124282] hover:to-[#1D4ED8] transition-all shrink-0 active:scale-95 disabled:opacity-50"
                  >
                    {assignRole.isPending ? "Assigning..." : "Assign Role"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Points Tab */}
          {activeTab === "points" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                adjustPoints.mutate();
              }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>
                  <span>Delta Points Adjustment <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="number"
                  required
                  placeholder="E.g. 50 (to add) or -25 (to deduct)"
                  value={pointsDelta || ""}
                  onChange={(e) => setPointsDelta(Number(e.target.value))}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>
                  <span>Audit Justification Reason <span className="text-red-500">*</span></span>
                </label>
                <input
                  required
                  placeholder="E.g. NVIDIA DLI Deep Learning Capstone Bonus"
                  value={pointsReason}
                  onChange={(e) => setPointsReason(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={adjustPoints.isPending || !pointsReason.trim() || pointsDelta === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#2563EB] px-5 py-2.5 text-xs font-bold text-white shadow-2xs hover:from-[#124282] hover:to-[#1D4ED8] transition-all active:scale-95 disabled:opacity-50"
                >
                  {adjustPoints.isPending ? "Updating Points..." : "Apply Points Adjustment"}
                </button>
              </div>
            </form>
          )}

          {/* GPU Credits Tab */}
          {activeTab === "gpu" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                adjustCredits.mutate();
              }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>
                  <span>GPU Credit Adjustment (Hours) <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="number"
                  required
                  placeholder="E.g. 100 (allocate 100 compute hours)"
                  value={creditsDelta || ""}
                  onChange={(e) => setCreditsDelta(Number(e.target.value))}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>
                  <span>Allocation Reason <span className="text-red-500">*</span></span>
                </label>
                <input
                  required
                  placeholder="E.g. DGX-A100 LLM Fine-Tuning Grant"
                  value={creditsReason}
                  onChange={(e) => setCreditsReason(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={adjustCredits.isPending || !creditsReason.trim() || creditsDelta === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#2563EB] px-5 py-2.5 text-xs font-bold text-white shadow-2xs hover:from-[#124282] hover:to-[#1D4ED8] transition-all active:scale-95 disabled:opacity-50"
                >
                  {adjustCredits.isPending ? "Allocating..." : "Apply GPU Credits"}
                </button>
              </div>
            </form>
          )}

          {/* Mentor Dept Tab */}
          {activeTab === "dept" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setDepartment.mutate();
              }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Assigned Department for Review Routing</label>
                <input
                  placeholder={`E.g. ${user.department || "Artificial Intelligence & Data Science"}`}
                  value={mentorDepartment}
                  onChange={(e) => setMentorDepartment(e.target.value)}
                  className={inputClass}
                />
                <p className="text-[11px] text-slate-500">
                  Course capstones and proctoring violation alerts for students in this department will automatically route to this faculty mentor.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={setDepartment.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#2563EB] px-5 py-2.5 text-xs font-bold text-white shadow-2xs hover:from-[#124282] hover:to-[#1D4ED8] transition-all active:scale-95 disabled:opacity-50"
                >
                  {setDepartment.isPending ? "Saving..." : "Save Department"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-3 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors active:scale-95"
          >
            Close Dialog
          </button>
        </div>
      </div>
    </div>
  );
}
