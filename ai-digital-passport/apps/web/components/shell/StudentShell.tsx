"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Award, Bell, BookOpen, Cpu, Gauge, GraduationCap, LogOut, ScanLine, Trophy, Users } from "lucide-react";
import { authApi } from "../../lib/api";
import { useMe, useSession } from "../../lib/session";
import { Spinner } from "../ui/Spinner";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/gpu", label: "GPU", icon: Cpu },
  { href: "/industry", label: "Industry", icon: Users },
  { href: "/awards", label: "Awards", icon: Award },
  { href: "/claims", label: "Claims" },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/scan", label: "Scan", icon: ScanLine },
];

// Student shell — card-forward, personal (design system 18.1/18.5). The
// header/passport strip is "always visible once logged in" (spec 01
// Section 4): name, level, points, GPU credits.
export function StudentShell({ children }: { children: ReactNode }) {
  const router = useRouter();
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
    <div className="min-h-screen text-ink">
      <header className="sticky top-0 z-50 border-b border-white/70 bg-white/80 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-student flex-wrap items-center justify-between gap-3 px-4 py-3 tablet:px-6">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-3 text-h2 text-ink">
              <span className="flex h-10 w-10 items-center justify-center rounded-card bg-accent text-white shadow-[0_10px_28px_rgba(118,185,0,0.30)]">
                <GraduationCap className="h-5 w-5" />
              </span>
              <span className="font-bold">AI Passport</span>
            </Link>
            <nav className="hidden items-center gap-4 tablet:flex">
              {NAV_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                <Link key={link.href} href={link.href} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-caption text-text-muted hover:bg-surface-muted hover:text-ink">
                  {Icon ? <Icon className="h-4 w-4" /> : null}
                  {link.label}
                </Link>
              );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {profile ? (
              <div className="hidden items-center gap-3 font-mono text-caption text-text-muted tablet:flex">
                <span className="rounded-chip border border-accent/30 bg-accent/10 px-2 py-0.5 text-accent">Level {profile.level.levelId}</span>
                <span aria-hidden>·</span>
                <span><strong className="text-ink">{profile.totalPoints.toLocaleString()}</strong> pts</span>
                <span aria-hidden>·</span>
                <span><strong className="text-ink">{profile.gpuCreditBalance.toLocaleString()}</strong> GPU</span>
              </div>
            ) : null}
            <Link href="/notifications" aria-label="Notifications" className="rounded-full p-2 text-text-muted transition-fast hover:bg-accent/10 hover:text-accent">
              <Bell className="h-5 w-5" />
            </Link>
            <Link href="/profile" className="flex items-center gap-2 text-body text-ink hover:text-accent">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-caption font-semibold text-accent">
                {profile?.fullName?.[0]?.toUpperCase() ?? "?"}
              </span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-caption text-text-muted hover:bg-surface-muted hover:text-ink"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-student px-4 py-8 tablet:px-6">{children}</main>
    </div>
  );
}
