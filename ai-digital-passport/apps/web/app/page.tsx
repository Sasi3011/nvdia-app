"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "../lib/session";
import { LandingHeader } from "../components/landing/LandingHeader";
import { HeroSection } from "../components/landing/HeroSection";
import { ModulesGrid } from "../components/landing/ModulesGrid";
import { LevelProgression } from "../components/landing/LevelProgression";
import { ProgrammeCalendarPreview } from "../components/landing/ProgrammeCalendarPreview";
import { LearningPartners } from "../components/landing/LearningPartners";
import { VerificationArchitecture } from "../components/landing/VerificationArchitecture";
import { LeaderboardPreview } from "../components/landing/LeaderboardPreview";
import { FaqSection } from "../components/landing/FaqSection";
import { LandingFooter } from "../components/landing/LandingFooter";
import { LoginModal } from "../components/auth/LoginModal";

export default function Home() {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const router = useRouter();
  const session = useSession();

  // ── Auto-redirect authenticated users to their portal ──
  useEffect(() => {
    if (!session.data?.authenticated) return;

    const roles = session.data?.roles ?? [];
    if (!session.data?.onboarded) {
      router.replace("/onboarding");
    } else if (roles.includes("ADMIN")) {
      router.replace("/admin");
    } else if (roles.includes("MENTOR")) {
      router.replace("/mentor");
    } else {
      router.replace("/dashboard");
    }
  }, [session.data, router]);

  // ── Show minimal loader while session is resolving ──
  if (session.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-[#1755A7] border-t-transparent animate-spin" />
          <span className="text-xs font-semibold text-slate-400 tracking-wide">Loading…</span>
        </div>
      </div>
    );
  }

  // ── If authenticated, hold render until redirect fires ──
  if (session.data?.authenticated) return null;

  return (
    <div className="min-h-screen bg-surface font-sans text-ink selection:bg-accent-light selection:text-accent">
      <LandingHeader onOpenLogin={() => setLoginModalOpen(true)} />
      <main>
        <HeroSection onOpenLogin={() => setLoginModalOpen(true)} />
        <ModulesGrid />
        <LevelProgression />
        <ProgrammeCalendarPreview />
        <LearningPartners />
        <VerificationArchitecture />
        <LeaderboardPreview />
        <FaqSection />
      </main>
      <LandingFooter />

      {/* Login Popup Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
    </div>
  );
}

