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

const inputClass = "rounded-card border border-border bg-surface px-3 py-2 text-body text-ink placeholder:text-text-muted";

// Page 27 — User & Role Management (spec 02 Section 6.4). Point/GPU-credit
// corrections always require a mandatory audit reason (Section 21.1).
export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<AdminUserResponse | null>(null);
  const users = useQuery({ queryKey: ["admin", "users", q], queryFn: () => adminUsersApi.search({ q: q || undefined, page: 1, pageSize: 50 }) });

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader title="User & Role Management" description="Search students, assign roles, and correct points/credits." />

      <input
        placeholder="Search by name, email, or register number…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className={inputClass + " mb-4 w-full max-w-md"}
      />

      <div className="grid grid-cols-1 gap-6 desktop:grid-cols-2">
        {users.isLoading ? (
          <Spinner />
        ) : users.isError ? (
          <ErrorBanner error={users.error} />
        ) : (
          <ConsoleCard className="divide-y divide-navy-700 p-0">
            {(users.data?.items ?? []).map((u) => (
              <button
                key={u.userId}
                onClick={() => setSelected(u)}
                className={"flex w-full items-center justify-between px-6 py-4 text-left hover:bg-surface-muted " + (selected?.userId === u.userId ? "bg-surface-muted" : "")}
              >
                <div>
                  <div className="text-body text-ink">{u.fullName}</div>
                  <div className="text-caption text-text-muted">
                    {u.email} · {u.registerNum} · {u.levelName}
                  </div>
                </div>
                <div className="flex gap-1">
                  {u.roles.map((r) => (
                    <span key={r} className="rounded-chip bg-surface-muted px-2 py-1 font-mono text-caption text-ink">
                      {r}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </ConsoleCard>
        )}

        {selected ? (
          <UserActions
            user={selected}
            onChanged={(u) => setSelected(u)}
          />
        ) : (
          <p className="text-body text-text-muted">Select a user to manage roles and corrections.</p>
        )}
      </div>
    </ConsoleShell>
  );
}

function UserActions({ user, onChanged }: { user: AdminUserResponse; onChanged: (u: AdminUserResponse) => void }) {
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
    <ConsoleCard className="flex flex-col gap-6">
      <div>
        <h2 className="text-h2 text-ink">{user.fullName}</h2>
        <p className="font-mono text-caption text-text-muted">
          {user.totalPoints.toLocaleString()} pts · {user.gpuCreditBalance.toLocaleString()} GPU credits
        </p>
      </div>

      {error ? <ErrorBanner error={error} /> : null}

      <div className="border-t border-navy-700 pt-4">
        <h3 className="mb-2 text-caption text-text-muted">Assign role</h3>
        <div className="flex gap-2">
          <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className={inputClass}>
            {Object.values(UserRole).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <Button variant="secondary" disabled={assignRole.isPending} onClick={() => assignRole.mutate()}>
            Assign
          </Button>
        </div>
      </div>

      <form
        className="border-t border-navy-700 pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          adjustPoints.mutate();
        }}
      >
        <h3 className="mb-2 text-caption text-text-muted">Adjust points</h3>
        <div className="flex flex-col gap-2">
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
            placeholder="Reason (required, audited)"
            value={pointsReason}
            onChange={(e) => setPointsReason(e.target.value)}
            className={inputClass}
          />
          <Button type="submit" variant="secondary" disabled={adjustPoints.isPending || !pointsReason.trim()}>
            Apply
          </Button>
        </div>
      </form>

      {user.roles.includes("MENTOR") ? (
        <form
          className="border-t border-navy-700 pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            setDepartment.mutate();
          }}
        >
          <h3 className="mb-2 text-caption text-text-muted">Mentor department (one department, one mentor)</h3>
          <p className="mb-2 text-caption text-text-muted">
            Course-submission and proctoring-violation notifications for students in this department route to this mentor.
          </p>
          <div className="flex gap-2">
            <input
              placeholder={`e.g. ${user.department}`}
              value={mentorDepartment}
              onChange={(e) => setMentorDepartment(e.target.value)}
              className={inputClass + " flex-1"}
            />
            <Button type="submit" variant="secondary" disabled={setDepartment.isPending}>
              Save
            </Button>
          </div>
        </form>
      ) : null}

      <form
        className="border-t border-navy-700 pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          adjustCredits.mutate();
        }}
      >
        <h3 className="mb-2 text-caption text-text-muted">Adjust GPU credits</h3>
        <div className="flex flex-col gap-2">
          <input
            type="number"
            required
            placeholder="Delta"
            value={creditsDelta || ""}
            onChange={(e) => setCreditsDelta(Number(e.target.value))}
            className={inputClass}
          />
          <input
            required
            placeholder="Reason (required, audited)"
            value={creditsReason}
            onChange={(e) => setCreditsReason(e.target.value)}
            className={inputClass}
          />
          <Button type="submit" variant="secondary" disabled={adjustCredits.isPending || !creditsReason.trim()}>
            Apply
          </Button>
        </div>
      </form>
    </ConsoleCard>
  );
}
