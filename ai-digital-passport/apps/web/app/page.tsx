"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "../lib/session";
// import { LandingHeader } from "../components/landing/LandingHeader";
// import { HeroSection } from "../components/landing/HeroSection";
// import { ModulesGrid } from "../components/landing/ModulesGrid";
// import { LevelProgression } from "../components/landing/LevelProgression";
// import { ProgrammeCalendarPreview } from "../components/landing/ProgrammeCalendarPreview";
// import { LearningPartners } from "../components/landing/LearningPartners";
// import { VerificationArchitecture } from "../components/landing/VerificationArchitecture";
// import { LeaderboardPreview } from "../components/landing/LeaderboardPreview";
// import { FaqSection } from "../components/landing/FaqSection";
// import { LandingFooter } from "../components/landing/LandingFooter";
import { LoginModal } from "../components/auth/LoginModal";

export default function Home() {
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

  // LANDING PAGE DISABLED — kept here for reference, the app now opens on the login page.
  // return (
  //   <div className="min-h-screen bg-surface font-sans text-ink selection:bg-accent-light selection:text-accent">
  //     <LandingHeader onOpenLogin={() => setLoginModalOpen(true)} />
  //     <main>
  //       <HeroSection onOpenLogin={() => setLoginModalOpen(true)} />
  //       <ModulesGrid />
  //       <LevelProgression />
  //       <ProgrammeCalendarPreview />
  //       <LearningPartners />
  //       <VerificationArchitecture />
  //       <LeaderboardPreview />
  //       <FaqSection />
  //     </main>
  //     <LandingFooter />
  //     <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
  //   </div>
  // );

  return (
    <div
      className="relative min-h-[100dvh] bg-cover bg-center bg-no-repeat bg-[url('/Mobile%20login.png')] sm:bg-[url('/Login.png')]"
    >
      <div className="fixed inset-0 bg-black/40" />
      <div className="relative">
        <LoginModal isOpen standalone onClose={() => undefined} />
      </div>
      <footer className="pointer-events-none fixed inset-x-0 bottom-0 px-4 py-2.5 text-center text-[10px] xs:text-[11px] font-medium text-white/80">
        &copy; {new Date().getFullYear()} Sri Eshwar College of Engineering &middot; NVIDIA AI Digital Passport. All rights reserved.
      </footer>
    </div>
  );
}
