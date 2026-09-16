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
  Layers
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

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/90 py-3"
          : "bg-white/90 backdrop-blur-sm border-b border-slate-200/60 py-3.5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Brand Logo with Official Eswar.png */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <img 
            src="/Eswar.png" 
            alt="Sri Eshwar Engineering College" 
            className="h-10 w-auto object-contain transition-transform group-hover:scale-105" 
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-extrabold tracking-tight text-[#1755A7]">
                Sri Eshwar NVIDIA
              </span>
              <span className="rounded-full bg-[#F8C401] px-2 py-0.5 text-[10px] font-black text-slate-900 shadow-xs">
                AI Centre
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-500">
              Supercomputing Platform
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/90 px-3 py-1.5 rounded-full border border-slate-200">
          <a
            href="#features"
            className="px-3.5 py-1 text-xs font-bold text-slate-700 hover:text-[#1755A7] hover:bg-white rounded-full transition-all"
          >
            9-Grid Modules
          </a>
          <a
            href="#levels"
            className="px-3.5 py-1 text-xs font-bold text-slate-700 hover:text-[#1755A7] hover:bg-white rounded-full transition-all"
          >
            Competency Tiers
          </a>
          <a
            href="#programmes"
            className="px-3.5 py-1 text-xs font-bold text-slate-700 hover:text-[#1755A7] hover:bg-white rounded-full transition-all"
          >
            Programmes & Labs
          </a>
          <a
            href="#ecosystem"
            className="px-3.5 py-1 text-xs font-bold text-slate-700 hover:text-[#1755A7] hover:bg-white rounded-full transition-all"
          >
            Learning Providers
          </a>
          <Link
            href="/leaderboard"
            className="flex items-center gap-1.5 px-3.5 py-1 text-xs font-extrabold text-slate-900 bg-[#F8C401] hover:bg-[#F8C401]/90 rounded-full transition-all shadow-xs"
          >
            <Trophy className="h-3.5 w-3.5 text-slate-900" />
            Leaderboard
          </Link>
        </nav>

        {/* Action Controls */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          {isAuthenticated ? (
            <Link
              href={getTargetPortal()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1755A7] px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:bg-[#103E7E] active:scale-[0.98] transition-all whitespace-nowrap"
            >
              <User className="h-3.5 w-3.5" />
              <span>Go to Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              {onOpenLogin ? (
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-[#1755A7] hover:bg-slate-100 rounded-xl transition-all whitespace-nowrap"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-[#1755A7] hover:bg-slate-100 rounded-xl transition-all whitespace-nowrap"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </Link>
              )}

              {onOpenLogin ? (
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#1755A7] px-6 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/30 hover:bg-[#103E7E] active:scale-[0.98] transition-all whitespace-nowrap"
                >
                  <span>Launch Portal</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              ) : (
                <Link
                  href="/login"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#1755A7] px-6 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/30 hover:bg-[#103E7E] active:scale-[0.98] transition-all whitespace-nowrap"
                >
                  <span>Launch Portal</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              )}
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200 shadow-lg">
          <nav className="flex flex-col space-y-1">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              <Layers className="h-4 w-4 text-[#1755A7]" />
              9-Grid Modules
            </a>
            <a
              href="#levels"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              <ShieldCheck className="h-4 w-4 text-[#1755A7]" />
              Competency Tiers
            </a>
            <a
              href="#programmes"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              <Calendar className="h-4 w-4 text-[#1755A7]" />
              Programmes & Labs
            </a>
            <Link
              href="/leaderboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-900 bg-[#F8C401] rounded-lg"
            >
              <Trophy className="h-4 w-4 text-slate-900" />
              Leaderboard & Awards
            </Link>
          </nav>

          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
            {isAuthenticated ? (
              <Link
                href={getTargetPortal()}
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1755A7] py-3 text-xs font-bold text-white shadow-sm"
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
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1755A7] py-3 text-xs font-bold text-white shadow-sm"
              >
                <span>Sign In with SECE Account</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1755A7] py-3 text-xs font-bold text-white shadow-sm"
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
