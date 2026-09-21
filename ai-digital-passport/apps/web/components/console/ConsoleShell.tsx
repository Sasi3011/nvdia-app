"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, Inbox, Library, FileCheck, Lock, Briefcase,
  Calendar, BookOpen, Server, Flag, Microscope, FileQuestion,
  Building, Medal, Users, Calculator, PieChart, ClipboardList,
  LogOut, Menu, Shield, X, Trophy, Rocket, ChevronRight, UserCheck, Sparkles, TrendingUp
} from "lucide-react";
import { authApi } from "../../lib/api";
import { useMe, useSession } from "../../lib/session";
import { Spinner } from "../ui/Spinner";

export interface ConsoleNavGroup {
  label?: string;
  items: {
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
    badge?: string;
  }[];
}

const ADMIN_NAV_GROUPS: ConsoleNavGroup[] = [
  {
    label: "Supercomputing & Operations",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/gpu", label: "GPU Supercluster", icon: Server, badge: "Live" },
      { href: "/admin/events", label: "CoE Classes", icon: Calendar },
      { href: "/admin/courses", label: "Courses & Curricula", icon: BookOpen },
    ],
  },
  {
    label: "Programs & Research",
    items: [
      { href: "/admin/hackathons", label: "Hackathons", icon: Flag },
      { href: "/admin/startups", label: "Startup Launchpad", icon: Rocket },
      { href: "/admin/problems", label: "Industry Problems", icon: FileQuestion },
      { href: "/admin/industry", label: "Industry GPU Requests", icon: Building },
      { href: "/admin/awards", label: "Awards", icon: Medal },
    ],
  },
  {
    label: "Governance & Analytics",
    items: [
      { href: "/admin/students", label: "Student Progress", icon: TrendingUp },
      { href: "/admin/users", label: "User Management", icon: Users },
      { href: "/admin/scoring", label: "Scoring Matrix", icon: Calculator },
      { href: "/admin/leaderboard", label: "Leaderboard", icon: Trophy },
      { href: "/admin/reports", label: "Reports & Analytics", icon: PieChart },
    ],
  },
];

const MENTOR_NAV_GROUPS: ConsoleNavGroup[] = [
  {
    label: "Mentor Operations",
    items: [
      { href: "/mentor", label: "Dashboard", icon: LayoutDashboard },
      { href: "/mentor/queue", label: "Verification Queue", icon: Inbox },
      { href: "/mentor/students", label: "Student Progress", icon: TrendingUp },
      { href: "/mentor/course-catalog", label: "Course Catalog", icon: Library },
      { href: "/mentor/courses", label: "Course Submissions", icon: FileCheck },
      { href: "/mentor/startups", label: "Student Startups", icon: Briefcase },
      { href: "/mentor/hackathons", label: "Hackathons", icon: Flag },
      { href: "/mentor/leaderboard", label: "Leaderboard", icon: Trophy },
      { href: "/mentor/awards", label: "Awards", icon: Medal },
    ],
  },
];

export function ConsoleShell({ role, children }: { role: "MENTOR" | "ADMIN"; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const session = useSession();
  const onboarded = session.data?.authenticated && session.data.onboarded;
  const me = useMe(!!onboarded);
  const groups = role === "ADMIN" ? ADMIN_NAV_GROUPS : MENTOR_NAV_GROUPS;

  // Off-canvas drawer state for < lg screens.
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const menuButton = menuButtonRef.current;
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      menuButton?.focus();
    };
  }, [menuOpen]);

  async function handleLogout() {
    await authApi.logout();
    await queryClient.invalidateQueries();
    router.replace("/");
  }

  useEffect(() => {
    if (session.isLoading) return;
    if (!session.data?.authenticated) {
      router.replace("/");
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner label="Loading console…" />
      </div>
    );
  }

  const otherRoles = me.data.roles.filter((r) => r !== role);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 antialiased selection:bg-[#1755A7] selection:text-white">
      {/* Mobile top bar (< lg) */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200/90 bg-white/95 px-3 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] backdrop-blur lg:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            aria-controls="console-sidebar"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 active:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <img src="/Eswar.png" alt="" className="h-8 w-8 shrink-0 object-contain" />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[13px] font-black tracking-tight text-slate-900">Sri Eshwar NVIDIA</div>
            <div className="truncate text-[10px] font-bold text-[#1755A7]">{role === "ADMIN" ? "Admin Console" : "Mentor Console"}</div>
          </div>
        </div>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1755A7] text-xs font-bold text-white"
          title={me.data.fullName}
          aria-hidden="true"
        >
          {me.data.fullName.charAt(0)}
        </div>
      </header>

      {/* Drawer backdrop (< lg) */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={() => setMenuOpen(false)} aria-hidden="true" />
      )}

      {/* Sidebar Navigation: fixed on lg+, off-canvas drawer below */}
      <aside
        id="console-sidebar"
        aria-label="Console navigation"
        className={
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-slate-200/90 bg-white shadow-xs transition-transform duration-200 ease-out " +
          "pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] lg:z-30 lg:translate-x-0 lg:pb-0 lg:pt-0 " +
          (menuOpen ? "translate-x-0" : "max-lg:invisible max-lg:-translate-x-full")
        }
      >

        {/* Header Branding */}
        <div className="flex items-center gap-3.5 border-b border-slate-100 px-5 py-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 p-1 border border-slate-200/80 shadow-2xs">
            <img src="/Eswar.png" alt="Sri Eshwar Logo" className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[14px] font-black tracking-tight text-slate-900">Sri Eshwar NVIDIA</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#1755A7]/10 px-2 py-0.5 text-[10px] font-bold text-[#1755A7]">
                <Shield className="h-2.5 w-2.5" />
                {role === "ADMIN" ? "Admin Console" : "Mentor Console"}
              </span>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation menu"
            className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links Grouped */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 minute-scrollbar">
          {groups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              {group.label && (
                <div className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  {group.label}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={
                        "group relative flex min-h-[44px] items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all lg:min-h-0 " +
                        (active
                          ? "bg-[#1755A7] text-white shadow-sm shadow-[#1755A7]/25"
                          : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900")
                      }
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-[#F8C401]" : "text-slate-400 group-hover:text-[#1755A7]"}`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide uppercase ${
                          active
                            ? "bg-[#F8C401] text-slate-900"
                            : "bg-[#1755A7]/10 text-[#1755A7]"
                        }`}>
                          {item.badge}
                        </span>
                      )}

                      {/* Active Left Indicator Bar */}
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-[#F8C401]" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Anchored Bottom User Profile & Console Switcher */}
        <div className="border-t border-slate-100 bg-slate-50/50 p-3.5">
          {otherRoles.length > 0 && (
            <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-white p-1 border border-slate-200/80 text-[11px] font-bold">
              <span className="px-2 text-slate-400 text-[10px] uppercase">Switch:</span>
              {otherRoles.includes("ADMIN") && role !== "ADMIN" && (
                <Link href="/admin" className="flex-1 rounded-md px-2 py-1 text-center text-[#1755A7] hover:bg-[#1755A7]/10 transition-colors">
                  Admin
                </Link>
              )}
              {otherRoles.includes("MENTOR") && role !== "MENTOR" && (
                <Link href="/mentor" className="flex-1 rounded-md px-2 py-1 text-center text-[#1755A7] hover:bg-[#1755A7]/10 transition-colors">
                  Mentor
                </Link>
              )}
              <Link href="/dashboard" className="flex-1 rounded-md px-2 py-2 text-center text-slate-600 hover:bg-slate-100 transition-colors lg:py-1">
                Student View
              </Link>
            </div>
          )}

          <div className="flex items-center justify-between gap-2.5 rounded-xl bg-white p-2.5 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1755A7] font-bold text-white text-xs">
                {me.data.fullName.charAt(0)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-xs font-bold text-slate-900 leading-tight">{me.data.fullName}</span>
                <span className="truncate text-[10px] font-medium text-slate-400">{me.data.email}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-red-50 hover:text-red-600 lg:h-8 lg:w-8"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area (offset by the 18rem sidebar on lg+) */}
      <main className="min-h-screen w-full min-w-0 overflow-x-clip lg:pl-72">
        <div className="mx-auto w-full min-w-0 max-w-[1440px] px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-4 sm:px-6 sm:pt-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
