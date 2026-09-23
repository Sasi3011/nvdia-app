"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { departmentOptions } from "../../../lib/departments";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { CustomSelect } from "../../../components/ui/CustomSelect";
import { parseRosterFile, parseRosterText, type RosterRow } from "../../../lib/whitelist";
import { adminWhitelistApi, type WhitelistEntryResponse, type WhitelistRole } from "../../../lib/api";
import {
  Search,
  X,
  CheckCircle2,
  Upload,
  FileSpreadsheet,
  Download,
  Plus,
  Lock,
  Unlock,
  Trash2,
  ShieldAlert,
  Users,
  GraduationCap,
  UserCheck,
  Shield,
} from "lucide-react";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7] transition-colors";
const labelClass = "text-xs font-bold text-slate-700 flex items-center gap-1.5";

const ROLE_STYLE: Record<WhitelistRole, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  MENTOR: "bg-amber-100 text-amber-800",
  STUDENT: "bg-slate-100 text-slate-700",
};

function csvOf(entries: WhitelistEntryResponse[]) {
  const q = (v: string | null | undefined) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const header = ["Email", "Full Name", "Role", "Department", "Year", "Status", "Source", "Date Added", "Last Login"].join(",");
  const rows = entries.map((e) =>
    [q(e.email), q(e.fullName), q(e.role), q(e.department), q(e.year), q(e.status), q(e.source), q(e.addedAt), q(e.lastLoginAt ?? "Never")].join(","),
  );
  return [header, ...rows].join("\n");
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddSingleModal, setShowAddSingleModal] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const list = useQuery({
    queryKey: ["admin", "whitelist", debouncedSearch, roleFilter, statusFilter],
    queryFn: () => adminWhitelistApi.list({ search: debouncedSearch || undefined, role: roleFilter, status: statusFilter }),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "whitelist"] });

  const toggle = useMutation({
    mutationFn: (e: WhitelistEntryResponse) => adminWhitelistApi.setStatus(e.email, e.status === "AUTHORIZED" ? "SUSPENDED" : "AUTHORIZED"),
    onSuccess: (row) => {
      refresh();
      setNotice(`Access ${row.status === "SUSPENDED" ? "suspended" : "granted"} for ${row.email}.`);
    },
  });

  const remove = useMutation({
    mutationFn: (email: string) => adminWhitelistApi.remove(email),
    onSuccess: (_r, email) => {
      refresh();
      setNotice(`Removed ${email} from the access list.`);
    },
  });

  const items = list.data?.items ?? [];
  const summary = list.data?.summary;
  const actionError = toggle.error ?? remove.error;

  const exportCsv = () => {
    const blob = new Blob([csvOf(items)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SECE_NVIDIA_Portal_Access_List_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const kpis = [
    { label: "Total Users", value: summary?.total ?? 0, icon: Users, bar: "from-[#1755A7] via-[#2563EB] to-[#38BDF8]", tone: "bg-[#1755A7]/10 text-[#1755A7]" },
    { label: "Students", value: summary?.students ?? 0, icon: GraduationCap, bar: "from-emerald-500 via-emerald-400 to-teal-400", tone: "bg-emerald-50 text-emerald-600" },
    { label: "Mentors", value: summary?.mentors ?? 0, icon: UserCheck, bar: "from-[#F8C401] via-amber-500 to-orange-500", tone: "bg-amber-50 text-amber-600" },
    { label: "Admins", value: summary?.admins ?? 0, icon: Shield, bar: "from-indigo-400 via-purple-400 to-pink-400", tone: "bg-purple-50 text-purple-600" },
  ];

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader
        title="User Management"
        description="Add and manage emails for mentors, students, and admins. Control portal access exclusively."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={exportCsv}
              disabled={items.length === 0}
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 shadow-2xs transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50 sm:flex-none"
            >
              <Download className="h-4 w-4 text-[#1755A7]" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setShowAddSingleModal(true)}
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 shadow-2xs transition-all hover:bg-slate-50 active:scale-95 sm:flex-none"
            >
              <Plus className="h-4 w-4 text-[#1755A7]" />
              <span>Add Email</span>
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] via-[#1A5EB7] to-[#2563EB] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 transition-all hover:from-[#124282] hover:to-[#1D4ED8] active:scale-95 sm:w-auto"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Import CSV / Excel</span>
            </button>
          </div>
        }
      />

      {notice && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="shrink-0 text-emerald-600 hover:text-emerald-800" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {actionError ? (
        <div className="mt-4">
          <ErrorBanner error={actionError} />
        </div>
      ) : null}

      {showImportModal && (
        <ImportCsvModal
          onClose={() => setShowImportModal(false)}
          onImported={(s) => {
            setShowImportModal(false);
            refresh();
            setNotice(`Roster processed: ${s.addedCount} new emails added, ${s.updatedCount} existing entries updated${s.invalidCount ? `, ${s.invalidCount} invalid skipped` : ""}.`);
          }}
        />
      )}

      {showAddSingleModal && (
        <AddSingleEmailModal
          onClose={() => setShowAddSingleModal(false)}
          onAdded={(email) => {
            setShowAddSingleModal(false);
            refresh();
            setNotice(`Access granted for "${email}".`);
          }}
        />
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-4 shadow-sm sm:p-5">
            <div className={`absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${k.bar}`} />
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-500">{k.label}</span>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9 ${k.tone}`}>
                <k.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:mt-3 sm:text-3xl">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search email, name, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-h-10 w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 md:flex md:items-center">
            <div className="md:w-40">
              <CustomSelect
                value={roleFilter}
                onChange={setRoleFilter}
                options={[
                  { label: "All Roles", value: "ALL" },
                  { label: "Students", value: "STUDENT" },
                  { label: "Mentors", value: "MENTOR" },
                  { label: "Admins", value: "ADMIN" },
                ]}
              />
            </div>
            <div className="md:w-40">
              <CustomSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { label: "All Statuses", value: "ALL" },
                  { label: "Access Granted", value: "AUTHORIZED" },
                  { label: "Suspended", value: "SUSPENDED" },
                ]}
              />
            </div>
          </div>
        </div>

        {list.isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner label="Loading users..." />
          </div>
        ) : list.isError ? (
          <ErrorBanner error={list.error} />
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
            <ShieldAlert className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p className="font-bold text-slate-700">No users found.</p>
            <p className="mt-1 text-xs text-slate-400">Add an email to grant access.</p>
          </div>
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <div className="space-y-3 md:hidden">
              {items.map((w) => (
                <div key={w.email} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <Avatar w={w} />
                    <div className="min-w-0 flex-1">
                      <p className="break-all text-[13px] font-bold text-slate-900">{w.email}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{w.fullName || "Unspecified User"}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${ROLE_STYLE[w.role]}`}>{w.role}</span>
                        <StatusPill status={w.status} />
                      </div>
                      <p className="mt-1.5 text-[11px] text-slate-500">
                        {w.department || "No department"}
                        {w.year ? ` • Year ${w.year}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <ToggleButton w={w} pending={toggle.isPending} onClick={() => toggle.mutate(w)} className="flex-1" />
                    <DeleteButton w={w} pending={remove.isPending} onClick={() => remove.mutate(w.email)} />
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-3.5">User</th>
                    <th className="px-6 py-3.5">Assigned Role & Department</th>
                    <th className="px-6 py-3.5 text-center">Access Status</th>
                    <th className="px-6 py-3.5 text-right">Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((w) => (
                    <tr key={w.email} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <Avatar w={w} />
                          <div className="min-w-0">
                            <span className="break-all text-[13px] font-bold text-slate-900">{w.email}</span>
                            <p className="mt-0.5 text-xs text-slate-500">{w.fullName || "Unspecified User"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${ROLE_STYLE[w.role]}`}>{w.role}</span>
                          <span className="text-[11px] text-slate-500">
                            {w.department || "No department"}
                            {w.year ? ` • Year ${w.year}` : ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusPill status={w.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <ToggleButton w={w} pending={toggle.isPending} onClick={() => toggle.mutate(w)} />
                          <DeleteButton w={w} pending={remove.isPending} onClick={() => remove.mutate(w.email)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </ConsoleShell>
  );
}

function Avatar({ w }: { w: WhitelistEntryResponse }) {
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
        w.status === "AUTHORIZED" ? "bg-[#1755A7]/10 text-[#1755A7]" : "bg-rose-50 text-rose-700"
      }`}
    >
      {(w.fullName || w.email).charAt(0).toUpperCase()}
    </div>
  );
}

function StatusPill({ status }: { status: WhitelistEntryResponse["status"] }) {
  return status === "AUTHORIZED" ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
      Granted
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
      <Lock className="h-3 w-3" />
      Suspended
    </span>
  );
}

function ToggleButton({ w, pending, onClick, className = "" }: { w: WhitelistEntryResponse; pending: boolean; onClick: () => void; className?: string }) {
  const active = w.status === "AUTHORIZED";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      title={active ? "Suspend Access" : "Grant Access"}
      className={`inline-flex min-h-10 items-center justify-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 ${
        active
          ? "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
          : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
      } ${className}`}
    >
      {active ? (
        <>
          <Lock className="h-3.5 w-3.5" /> Suspend
        </>
      ) : (
        <>
          <Unlock className="h-3.5 w-3.5" /> Grant
        </>
      )}
    </button>
  );
}

function DeleteButton({ w, pending, onClick }: { w: WhitelistEntryResponse; pending: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (window.confirm(`Remove ${w.email} from the access list? They will no longer be able to sign in.`)) onClick();
      }}
      title="Delete from list"
      aria-label={`Remove ${w.email}`}
      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 transition-all hover:bg-rose-100 active:scale-95 disabled:opacity-50"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
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
  const [parsedRows, setParsedRows] = useState<RosterRow[]>([]);
  const [role, setRole] = useState<WhitelistRole>("STUDENT");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importRoster = useMutation({
    mutationFn: () => adminWhitelistApi.import({ rows: parsedRows, role, source: file?.name || "Manual CSV Import" }),
    onSuccess: onImported,
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    try {
      setParsedRows(await parseRosterFile(selected));
      setRawText(/\.xlsx?$/i.test(selected.name) ? "" : await selected.text());
    } catch {
      setParsedRows([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-xs animate-in fade-in duration-200 sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-[#1755A7] via-[#1E40AF] to-[#2563EB] px-4 py-4 text-white sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#F8C401]">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold">Import CSV / Excel Roster</h3>
              <p className="text-xs text-blue-100">Grant portal access to the email addresses in this sheet</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-6 text-center transition-colors hover:border-[#1755A7] hover:bg-blue-50/30"
          >
            <input ref={fileInputRef} type="file" accept=".csv, .xlsx, .xls, .txt" onChange={handleFileChange} className="hidden" />
            <div className="flex flex-col items-center">
              <Upload className="mb-2 h-8 w-8 text-[#1755A7]" />
              <p className="break-all text-xs font-bold text-slate-800">{file ? file.name : "Tap to select a CSV or Excel sheet"}</p>
              <p className="mt-1 text-[11px] text-slate-500">Supports .csv, .xlsx, .xls with columns: Name, Email, Department, Year (extra columns ignored)</p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <span>Or paste an email list (comma / newline separated)</span>
            </label>
            <textarea
              rows={3}
              placeholder={"Name,Email,Department,Year\nAsha K,asha@sece.ac.in,CSE,2"}
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                setParsedRows(parseRosterText(e.target.value));
              }}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Role for everyone in this roster</label>
            <CustomSelect
              value={role}
              onChange={(v) => setRole(v as WhitelistRole)}
              options={[
                { label: "Student Scholar", value: "STUDENT" },
                { label: "Faculty Mentor", value: "MENTOR" },
                { label: "Platform Admin", value: "ADMIN" },
              ]}
            />
          </div>

          {parsedRows.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="font-bold text-emerald-900">Detected {parsedRows.length} valid email addresses</span>
              </div>
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-700">Ready to authorize</span>
            </div>
          )}

          {parsedRows.length > 0 && (
            <div className="max-h-44 overflow-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[420px] text-left text-[11px]">
                <thead className="sticky top-0 bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Department</th>
                    <th className="px-3 py-2">Year</th>
                  </tr>
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

          {importRoster.isError ? <ErrorBanner error={importRoster.error} /> : null}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-6">
          <button type="button" onClick={onClose} className="min-h-10 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 active:scale-95">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => importRoster.mutate()}
            disabled={parsedRows.length === 0 || importRoster.isPending}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#2563EB] px-5 py-2 text-xs font-bold text-white shadow-2xs transition-all hover:from-[#124282] hover:to-[#1D4ED8] active:scale-95 disabled:opacity-50"
          >
            {importRoster.isPending ? "Processing roster..." : `Grant Access to ${parsedRows.length} Emails`}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddSingleEmailModal({ onClose, onAdded }: { onClose: () => void; onAdded: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<WhitelistRole>("STUDENT");
  const [department, setDepartment] = useState("");

  const add = useMutation({
    mutationFn: () =>
      adminWhitelistApi.add({
        email: email.trim(),
        fullName: fullName.trim() || undefined,
        role,
        department: department || undefined,
      }),
    onSuccess: (r) => {
      if (r.invalidCount > 0) return;
      onAdded(email.trim());
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-xs animate-in fade-in duration-200 sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-[#1755A7] via-[#1E40AF] to-[#2563EB] px-4 py-4 text-white sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#F8C401]">
              <Plus className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold">Whitelist Single Email</h3>
              <p className="text-xs text-blue-100">Authorize access for an individual scholar or mentor</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) add.mutate();
          }}
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6"
        >
          {add.isError ? <ErrorBanner error={add.error} /> : null}
          {add.isSuccess && add.data.invalidCount > 0 ? <ErrorBanner error={new Error("That does not look like a valid email address.")} /> : null}

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <span>
                Institutional Email Address <span className="text-red-500">*</span>
              </span>
            </label>
            <input type="email" required placeholder="scholar@sece.ac.in" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <span>Full Name</span>
            </label>
            <input placeholder="E.g. Sasikiran V." value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Role Privilege</label>
              <CustomSelect
                value={role}
                onChange={(v) => setRole(v as WhitelistRole)}
                options={[
                  { label: "Student Scholar", value: "STUDENT" },
                  { label: "Faculty Mentor", value: "MENTOR" },
                  { label: "Platform Admin", value: "ADMIN" },
                ]}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Department</label>
              <CustomSelect
                value={department}
                onChange={setDepartment}
                options={[{ label: "Select Department...", value: "" }, ...departmentOptions(department).map((d) => ({ label: d, value: d }))]}
              />
            </div>
          </div>

          <div className="mt-2 flex flex-col-reverse gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <button type="button" onClick={onClose} className="min-h-10 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 active:scale-95">
              Cancel
            </button>
            <button
              type="submit"
              disabled={add.isPending}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#2563EB] px-5 py-2 text-xs font-bold text-white shadow-2xs transition-all hover:from-[#124282] hover:to-[#1D4ED8] active:scale-95 disabled:opacity-50"
            >
              {add.isPending ? "Saving..." : "Authorize & Whitelist Email"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
