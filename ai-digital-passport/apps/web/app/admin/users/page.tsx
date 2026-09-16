"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserRole } from "@ai-digital-passport/shared-types";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsoleCard } from "../../../components/console/ConsoleCard";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { Button } from "../../../components/ui/Button";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { adminMentorDepartmentApi, adminUsersApi, type AdminUserResponse } from "../../../lib/api";
import { UserCircle, Mail, ShieldAlert, Cpu, ArrowLeft, Search } from "lucide-react";

const inputClass = "w-full rounded-lg border border-border bg-white px-3 py-2.5 text-[14px] text-ink placeholder:text-gray-400 focus:border-[#1A56DB] focus:outline-none focus:ring-1 focus:ring-[#1A56DB]";

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<AdminUserResponse | null>(null);
  const users = useQuery({ queryKey: ["admin", "users", q], queryFn: () => adminUsersApi.search({ q: q || undefined, page: 1, pageSize: 50 }) });

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader title="User & Role Management" description="Search students, assign roles, and correct points/credits." />

      {selected ? (
        <div className="mt-6">
          <UserActions
            user={selected}
            onChanged={(u) => setSelected(u)}
            onBack={() => setSelected(null)}
          />
        </div>
      ) : (
        <>
          <div className="relative mb-6 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search by name, email, or register number…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className={`${inputClass} pl-9`}
            />
          </div>
          
          {users.isLoading ? (
            <Spinner />
          ) : users.isError ? (
            <ErrorBanner error={users.error} />
          ) : !users.data || users.data.items.length === 0 ? (
            <p className="text-[14px] text-text-muted">No users found.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
              <table className="w-full text-left text-[14px]">
                <thead className="bg-surface-muted text-[12px] font-bold uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Contact & Reg No</th>
                    <th className="px-6 py-4">Level & Roles</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.data.items.map((u) => (
                    <tr key={u.userId} className="group transition-colors hover:bg-blue-50/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1A56DB]/10 text-[#1A56DB]">
                            <UserCircle className="h-5 w-5" />
                          </div>
                          <span className="font-bold text-ink">{u.fullName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1.5 font-medium text-ink"><Mail className="h-3.5 w-3.5 text-gray-400" /> {u.email}</span>
                          <span className="text-[12px] text-text-muted">{u.registerNum}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-2">
                          <span className="font-bold text-[#1A56DB]">{u.levelName}</span>
                          <div className="flex flex-wrap gap-1">
                            {u.roles.map((r) => (
                              <span key={r} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-700">
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setSelected(u)}
                          className="inline-flex items-center justify-center rounded-lg bg-[#1A56DB] px-5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-[#1E429F]"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </ConsoleShell>
  );
}

function UserActions({ user, onChanged, onBack }: { user: AdminUserResponse; onChanged: (u: AdminUserResponse) => void; onBack: () => void }) {
  const queryClient = useQueryClient();
  const [role, setRole] = useState<UserRole>(UserRole.MENTOR);
  const [pointsDelta, setPointsDelta] = useState(0);
  const [pointsReason, setPointsReason] = useState("");
  const [creditsDelta, setCreditsDelta] = useState(0);
  const [creditsReason, setCreditsReason] = useState("");
  const [mentorDepartment, setMentorDepartment] = useState(user.mentorDepartment ?? "");
  const [error, setError] = useState<unknown>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] });

  const assignRole = useMutation({
    mutationFn: () => adminUsersApi.assignRole(user.userId, role),
    onSuccess: () => {
      onChanged({ ...user, roles: user.roles.includes(role) ? user.roles : [...user.roles, role] });
      refresh();
    },
    onError: setError,
  });

  const adjustPoints = useMutation({
    mutationFn: () => adminUsersApi.adjustPoints(user.userId, pointsDelta, pointsReason),
    onSuccess: (res) => {
      onChanged({ ...user, totalPoints: res.totalPoints });
      setPointsDelta(0);
      setPointsReason("");
      refresh();
    },
    onError: setError,
  });

  const adjustCredits = useMutation({
    mutationFn: () => adminUsersApi.adjustGpuCredits(user.userId, creditsDelta, creditsReason),
    onSuccess: (res) => {
      onChanged({ ...user, gpuCreditBalance: res.gpuCreditBalance });
      setCreditsDelta(0);
      setCreditsReason("");
      refresh();
    },
    onError: setError,
  });

  const setDepartment = useMutation({
    mutationFn: () => adminMentorDepartmentApi.set(user.userId, mentorDepartment.trim() || null),
    onSuccess: (res) => {
      onChanged({ ...user, mentorDepartment: res.mentorDepartment });
      refresh();
    },
    onError: setError,
  });

  return (
    <ConsoleCard className="flex flex-col gap-8 rounded-2xl border-border bg-white p-8 shadow-sm">
      <div className="flex items-start gap-4">
        <button 
          onClick={onBack} 
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-muted transition-colors hover:bg-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-[22px] font-bold text-ink">{user.fullName}</h2>
          <div className="mt-2 flex items-center gap-4 font-mono text-[13px] text-text-muted">
            <span className="flex items-center gap-1.5"><ShieldAlert className="h-4 w-4" /> {user.totalPoints.toLocaleString()} pts</span>
            <span className="flex items-center gap-1.5"><Cpu className="h-4 w-4" /> {user.gpuCreditBalance.toLocaleString()} GPU credits</span>
          </div>
        </div>
      </div>

      {error ? <ErrorBanner error={error} /> : null}

      <div className="border-t border-border pt-6">
        <h3 className="mb-4 text-[16px] font-bold text-ink">Assign Role</h3>
        <div className="flex flex-col gap-3 tablet:flex-row tablet:items-center">
          <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className={`${inputClass} tablet:max-w-[250px]`}>
            {Object.values(UserRole).map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <Button variant="primary" disabled={assignRole.isPending} onClick={() => assignRole.mutate()} className="w-full tablet:w-auto">
            Assign Role
          </Button>
        </div>
      </div>

      <form
        className="border-t border-border pt-6"
        onSubmit={(e) => {
          e.preventDefault();
          adjustPoints.mutate();
        }}
      >
        <h3 className="mb-4 text-[16px] font-bold text-ink">Adjust Points</h3>
        <div className="grid grid-cols-1 gap-3 tablet:grid-cols-3 tablet:items-start">
          <input
            type="number"
            required
            placeholder="Delta (e.g. -50 or 100)"
            value={pointsDelta || ""}
            onChange={(e) => setPointsDelta(Number(e.target.value))}
            className={inputClass}
          />
          <input
            required
            placeholder="Reason (required for audit)"
            value={pointsReason}
            onChange={(e) => setPointsReason(e.target.value)}
            className={inputClass}
          />
          <Button type="submit" variant="secondary" className="bg-white" disabled={adjustPoints.isPending || !pointsReason.trim()}>
            Apply Points
          </Button>
        </div>
      </form>

      {user.roles.includes("MENTOR") ? (
        <form
          className="border-t border-border pt-6"
          onSubmit={(e) => {
            e.preventDefault();
            setDepartment.mutate();
          }}
        >
          <h3 className="mb-2 text-[16px] font-bold text-ink">Mentor Department</h3>
          <p className="mb-4 text-[13px] text-text-muted">
            Course-submission and proctoring-violation notifications for students in this department route to this mentor.
          </p>
          <div className="flex flex-col gap-3 tablet:flex-row tablet:items-center">
            <input
              placeholder={`e.g. ${user.department}`}
              value={mentorDepartment}
              onChange={(e) => setMentorDepartment(e.target.value)}
              className={`${inputClass} tablet:max-w-[400px]`}
            />
            <Button type="submit" variant="secondary" className="bg-white" disabled={setDepartment.isPending}>
              Save Department
            </Button>
          </div>
        </form>
      ) : null}

      <form
        className="border-t border-border pt-6"
        onSubmit={(e) => {
          e.preventDefault();
          adjustCredits.mutate();
        }}
      >
        <h3 className="mb-4 text-[16px] font-bold text-ink">Adjust GPU Credits</h3>
        <div className="grid grid-cols-1 gap-3 tablet:grid-cols-3 tablet:items-start">
          <input
            type="number"
            required
            placeholder="Delta (e.g. 50)"
            value={creditsDelta || ""}
            onChange={(e) => setCreditsDelta(Number(e.target.value))}
            className={inputClass}
          />
          <input
            required
            placeholder="Reason (required for audit)"
            value={creditsReason}
            onChange={(e) => setCreditsReason(e.target.value)}
            className={inputClass}
          />
          <Button type="submit" variant="secondary" className="bg-white" disabled={adjustCredits.isPending || !creditsReason.trim()}>
            Apply Credits
          </Button>
        </div>
      </form>
    </ConsoleCard>
  );
}
