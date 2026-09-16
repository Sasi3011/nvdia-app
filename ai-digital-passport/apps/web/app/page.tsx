"use client";

import { useState } from "react";
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
