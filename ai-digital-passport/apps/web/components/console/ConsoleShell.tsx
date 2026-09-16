"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Award, BookOpen, Building2, ChartNoAxesColumn, ClipboardCheck, Cpu, FileClock, Gauge, GraduationCap, ListChecks, LogOut, Rocket, ScrollText, ShieldCheck, Trophy, Users } from "lucide-react";
import { authApi } from "../../lib/api";
import { useMe, useSession } from "../../lib/session";
import { Spinner } from "../ui/Spinner";

export interface ConsoleNavItem {
  href: string;
  label: string;
  icon?: typeof Gauge;
}

const MENTOR_NAV: ConsoleNavItem[] = [
  { href: "/mentor", label: "Dashboard", icon: Gauge },
  { href: "/mentor/queue", label: "Queue", icon: ClipboardCheck },
  { href: "/mentor/course-catalog", label: "Course Catalog", icon: BookOpen },
  { href: "/mentor/courses", label: "Course Submissions", icon: ListChecks },
  { href: "/mentor/proctoring-locks", label: "Proctoring Locks", icon: ShieldCheck },
  { href: "/mentor/startups", label: "Startups", icon: Rocket },
];

const ADMIN_NAV: ConsoleNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: Gauge },
  { href: "/admin/events", label: "Events", icon: FileClock },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/gpu", label: "GPU", icon: Cpu },
  { href: "/admin/hackathons", label: "Hackathons", icon: Trophy },
  { href: "/admin/research", label: "Research", icon: ScrollText },
  { href: "/admin/problems", label: "Problems", icon: ClipboardCheck },
  { href: "/admin/industry", label: "Industry", icon: Building2 },
  { href: "/admin/awards", label: "Awards", icon: Award },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/scoring", label: "Scoring", icon: ChartNoAxesColumn },
  { href: "/admin/reports", label: "Reports", icon: ChartNoAxesColumn },
  { href: "/admin/audit", label: "Audit", icon: ShieldCheck },
  { href: "/admin/logs", label: "Logs", icon: ListChecks },
];

/**
 * Mentor/Admin shell — sidebar + dense table layout. Both roles share
 * this shell; only the sidebar nav and required role differ.
 */
export function ConsoleShell({ role, children }: { role: "MENTOR" | "ADMIN"; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const session = useSession();
  const onboarded = session.data?.authenticated && session.data.onboarded;
  const me = useMe(!!onboarded);
  const nav = role === "MENTOR" ? MENTOR_NAV : ADMIN_NAV;

  async function handleLogout() {
    await authApi.logout();
    await queryClient.invalidateQueries();
    router.replace("/login");
  }

  useEffect(() => {
    if (session.isLoading) return;
    if (!session.data?.authenticated) {
      router.replace("/login");
      return;
    }
    if (!session.data.onboarded) {
      router.replace("/onboarding");
      return;
    }
    if (me.data && !me.data.roles.includes(role)) {
      router.replace("/dashboard");
    }
  }, [session.isLoading, session.data, me.data, role, router]);

  if (session.isLoading || !onboarded || me.isLoading || !me.data || !me.data.roles.includes(role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-muted">
        <Spinner label="Loading console…" />
      </div>
    );
  }

  const otherRoles = me.data.roles.filter((r) => r !== role);

  return (
    <div className="flex min-h-screen text-ink">
      <aside className="flex w-64 shrink-0 flex-col gap-1 border-r border-white/70 bg-white/85 p-4 shadow-[14px_0_45px_rgba(11,18,32,0.06)] backdrop-blur-xl">
        <div className="mb-6 flex items-center gap-3 px-2 text-h2 text-ink">
          <span className="flex h-11 w-11 items-center justify-center rounded-card bg-accent text-white shadow-[0_10px_28px_rgba(118,185,0,0.30)]">
            <GraduationCap className="h-5 w-5" />
          </span>
          <div>
            <div className="font-bold">AI Passport</div>
            <div className="text-caption text-text-muted">{role === "ADMIN" ? "Admin console" : "Mentor console"}</div>
          </div>
        </div>
        {nav.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                "inline-flex items-center gap-3 rounded-card px-3 py-2.5 text-caption transition-fast " +
                (active ? "bg-accent text-white shadow-[0_12px_28px_rgba(118,185,0,0.30)] font-semibold" : "text-text-muted hover:bg-surface-muted hover:text-ink")
              }
            >
              {Icon ? <Icon className="h-4 w-4" /> : null}
              {item.label}
            </Link>
          );
        })}

        <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
          {otherRoles.includes("ADMIN") && role !== "ADMIN" ? (
            <Link href="/admin" className="px-3 text-caption text-text-muted hover:text-accent">
              Admin console
            </Link>
          ) : null}
          {otherRoles.includes("MENTOR") && role !== "MENTOR" ? (
            <Link href="/mentor" className="px-3 text-caption text-text-muted hover:text-accent">
              Mentor console
            </Link>
          ) : null}
          <span className="px-3 text-caption text-text-muted">{me.data.fullName}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-card px-3 py-2 text-left text-caption text-text-muted hover:bg-surface-muted hover:text-ink"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>
      <main className="max-w-console flex-1 overflow-x-auto p-8">{children}</main>
    </div>
  );
}
