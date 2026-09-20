"use client";

import Link from "next/link";
import { useSession } from "../../lib/session";
import {
  ShieldCheck,
  ArrowRight,
  User,
  LogIn,
  Menu,
  X,
  Trophy,
  Calendar,
  Layers,
  Cpu,
  Zap,
} from "lucide-react";
import { useState, useEffect } from "react";

export function LandingHeader({ onOpenLogin }: { onOpenLogin?: () => void }) {
  const session = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isAuthenticated = session.data?.authenticated;
  const userRoles = session.data?.roles ?? [];

  const getTargetPortal = () => {
    if (!isAuthenticated) return "/login";
    if (!session.data?.onboarded) return "/onboarding";
    if (userRoles.includes("ADMIN")) return "/admin";
    if (userRoles.includes("MENTOR")) return "/mentor";
    return "/dashboard";
  };

  const navLinks = [
    { label: "9-Grid Modules", href: "#features", icon: <Layers className="h-3.5 w-3.5" /> },
    { label: "Competency Tiers", href: "#levels", icon: <ShieldCheck className="h-3.5 w-3.5" /> },
    { label: "Programmes & Labs", href: "#programmes", icon: <Calendar className="h-3.5 w-3.5" /> },
    { label: "Learning Providers", href: "#ecosystem", icon: <Cpu className="h-3.5 w-3.5" /> },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/98 backdrop-blur-xl shadow-md border-b border-slate-200 py-2"
          : "bg-white/80 backdrop-blur-md border-b border-slate-100 py-3"
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-6">

        {/* ── Brand ── */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="relative">
            <img
              src="/Eswar.png"
              alt="Sri Eshwar Engineering College"
              className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="flex flex-col leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-black tracking-tight bg-gradient-to-r from-[#1755A7] to-[#2563eb] bg-clip-text text-transparent">
                Sri Eshwar NVIDIA
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#F8C401] to-[#f59e0b] px-2 py-0.5 text-[9px] font-black text-slate-900 shadow-sm">
                <Zap className="h-2.5 w-2.5" />
                AI Centre
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 tracking-wide uppercase">
              Supercomputing Platform
            </span>
          </div>
        </Link>

        {/* ── Desktop Nav ── */}
        <nav className="hidden lg:flex items-center gap-0.5 bg-slate-50 border border-slate-200/80 px-1.5 py-1.5 rounded-2xl shadow-xs">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-bold text-slate-600 hover:text-[#1755A7] hover:bg-white rounded-xl transition-all duration-200 hover:shadow-sm whitespace-nowrap"
            >
              <span className="text-[#1755A7]/70">{link.icon}</span>
              {link.label}
            </a>
          ))}

          {/* Divider */}
          <div className="w-px h-5 bg-slate-200 mx-1" />

          <Link
            href="/leaderboard"
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-extrabold text-slate-900 bg-[#F8C401] hover:bg-[#f59e0b] rounded-xl transition-all duration-200 shadow-sm whitespace-nowrap"
          >
            <Trophy className="h-3.5 w-3.5 text-slate-900" />
            Leaderboard
          </Link>
        </nav>

        {/* ── Action Controls ── */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {isAuthenticated ? (
            <Link
              href={getTargetPortal()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1755A7] px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/20 hover:bg-[#103E7E] hover:shadow-md active:scale-[0.98] transition-all whitespace-nowrap"
            >
              <User className="h-3.5 w-3.5" />
              <span>Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              {/* Sign In — ghost style */}
              {onOpenLogin ? (
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-[#1755A7] hover:bg-slate-100 rounded-xl transition-all whitespace-nowrap border border-transparent hover:border-slate-200"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-[#1755A7] hover:bg-slate-100 rounded-xl transition-all whitespace-nowrap border border-transparent hover:border-slate-200"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </Link>
              )}

              {/* Launch Portal — solid CTA */}
              {onOpenLogin ? (
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#2563eb] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#1755A7]/25 hover:shadow-lg hover:from-[#103E7E] hover:to-[#1755A7] active:scale-[0.98] transition-all whitespace-nowrap"
                >
                  <span>Launch Portal</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              ) : (
                <Link
                  href="/login"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#2563eb] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#1755A7]/25 hover:shadow-lg hover:from-[#103E7E] hover:to-[#1755A7] active:scale-[0.98] transition-all whitespace-nowrap"
                >
                  <span>Launch Portal</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              )}
            </>
          )}
        </div>

        {/* ── Mobile Hamburger ── */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
        </button>
      </div>

      {/* ── Mobile Menu ── */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white/98 backdrop-blur-xl px-4 pt-3 pb-5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200 shadow-lg">
          <nav className="flex flex-col space-y-0.5">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[#1755A7] rounded-xl transition-all"
              >
                <span className="text-[#1755A7]">{link.icon}</span>
                {link.label}
              </a>
            ))}
            <Link
              href="/leaderboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-extrabold text-slate-900 bg-[#F8C401]/20 hover:bg-[#F8C401]/40 rounded-xl transition-all border border-[#F8C401]/30"
            >
              <Trophy className="h-4 w-4 text-slate-900" />
              Leaderboard & Awards
            </Link>
          </nav>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {isAuthenticated ? (
              <Link
                href={getTargetPortal()}
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#2563eb] py-3 text-xs font-bold text-white shadow-sm"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : onOpenLogin ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#2563eb] py-3 text-xs font-bold text-white shadow-sm"
              >
                <span>Sign In with SECE Account</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#2563eb] py-3 text-xs font-bold text-white shadow-sm"
              >
                <span>Sign In with SECE Account</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
