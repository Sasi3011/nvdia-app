"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Award, Bell, BookOpen, Cpu, Gauge, GraduationCap, LogOut, ScanLine, Trophy, Users, Hexagon, FileCheck } from "lucide-react";
import { authApi } from "../../lib/api";
import { useMe, useSession } from "../../lib/session";
import { Spinner } from "../ui/Spinner";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/gpu", label: "GPU", icon: Cpu },
  { href: "/industry", label: "Industry", icon: Users },
  { href: "/awards", label: "Awards", icon: Award },
  { href: "/claims", label: "Claims", icon: FileCheck },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/scan", label: "Scan", icon: ScanLine },
];

export function StudentShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const session = useSession();
  const onboarded = session.data?.authenticated && session.data.onboarded;
  const me = useMe(!!onboarded);

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
    const roles = session.data.roles ?? [];
    if (roles.includes("ADMIN")) {
      router.replace("/admin");
      return;
    }
    if (roles.includes("MENTOR")) {
      router.replace("/mentor");
    }
  }, [session.isLoading, session.data, router]);

  if (session.isLoading || !onboarded || me.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Loading your passport…" />
      </div>
    );
  }

  const profile = me.data;

  return (
    <div className="min-h-screen bg-surface-muted font-sans text-ink">
      {/* Sidebar Navigation */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-border bg-white py-4 pl-4 shadow-sm">
        <div className="mb-6 flex shrink-0 items-center gap-3 pr-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-white">
            <Hexagon className="h-6 w-6" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[15px] font-bold text-ink">Sri Eshwar NVIDIA</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">Student</span>
          </div>
        </div>
        
        {/* Scrollable Navigation Area */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto pr-4 minute-scrollbar">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  "inline-flex shrink-0 items-center gap-3 rounded-lg px-4 py-3 text-[14px] transition-all " +
                  (active ? "bg-accent font-semibold text-white shadow-sm" : "font-medium text-text-muted hover:bg-surface-muted hover:text-ink")
                }
              >
                {Icon ? <Icon className="h-5 w-5 shrink-0" /> : null}
                <span className="truncate">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Anchored Bottom Profile / Actions */}
        <div className="mt-4 flex shrink-0 flex-col gap-4 border-t border-border pt-4 pr-4">
          {profile ? (
            <div className="flex flex-col gap-1 px-3 text-[12px] font-medium text-text-muted">
              <div className="flex items-center justify-between">
                <span>Level {profile.level.levelId}</span>
                <span className="font-bold text-ink">{profile.totalPoints.toLocaleString()} pts</span>
              </div>
              <div className="flex items-center justify-between">
                <span>GPU Credits</span>
                <span className="font-bold text-ink">{profile.gpuCreditBalance.toLocaleString()}</span>
              </div>
            </div>
          ) : null}

          <div className="mt-2 flex items-center justify-between px-3">
             <div className="flex flex-col overflow-hidden pr-2">
               <span className="truncate text-[13px] font-bold text-ink">{profile?.fullName || "Student"}</span>
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
        <div className="mx-auto w-full max-w-student p-6 desktop:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
