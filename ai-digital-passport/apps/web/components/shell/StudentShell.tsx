"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Award, 
  BookOpen, 
  Cpu, 
  Gauge, 
  LogOut, 
  ScanLine, 
  Trophy,
  FileCheck,
  Flag,
  Microscope,
  Lightbulb,
  Rocket,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Layers,
  GraduationCap,
  Menu,
  X,
} from "lucide-react";
import { authApi } from "../../lib/api";
import { useMe, useSession } from "../../lib/session";
import { Spinner } from "../ui/Spinner";

export interface StudentNavGroup {
  label?: string;
  items: {
    href: string;
    label: string;
    icon: typeof Gauge;
    badge?: string;
  }[];
}

const NAV_GROUPS: StudentNavGroup[] = [
  {
    label: "Core AI Platform",
    items: [
      { href: "/dashboard", label: "Overview & Analytics", icon: Gauge },
      { href: "/courses", label: "Courses & Curricula", icon: BookOpen },
      { href: "/gpu", label: "GPU Supercomputing", icon: Cpu, badge: "Live" },
    ],
  },
  {
    label: "Innovation & Labs",
    items: [
      { href: "/problems", label: "Industry Problems", icon: Lightbulb },
      { href: "/hackathons", label: "Hackathons", icon: Flag, badge: "Active" },
      { href: "/startup", label: "Startup Launchpad", icon: Rocket },
    ],
  },
  {
    label: "Credentials & Rewards",
    items: [
      { href: "/coe-classes", label: "CoE Classes", icon: ScanLine },
      { href: "/claims", label: "Evidence & Claims", icon: FileCheck },
      { href: "/awards", label: "Awards", icon: Award },
      { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    ],
  },
];

export function StudentShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const session = useSession();
  const onboarded = session.data?.authenticated && session.data.onboarded;
  const me = useMe(!!onboarded);

  // Off-canvas drawer for < lg screens (same behaviour as the staff console).
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
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <Spinner label="Loading your AI Supercomputing workspace…" />
      </div>
    );
  }

  const profile = me.data;

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
            aria-controls="student-sidebar"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 active:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <img src="/Eswar.png" alt="" className="h-8 w-8 shrink-0 object-contain" />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[13px] font-black tracking-tight text-slate-900">Sri Eshwar NVIDIA</div>
            <div className="truncate text-[10px] font-bold text-[#1755A7]">
              {profile ? `${profile.level.levelName} · ${profile.totalPoints.toLocaleString()} pts` : "Student Scholar"}
            </div>
          </div>
        </div>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1755A7] text-xs font-bold text-white"
          title={profile?.fullName}
          aria-hidden="true"
        >
          {profile?.fullName ? profile.fullName.charAt(0) : "S"}
        </div>
      </header>

      {/* Drawer backdrop (< lg) */}
      {menuOpen && <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      {/* Sidebar Navigation: fixed on lg+, off-canvas drawer below */}
      <aside
        id="student-sidebar"
        aria-label="Student navigation"
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
                <Sparkles className="h-2.5 w-2.5 text-[#F8C401]" />
                Student Scholar
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

        {/* Scrollable Navigation Groups */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 minute-scrollbar">
          {NAV_GROUPS.map((group, idx) => (
            <div key={idx} className="space-y-1">
              {group.label && (
                <div className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  {group.label}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
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

        {/* Anchored Bottom User Profile */}
        <div className="border-t border-slate-100 bg-slate-50/50 p-3.5">
          {profile && (
            <div className="mb-2.5 flex items-center justify-between rounded-xl bg-white p-2 border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#1755A7]/10 text-[#1755A7]">
                  <Sparkles className="h-3 w-3 text-[#F8C401]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="truncate text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Level Rank</span>
                  <span className="truncate text-[11px] font-black text-slate-900 leading-tight">{profile.level.levelName}</span>
                </div>
              </div>
              <span className="shrink-0 font-mono text-[11px] font-black text-[#1755A7]">{profile.totalPoints.toLocaleString()} pts</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2.5 rounded-xl bg-white p-2.5 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1755A7] font-bold text-white text-xs">
                {profile?.fullName ? profile.fullName.charAt(0) : "S"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-xs font-bold text-slate-900 leading-tight">{profile?.fullName || "Student Scholar"}</span>
                <span className="truncate text-[10px] font-medium text-slate-400">{profile?.email || "student@sece.ac.in"}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-red-50 hover:text-red-600 active:scale-95 lg:h-8 lg:w-8"
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
