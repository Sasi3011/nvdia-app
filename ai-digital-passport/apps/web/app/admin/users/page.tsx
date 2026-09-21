"use client";

import { useState, useEffect, useRef } from "react";
import { departmentOptions } from "../../../lib/departments";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import {
  getWhitelistEntries,
  saveWhitelistEntries,
  bulkAddEmailsToWhitelist,
  parseRosterText,
  parseRosterFile,
  bulkAddRosterToWhitelist,
  type RosterRow,
  exportWhitelistToCsvString,
  type WhitelistEntry,
} from "../../../lib/whitelist";
import { 
  Search, 
  X, 
  CheckCircle2, 
  Sliders, 
  Upload,
  FileSpreadsheet,
  Download,
  Plus,
  Lock,
  Unlock,
  Trash2,
  Filter,
  ShieldAlert
} from "lucide-react";
import { CustomSelect } from "../../../components/ui/CustomSelect";

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7] transition-colors";
const labelClass = "text-xs font-bold text-slate-700 flex items-center gap-1.5";

export default function AdminUsersPage() {
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [whitelistSearch, setWhitelistSearch] = useState("");
  const [whitelistRoleFilter, setWhitelistRoleFilter] = useState<string>("ALL");
  const [whitelistStatusFilter, setWhitelistStatusFilter] = useState<string>("ALL");
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddSingleModal, setShowAddSingleModal] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  useEffect(() => {
    setWhitelist(getWhitelistEntries());
  }, []);

  const refreshWhitelist = () => {
    setWhitelist(getWhitelistEntries());
  };

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
        title="User Management" 
        description="Add and manage emails for mentors, students, and admins. Control portal access exclusively." 
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

      <div className="mt-6 flex flex-col gap-4">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search email, name, or department..."
              value={whitelistSearch}
              onChange={(e) => setWhitelistSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
              <Sliders className="h-3.5 w-3.5 text-slate-400" />
              <CustomSelect
                value={whitelistRoleFilter}
                onChange={setWhitelistRoleFilter}
                options={[
                  { label: "All Roles", value: "ALL" },
                  { label: "Students", value: "STUDENT" },
                  { label: "Mentors", value: "MENTOR" },
                  { label: "Admins", value: "ADMIN" },
                ]}
                className="text-xs font-bold text-slate-800 cursor-pointer min-w-[100px]"
              />
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <CustomSelect
                value={whitelistStatusFilter}
                onChange={setWhitelistStatusFilter}
                options={[
                  { label: "All Statuses", value: "ALL" },
                  { label: "Access Granted", value: "AUTHORIZED" },
                  { label: "Access Suspended", value: "SUSPENDED" },
                ]}
                className="text-xs font-bold text-slate-800 cursor-pointer min-w-[120px]"
              />
            </div>
          </div>
        </div>

        {/* Whitelist Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Assigned Role & Department</th>
                <th className="px-6 py-3.5 text-center">Access Status</th>
                <th className="px-6 py-3.5 text-right">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWhitelist.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-400">
                    <ShieldAlert className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700">No users found.</p>
                    <p className="text-xs text-slate-400 mt-1">Add an email to grant access.</p>
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
                          <p className="text-xs text-slate-500 mt-0.5">{w.fullName || "Unspecified User"}</p>
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
                        <span className="text-[11px] text-slate-500">{w.department}{w.year ? ` • Year ${w.year}` : ""}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      {w.status === "AUTHORIZED" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          Granted
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
                          title={w.status === "AUTHORIZED" ? "Suspend Access" : "Grant Access"}
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
                          title="Delete from list"
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
  const [defaultDept, setDefaultDept] = useState("B.E CSE");
  const [batchName, setBatchName] = useState("Cohort_2026_AI_Roster.csv");
  const [parsedRows, setParsedRows] = useState<RosterRow[]>([]);
  const parsedEmails = parsedRows;
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setBatchName(selected.name);
    try {
      setParsedRows(await parseRosterFile(selected));
      setRawText(/\.xlsx?$/i.test(selected.name) ? "" : await selected.text());
    } catch {
      setParsedRows([]);
    }
  };

  const handleTextChange = (text: string) => {
    setRawText(text);
    setParsedRows(parseRosterText(text));
  };

  const handleConfirm = () => {
    if (parsedEmails.length === 0) return;
    setIsProcessing(true);
    try {
      const res = bulkAddRosterToWhitelist(parsedRows, {
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

        <div className="p-6 flex flex-col gap-4 max-h-[75vh] overflow-y-auto minute-scrollbar">
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
                Supports `.csv`, `.xlsx`, `.xls` with columns: Name, Email, Department, Year (extra columns ignored)
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <span>Or Paste Raw Email List (Comma / Newline Separated)</span>
            </label>
            <textarea
              rows={3}
              placeholder={"Name,Email,Department,Year\nAsha K,asha@sece.ac.in,CSE,2"}
              value={rawText}
              onChange={(e) => handleTextChange(e.target.value)}
              className={inputClass}
            />
          </div>

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

          {parsedRows.length > 0 && (
            <div className="max-h-44 overflow-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-[11px]">
                <thead className="sticky top-0 bg-slate-50 text-slate-500">
                  <tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Department</th><th className="px-3 py-2">Year</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.slice(0, 50).map((r) => (
                    <tr key={r.email}>
                      <td className="px-3 py-1.5">{r.fullName || "—"}</td>
                      <td className="px-3 py-1.5 font-mono">{r.email}</td>
                      <td className="px-3 py-1.5">{r.department || "—"}</td>
                      <td className="px-3 py-1.5">{r.year || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2 border-t border-slate-100">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Assign Role</label>
              <CustomSelect
                value={defaultRole}
                onChange={(v) => setDefaultRole(v as any)}
                options={[
                  { label: "Student Scholar", value: "STUDENT" },
                  { label: "Faculty Mentor", value: "MENTOR" },
                  { label: "Platform Admin", value: "ADMIN" },
                ]}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Assign Department</label>
              <CustomSelect
                value={defaultDept}
                onChange={setDefaultDept}
                options={[
                  { label: "Select Department...", value: "" },
                  ...departmentOptions(defaultDept).map((d) => ({ label: d, value: d }))
                ]}
                className={inputClass}
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
  const [department, setDepartment] = useState("B.E CSE");

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
              <CustomSelect
                value={role}
                onChange={(v) => setRole(v as any)}
                options={[
                  { label: "Student Scholar", value: "STUDENT" },
                  { label: "Faculty Mentor", value: "MENTOR" },
                  { label: "Platform Admin", value: "ADMIN" },
                ]}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Department</label>
              <CustomSelect
                value={department}
                onChange={setDepartment}
                options={[
                  { label: "Select Department...", value: "" },
                  ...departmentOptions(department).map((d) => ({ label: d, value: d }))
                ]}
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
