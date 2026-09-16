"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { StudentShell } from "../../components/shell/StudentShell";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { LevelBadge } from "../../components/ui/LevelBadge";
import { NineGridTile } from "../../components/ui/NineGridTile";
import { PROBLEM_BANK_MIN_LEVEL } from "@ai-digital-passport/shared-types";
import { Spinner } from "../../components/ui/Spinner";
import { StatusChip, type Status } from "../../components/ui/StatusChip";
import { claimsApi, levelsApi } from "../../lib/api";
import { useMe } from "../../lib/session";

const MODULES = [
  { href: "/courses", label: "Courses", icon: <BookIcon /> },
  { href: "/sessions", label: "Sessions", icon: <CalendarIcon /> },
  { href: "/certifications", label: "Certifications", icon: <CertificateIcon /> },
  { href: "/labs", label: "Labs", icon: <FlaskIcon /> },
  { href: "/projects", label: "Projects", icon: <FolderIcon /> },
  { href: "/hackathons", label: "Hackathons", icon: <TrophyIcon /> },
  { href: "/research", label: "Research", icon: <BookIcon /> },
  { href: "/gpu", label: "GPU Access", icon: <GpuIcon /> },
  { href: "/problems", label: "Industry Problems", icon: <PuzzleIcon />, minLevel: PROBLEM_BANK_MIN_LEVEL },
  { href: "/industry", label: "Industry Connect", icon: <PeopleIcon /> },
  { href: "/startup", label: "Startup Launchpad", icon: <RocketIcon /> },
  { href: "/awards", label: "Awards", icon: <TrophyIcon /> },
  { href: "/leaderboard", label: "Leaderboard", icon: <ChartIcon /> },
];

export default function DashboardPage() {
  return (
    <StudentShell>
      <DashboardContent />
    </StudentShell>
  );
}

function DashboardContent() {
  const me = useMe(true);
  const levels = useQuery({ queryKey: ["levels"], queryFn: levelsApi.list });
  const recentClaims = useQuery({ queryKey: ["claims", "recent"], queryFn: () => claimsApi.list({ page: 1, pageSize: 5 }) });

  if (me.isLoading || levels.isLoading) return <Spinner label="Loading your passport…" />;
  if (me.isError) return <ErrorBanner error={me.error} />;
  if (!me.data) return null;

  const profile = me.data;
  const sortedLevels = [...(levels.data ?? [])].sort((a, b) => a.levelId - b.levelId);
  const nextLevel = sortedLevels.find((l) => l.levelId > profile.level.levelId);

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="text-display text-ink">{profile.fullName}</h1>
            <p className="mt-1 text-body text-text-muted">
              {profile.department} · Cohort {profile.cohortYear} · {profile.registerNum}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/claims/new">
              <Button variant="primary">Submit evidence</Button>
            </Link>
            <Link href="/claims">
              <Button variant="secondary">My claims</Button>
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-8 border-t border-border pt-6">
          <LevelBadge
            levelId={profile.level.levelId}
            levelName={profile.level.levelName}
            totalPoints={profile.totalPoints}
            currentThreshold={profile.level.minPoints}
            nextThreshold={nextLevel?.minPoints ?? null}
          />
          <div className="font-mono text-caption text-text-muted">
            <div>GPU credits</div>
            <div className="text-h2 text-ink">{profile.gpuCreditBalance.toLocaleString()}</div>
          </div>
          <div className="text-caption text-text-muted">
            <div>Unlocked privilege</div>
            <div className="text-body text-ink">{profile.level.unlockedPrivilege}</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 desktop:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <h2 className="text-h2 text-ink">AI Passport progress</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 tablet:grid-cols-3">
            <PassportMetric label="Learning" value="Courses + labs" />
            <PassportMetric label="Building" value="Projects + hackathons" />
            <PassportMetric label="Research" value="Papers + patents" />
            <PassportMetric label="Power" value={`${profile.gpuCreditBalance.toLocaleString()} GPU credits`} />
            <PassportMetric label="People" value="Mentor review" />
            <PassportMetric label="Possibilities" value="Industry + awards" />
          </div>
        </Card>
        <Card>
          <h2 className="text-h2 text-ink">Next unlock</h2>
          <p className="mt-3 text-body text-text-muted">
            {nextLevel
              ? `Reach ${nextLevel.minPoints.toLocaleString()} points to move toward ${nextLevel.levelName} and unlock ${nextLevel.unlockedPrivilege}.`
              : "You are at the highest configured AI level. Keep building impact for AI Champion recognition."}
          </p>
          <Link href="/claims/new" className="mt-4 inline-block">
            <Button variant="primary">Add evidence</Button>
          </Link>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-h2 text-ink">Modules</h2>
        <div className="grid grid-cols-2 gap-3 tablet:grid-cols-3">
          {MODULES.map((m) => (
            <NineGridTile
              key={m.href}
              href={m.href}
              label={m.label}
              icon={m.icon}
              locked={!!m.minLevel && profile.level.levelId < m.minLevel}
              requiredLevel={m.minLevel}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-h2 text-ink">Recent activity</h2>
          <Link href="/claims" className="text-caption text-navy-700 underline underline-offset-2">
            View all
          </Link>
        </div>
        {recentClaims.isLoading ? (
          <Spinner />
        ) : recentClaims.data && recentClaims.data.items.length > 0 ? (
          <Card className="divide-y divide-border p-0">
            {recentClaims.data.items.map((c) => (
              <div key={c.claimId} className="flex items-center justify-between px-6 py-4">
                <div>
                  <div className="text-body text-ink">{c.category.replace(/_/g, " ")}</div>
                  <div className="font-mono text-caption text-text-muted">{new Date(c.createdAt).toLocaleDateString()}</div>
                </div>
                <StatusChip status={c.status as Status} />
              </div>
            ))}
          </Card>
        ) : (
          <p className="text-body text-text-muted">No claims yet — submit evidence from any module to get started.</p>
        )}
      </div>
    </div>
  );
}

function PassportMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card bg-surface-muted p-3">
      <div className="text-caption text-text-muted">{label}</div>
      <div className="mt-1 text-body text-ink">{value}</div>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
function CertificateIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="5" />
      <path d="M8.5 12.5 7 21l5-3 5 3-1.5-8.5" />
    </svg>
  );
}
function FlaskIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 2v6L3.5 18a2 2 0 0 0 1.8 3h13.4a2 2 0 0 0 1.8-3L15 8V2M9 2h6" />
    </svg>
  );
}
function FolderIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    </svg>
  );
}
function TrophyIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4" />
    </svg>
  );
}
function BookIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Z" />
      <path d="M19 15H6.5A1.5 1.5 0 0 0 5 16.5" />
    </svg>
  );
}
function PuzzleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 8h3a2 2 0 1 1 0-4V4h4v3a2 2 0 1 0 4 0V4h4v4h-1a2 2 0 1 0 0 4h1v4h-4a2 2 0 1 0-4 0v0h-4v-3a2 2 0 1 0-4 0H4V8Z" />
    </svg>
  );
}
function RocketIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4.5 16.5c-1 1-1.5 4-1.5 4s3-.5 4-1.5" />
      <path d="M12 15l-3-3c2-5 6-9 11-10 -1 5-5 9-10 11Z" />
      <circle cx="15" cy="9" r="1" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 20V10M12 20V4M20 20v-6" />
    </svg>
  );
}
function GpuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 9h6v6H9zM9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" />
    </svg>
  );
}
function PeopleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
