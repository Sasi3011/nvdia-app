"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Home,
  Search,
  Cpu,
  Wifi,
  AlertTriangle,
  RotateCcw,
  ChevronRight,
} from "lucide-react";

const QUICK_LINKS = [
  { label: "Student Dashboard", href: "/dashboard", icon: Home, desc: "Go to your learning hub" },
  { label: "Admin Console", href: "/admin", icon: Cpu, desc: "Supercluster management" },
  { label: "Mentor Portal", href: "/mentor", icon: Wifi, desc: "Review & proctoring queue" },
  { label: "Leaderboard", href: "/leaderboard", icon: Search, desc: "Rankings & achievements" },
];

// Floating particle data (deterministic so it SSR-safe)
const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  size: 2 + (i % 4),
  top: `${(i * 37 + 5) % 95}%`,
  left: `${(i * 53 + 8) % 95}%`,
  duration: 3 + (i % 5),
  delay: i * 0.22,
  opacity: 0.15 + (i % 4) * 0.07,
}));

export default function NotFoundPage() {
  const [glitchActive, setGlitchActive] = useState(false);
  const [counter, setCounter] = useState(0);
  const glitchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Periodic glitch effect on the 404 text
  useEffect(() => {
    const triggerGlitch = () => {
      setGlitchActive(true);
      glitchTimer.current = setTimeout(() => setGlitchActive(false), 300);
    };
    const interval = setInterval(triggerGlitch, 4000);
    return () => {
      clearInterval(interval);
      if (glitchTimer.current) clearTimeout(glitchTimer.current);
    };
  }, []);

  // Animated counter that climbs to 404
  useEffect(() => {
    let frame = 0;
    const total = 60;
    const tick = () => {
      frame++;
      const progress = frame / total;
      const eased = 1 - Math.pow(1 - progress, 4);
      setCounter(Math.round(eased * 404));
      if (frame < total) requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020B18] font-sans text-white flex flex-col">

      {/* ── Deep space background layers ── */}
      {/* Starfield noise */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(1px 1px at ${Array.from({ length: 80 }, (_, i) =>
            `${(i * 67 + 13) % 100}% ${(i * 41 + 7) % 100}%`
          ).join(", ")}, rgba(255,255,255,0.45) 0%, transparent 100%)`,
        }}
      />

      {/* Big ambient glow — blue */}
      <div
        className="pointer-events-none absolute top-[-20%] left-1/2 -translate-x-1/2 rounded-full"
        style={{
          width: "70vw",
          height: "50vw",
          background: "radial-gradient(ellipse, rgba(23,85,167,0.35) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Secondary glow — gold */}
      <div
        className="pointer-events-none absolute bottom-[-10%] right-[-10%] rounded-full"
        style={{
          width: "50vw",
          height: "35vw",
          background: "radial-gradient(ellipse, rgba(248,196,1,0.18) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* Subtle grid lines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(23,85,167,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(23,85,167,0.8) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Floating particles */}
      {PARTICLES.map((p) => (
        <div
          key={p.id}
          className="pointer-events-none absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            top: p.top,
            left: p.left,
            background:
              p.id % 3 === 0
                ? `rgba(248,196,1,${p.opacity})`
                : `rgba(23,85,167,${p.opacity + 0.2})`,
            animation: `float-up ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
          }}
        />
      ))}

      {/* ── Header Bar ── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/[0.07]">
        <Link href="/" className="flex items-center gap-3 group">
          <img src="/Eswar.png" alt="Sri Eshwar Logo" className="h-9 w-auto object-contain opacity-90" />
          <div>
            <div className="text-[13px] font-black tracking-tight text-white leading-tight">
              Sri Eshwar NVIDIA
            </div>
            <div className="text-[10px] font-bold text-white/40 tracking-wider uppercase">
              AI Supercomputing Platform
            </div>
          </div>
        </Link>

        <span className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] font-black text-red-400">
          <AlertTriangle className="h-3 w-3" />
          Error 404
        </span>
      </header>

      {/* ── Main Content ── */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">

        {/* Status chip */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#1755A7]/40 bg-[#1755A7]/15 px-4 py-1.5 text-xs font-bold text-blue-300 backdrop-blur-sm">
          <span className="flex h-2 w-2 rounded-full bg-red-400 animate-pulse" />
          SIGNAL LOST · ROUTE NOT FOUND
          <span className="flex h-2 w-2 rounded-full bg-[#F8C401] animate-pulse" style={{ animationDelay: "0.5s" }} />
        </div>

        {/* 404 Hero Number */}
        <div className="relative mb-4 select-none" style={{ lineHeight: 1 }}>
          {/* Shadow behind */}
          <div
            className="absolute inset-0 text-center font-black"
            style={{
              fontSize: "clamp(140px, 25vw, 260px)",
              background: "linear-gradient(180deg, rgba(23,85,167,0.5) 0%, transparent 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "blur(40px)",
            }}
          >
            404
          </div>

          {/* Main text */}
          <div
            className={`relative font-black transition-all duration-75 ${glitchActive ? "skew-x-1" : ""}`}
            style={{
              fontSize: "clamp(140px, 25vw, 260px)",
              background: "linear-gradient(135deg, #FFFFFF 0%, #1755A7 40%, #F8C401 75%, #ffffff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundSize: "200% 200%",
              animation: "gradient-pan 6s ease infinite",
              letterSpacing: "-0.04em",
            }}
          >
            {String(counter).padStart(3, "0")}

            {/* Glitch layer */}
            {glitchActive && (
              <div
                className="absolute inset-0 font-black opacity-60"
                style={{
                  fontSize: "clamp(140px, 25vw, 260px)",
                  background: "linear-gradient(135deg, #F8C401, #1755A7)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  transform: "translate(3px, -2px)",
                  letterSpacing: "-0.04em",
                }}
              >
                404
              </div>
            )}
          </div>
        </div>

        {/* Scan line decoration */}
        <div className="mb-6 flex items-center gap-3">
          <div className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-[#1755A7]/60" />
          <div className="flex items-center gap-2 rounded-md border border-[#1755A7]/30 bg-[#1755A7]/10 px-3 py-1">
            <Cpu className="h-3.5 w-3.5 text-[#1755A7]" />
            <span className="font-mono text-[10px] font-bold text-[#1755A7] tracking-widest uppercase">
              GPU_CLUSTER · NODE_ERROR
            </span>
          </div>
          <div className="h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-[#F8C401]/50" />
        </div>

        {/* Headline */}
        <h1 className="mb-3 text-2xl font-black text-white tracking-tight sm:text-3xl md:text-4xl">
          This cluster node doesn't exist
        </h1>

        {/* Subtitle */}
        <p className="mb-10 max-w-md text-sm font-medium text-white/50 leading-relaxed">
          The route you're navigating to has been decommissioned, relocated, or never provisioned on this supercomputing platform. Double-check your URL or jump to a known node below.
        </p>

        {/* CTA Buttons */}
        <div className="mb-14 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/8 px-5 py-2.5 text-xs font-bold text-white/80 backdrop-blur-sm hover:bg-white/12 hover:text-white transition-all active:scale-[0.97]"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1755A7] px-6 py-2.5 text-xs font-black text-white shadow-lg shadow-[#1755A7]/30 hover:bg-[#103E7E] transition-all active:scale-[0.97]"
          >
            <Home className="h-4 w-4" />
            Return to Home
          </Link>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-xl border border-[#F8C401]/30 bg-[#F8C401]/10 px-5 py-2.5 text-xs font-bold text-[#F8C401] backdrop-blur-sm hover:bg-[#F8C401]/20 transition-all active:scale-[0.97]"
          >
            <RotateCcw className="h-4 w-4" />
            Retry
          </button>
        </div>

        {/* Quick Navigation Grid */}
        <div className="w-full max-w-2xl">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-white/30">
            — Jump to a known node —
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {QUICK_LINKS.map(({ label, href, icon: Icon, desc }) => (
              <Link
                key={href}
                href={href}
                className="group flex flex-col items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 text-center backdrop-blur-sm transition-all hover:border-[#1755A7]/50 hover:bg-[#1755A7]/12 hover:scale-[1.03] active:scale-[0.98]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-all group-hover:border-[#1755A7]/50 group-hover:bg-[#1755A7]/20">
                  <Icon className="h-4.5 w-4.5 text-white/50 transition-colors group-hover:text-[#1755A7]" />
                </div>
                <div>
                  <div className="text-[11px] font-black text-white/80 group-hover:text-white transition-colors leading-tight">
                    {label}
                  </div>
                  <div className="mt-0.5 text-[10px] text-white/35 leading-tight">
                    {desc}
                  </div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-white/20 transition-all group-hover:text-[#1755A7] group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.06] px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="text-[11px] font-bold text-white/25">
            © 2024 Sri Eshwar College of Engineering · NVIDIA AI Centre
          </span>
          <div className="font-mono text-[10px] font-bold text-white/20 tracking-widest">
            HTTP_404 · NOT_FOUND
          </div>
        </div>
      </footer>

      {/* ── Keyframe CSS ── */}
      <style jsx global>{`
        @keyframes float-up {
          0%   { transform: translateY(0px) scale(1); opacity: 0.6; }
          100% { transform: translateY(-18px) scale(1.2); opacity: 1; }
        }
        @keyframes gradient-pan {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
