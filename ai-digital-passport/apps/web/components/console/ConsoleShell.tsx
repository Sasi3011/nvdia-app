"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  LayoutDashboard, Inbox, Library, FileCheck, Lock, Briefcase, 
  Calendar, BookOpen, Server, Flag, Microscope, FileQuestion, 
  Building, Medal, Users, Calculator, PieChart, ClipboardList, Activity,
  LogOut, Hexagon
} from "lucide-react";
import { authApi } from "../../lib/api";
import { useMe, useSession } from "../../lib/session";
import { Spinner } from "../ui/Spinner";

export interface ConsoleNavItem {
  href: string;
  label: string;
  icon?: typeof LayoutDashboard;
}

const MENTOR_NAV: ConsoleNavItem[] = [
  { href: "/mentor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/mentor/queue", label: "Queue", icon: Inbox },
  { href: "/mentor/course-catalog", label: "Course Catalog", icon: Library },
  { href: "/mentor/courses", label: "Course Submissions", icon: FileCheck },
  { href: "/mentor/proctoring-locks", label: "Proctoring Locks", icon: Lock },
  { href: "/mentor/startups", label: "Startups", icon: Briefcase },
];

const ADMIN_NAV: ConsoleNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/events", label: "Events", icon: Calendar },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/gpu", label: "GPU", icon: Server },
  { href: "/admin/hackathons", label: "Hackathons", icon: Flag },
  { href: "/admin/research", label: "Research", icon: Microscope },
  { href: "/admin/problems", label: "Problems", icon: FileQuestion },
  { href: "/admin/industry", label: "Industry", icon: Building },
  { href: "/admin/awards", label: "Awards", icon: Medal },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/scoring", label: "Scoring", icon: Calculator },
  { href: "/admin/reports", label: "Reports", icon: PieChart },
  { href: "/admin/audit", label: "Audit", icon: ClipboardList },
  { href: "/admin/logs", label: "Logs", icon: Activity },
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
    <div className="min-h-screen bg-surface-muted font-sans text-ink">
      {/* Sidebar Navigation */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-border bg-white py-4 pl-4 shadow-sm">
        <div className="mb-6 flex shrink-0 items-center gap-3 pr-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-white">
            <Hexagon className="h-6 w-6" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[16px] font-bold text-ink">Sri Eshwar NVIDIA</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">Portal</span>
          </div>
        </div>
        
        {/* Scrollable Navigation Area */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto pr-4 minute-scrollbar">
          {nav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "inline-flex shrink-0 items-center gap-3 rounded-lg px-4 py-3 text-[14px] transition-all " +
                  (active ? "bg-accent font-semibold text-white shadow-sm" : "font-medium text-text-muted hover:bg-surface-muted hover:text-ink")
                }
              >
                {Icon ? <Icon className="h-5 w-5 shrink-0" /> : null}
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Anchored Bottom Profile / Actions */}
        <div className="mt-4 flex shrink-0 flex-col gap-2 border-t border-border pt-4 pr-4">
          {otherRoles.includes("ADMIN") && role !== "ADMIN" ? (
            <Link href="/admin" className="px-3 text-[13px] font-medium text-text-muted hover:text-accent">
              Admin console
            </Link>
          ) : null}
          {otherRoles.includes("MENTOR") && role !== "MENTOR" ? (
            <Link href="/mentor" className="px-3 text-[13px] font-medium text-text-muted hover:text-accent">
              Mentor console
            </Link>
          ) : null}
          <div className="mt-2 flex items-center justify-between px-3">
             <div className="flex flex-col overflow-hidden pr-2">
               <span className="truncate text-[13px] font-bold text-ink">{me.data.fullName}</span>
             </div>
             <button
              type="button"
              onClick={handleLogout}
              className="flex shrink-0 h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-text-muted transition-colors hover:bg-accent hover:text-white"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area (Offset by sidebar width) */}
      <main className="w-full pl-64 min-h-screen">
        <div className="mx-auto w-full max-w-[1400px] p-6 desktop:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
