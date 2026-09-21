"use client";

import Link from "next/link";
import { Cpu, ArrowRight } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="bg-slate-50 text-slate-900 border-t border-slate-200">
      
      {/* Pre-footer Call to Action Banner */}
      <div className="border-b border-slate-200 bg-gradient-to-r from-[#1755A7]/10 via-[#F8C401]/10 to-[#1755A7]/10 py-14">
        <div className="w-full px-6 sm:px-10 lg:px-16 text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#1755A7]/10 px-3.5 py-1 text-xs font-bold text-[#1755A7] border border-[#1755A7]/20">
            <Cpu className="h-3.5 w-3.5" />
            <span>ACCELERATE YOUR AI JOURNEY</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Ready to Begin at the NVIDIA AI Supercomputing Centre?
          </h2>

          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Log in with your institutional <span className="font-mono font-bold text-[#1755A7]">@sece.ac.in</span> account to track your supercomputing lab work and unlock DGX GPU compute allocations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-xl bg-[#1755A7] px-6 py-3 text-xs font-bold text-white shadow-md shadow-[#1755A7]/20 hover:bg-[#103E7E] transition-all"
            >
              <span>Launch AI Centre Portal</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/leaderboard"
              className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-800 hover:bg-slate-50 hover:border-[#1755A7]/40 transition-all shadow-2xs"
            >
              <span>Explore Live Leaderboard</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="w-full px-6 sm:px-10 lg:px-16 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <img 
                src="/Eswar.png" 
                alt="Sri Eshwar Logo" 
                className="h-10 w-auto object-contain" 
              />
              <div>
                <span className="text-sm font-extrabold text-[#1755A7] tracking-tight block">
                  Sri Eshwar NVIDIA AI Centre
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  Supercomputing & Competency Platform
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
              An institutional AI supercomputing competency and credentialing platform powering student research, enterprise challenges, and hands-on GPU acceleration.
            </p>

            <div className="pt-1 flex items-center gap-2 text-xs text-emerald-700 font-semibold">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>All Supercomputing Clusters Operational (99.9% Uptime)</span>
            </div>
          </div>

          {/* Column 1: Nine-Grid Modules */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              Core Modules
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li><Link href="/sessions" className="hover:text-[#1755A7] transition-colors">Tech Eves & Sessions</Link></li>
              <li><Link href="/certifications" className="hover:text-[#1755A7] transition-colors">Learning Academy</Link></li>
              <li><Link href="/labs" className="hover:text-[#1755A7] transition-colors">GPU Hands-on Labs</Link></li>
              <li><Link href="/projects" className="hover:text-[#1755A7] transition-colors">AI Project Mela</Link></li>
              <li><Link href="/hackathons" className="hover:text-[#1755A7] transition-colors">Hackathons & Buildathons</Link></li>
            </ul>
          </div>

          {/* Column 2: Advanced Pathways */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              Advanced Tiers
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li><Link href="/problems" className="hover:text-[#1755A7] transition-colors">Industry Problem Bank</Link></li>
              <li><Link href="/research" className="hover:text-[#1755A7] transition-colors">AI Research Friday</Link></li>
              <li><Link href="/startup" className="hover:text-[#1755A7] transition-colors">Startup Launchpad</Link></li>
              <li><Link href="/leaderboard" className="hover:text-[#1755A7] transition-colors">Leaderboard & Awards</Link></li>
              <li><Link href="/scan" className="hover:text-[#1755A7] transition-colors">Live QR Scan Check-in</Link></li>
            </ul>
          </div>

          {/* Column 3: Institutional & Roles */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              Portals & Roles
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li><Link href="/dashboard" className="hover:text-[#1755A7] transition-colors">Student Dashboard</Link></li>
              <li><Link href="/mentor" className="hover:text-[#1755A7] transition-colors">Mentor Review Queue</Link></li>
              <li><Link href="/admin" className="hover:text-[#1755A7] transition-colors">Admin Console</Link></li>
              <li><Link href="/login" className="hover:text-[#1755A7] transition-colors">Google OAuth Sign In</Link></li>
              <li><Link href="/profile" className="hover:text-[#1755A7] transition-colors">Account & Privacy</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="mt-10 pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} NVIDIA AI Supercomputing & Competency Centre &bull; Sri Eshwar Engineering College.</p>
          <div className="flex items-center gap-4 font-medium">
            <span>Restricted to institutional @sece.ac.in domain</span>
            <span>Version 2026.1</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
