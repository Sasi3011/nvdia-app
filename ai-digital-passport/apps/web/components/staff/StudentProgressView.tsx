"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Award, BookOpen, CalendarCheck, Cpu, Flag, GraduationCap, History, ListChecks, Rocket, Trophy } from "lucide-react";
import { staffStudentsApi, type StudentProgressResponse } from "../../lib/api";
import { ErrorBanner } from "../ui/ErrorBanner";
import { LevelBadge } from "../ui/LevelBadge";
import { Spinner } from "../ui/Spinner";

const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-";

const label = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const STATUS_TONE: Record<string, string> = {
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CONFIRMED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ALLOCATED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  NOMINATED: "border-amber-200 bg-amber-50 text-amber-700",
  SUBMITTED: "border-amber-200 bg-amber-50 text-amber-700",
  IN_PROGRESS: "border-blue-200 bg-blue-50 text-blue-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
  DECLINED: "border-red-200 bg-red-50 text-red-700",
};

function Pill({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_TONE[status] ?? "border-slate-200 bg-slate-50 text-slate-600"}`}>
      {label(status)}
    </span>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-10 text-center text-xs font-semibold text-slate-400">{text}</p>;
}

function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-xs">
        <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          <tr>{head.map((h) => <th key={h} className="px-5 py-3">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {count !== undefined && <span className="text-[11px] font-bold text-slate-400">{count}</span>}
      </div>
      {children}
    </div>
  );
}

const TABS = [
  { key: "overview", label: "Overview", icon: ListChecks },
  { key: "points", label: "Points History", icon: History },
  { key: "claims", label: "Claims", icon: Trophy },
  { key: "courses", label: "Courses", icon: BookOpen },
  { key: "hackathons", label: "Hackathons", icon: Flag },
  { key: "classes", label: "Live Classes", icon: CalendarCheck },
  { key: "projects", label: "Projects & Startups", icon: Rocket },
  { key: "achievements", label: "Awards & Badges", icon: Award },
  { key: "gpu", label: "GPU", icon: Cpu },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function StudentProgressView({ userId, backHref }: { userId: string | null; backHref: string }) {
  const [tab, setTab] = useState<TabKey>("overview");
  const progress = useQuery({
    queryKey: ["staff", "students", "progress", userId],
    queryFn: () => staffStudentsApi.progress(userId!),
    enabled: !!userId,
  });

  if (!userId) return <ErrorBanner error="No student id given." />;
  if (progress.isLoading) return <div className="flex h-64 items-center justify-center"><Spinner label="Loading student progress..." /></div>;
  if (progress.isError) return <ErrorBanner error={progress.error} />;
  if (!progress.data) return null;

  const p = progress.data;
  const { profile, summary } = p;
  const next = profile.level.nextLevel;
  const span = next ? next.minPoints - profile.level.minPoints : 0;
  const pct = next ? Math.max(0, Math.min(100, Math.round(((profile.totalPoints - profile.level.minPoints) / Math.max(1, span)) * 100))) : 100;

  const kpis = [
    { 
      label: "Total Points", 
      value: profile.totalPoints, 
      sub: `Rank #${profile.rank}`,
      icon: Award,
      bar: "from-[#F8C401] via-amber-500 to-orange-500",
      tone: "bg-amber-500/15 text-amber-600",
    },
    { 
      label: "Claims Approved", 
      value: summary.claims.approved, 
      sub: `${summary.claims.pending} pending, ${summary.claims.rejected} rejected`,
      icon: Trophy,
      bar: "from-emerald-500 via-emerald-400 to-teal-400",
      tone: "bg-emerald-500/15 text-emerald-600",
    },
    { 
      label: "Courses Completed", 
      value: summary.coursesCompleted, 
      sub: `${summary.coursesInProgress} in progress`,
      icon: BookOpen,
      bar: "from-[#1755A7] via-[#2563EB] to-[#38BDF8]",
      tone: "bg-[#1755A7]/10 text-[#1755A7]",
    },
    { 
      label: "Classes Attended", 
      value: summary.classesAttended, 
      sub: `${summary.hackathonRegistrationsVerified} hackathons verified`,
      icon: CalendarCheck,
      bar: "from-indigo-400 via-purple-400 to-pink-400",
      tone: "bg-indigo-400/15 text-indigo-600",
    },
    { 
      label: "Badges & Certs", 
      value: summary.badges + summary.certificates, 
      sub: `${summary.projects} project${summary.projects === 1 ? "" : "s"}`,
      icon: Award,
      bar: "from-[#1755A7] via-[#2563EB] to-[#38BDF8]",
      tone: "bg-[#1755A7]/10 text-[#1755A7]",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={backHref} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs transition-colors hover:bg-slate-50" aria-label="Back to students">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-xs font-bold text-slate-400">Back to Student Progress</span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-6">
        <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-[#1755A7] via-[#2563EB] to-[#38BDF8]" />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <LevelBadge levelId={profile.level.levelId} size={96} />
          <div className="min-w-0 flex-1">
            <h2 className="break-words text-xl font-black tracking-tight text-slate-900">{profile.fullName}</h2>
            <p className="mt-0.5 break-all text-xs font-semibold text-slate-500">
              {profile.registerNum} &middot; {profile.department} &middot; Batch {profile.cohortYear} &middot; {profile.email}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold">
              <span className="rounded-full bg-[#1755A7]/10 px-2.5 py-0.5 text-[#1755A7]">{profile.level.levelName}</span>
              {profile.highImpactFlag && <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-amber-800">High impact</span>}
              <span className="text-slate-400">Joined {fmtDate(profile.joinedAt)}</span>
            </div>
            <div className="mt-4 max-w-xl">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>{profile.totalPoints} pts</span>
                <span>{next ? `${next.pointsNeeded} pts to ${next.levelName} (${next.minPoints})` : "Top level reached"}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-[#1755A7] to-[#38BDF8]" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm transition-all hover:shadow-md">
            <div className={`absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${k.bar}`} />
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">{k.label}</span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${k.tone}`}>
                <k.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black tracking-tight text-slate-900">{k.value}</div>
            <div className="mt-3 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-nowrap gap-1.5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-xs font-bold transition-colors ${tab === t.key ? "bg-[#1755A7] text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <Overview p={p} />}
      {tab === "points" && (
        <Section title="Points History" count={p.pointsHistory.length}>
          {p.pointsHistory.length === 0 ? <Empty text="No points earned yet." /> : (
            <Table head={["Date", "Source", "Reason", "Points"]}>
              {p.pointsHistory.map((t) => (
                <tr key={t.transactionId}>
                  <td className="px-5 py-3 text-slate-500">{fmtDate(t.createdAt)}</td>
                  <td className="px-5 py-3 font-semibold text-slate-700">{label(t.source)}</td>
                  <td className="px-5 py-3 text-slate-600">{t.reason}</td>
                  <td className={`px-5 py-3 font-black ${t.points >= 0 ? "text-emerald-600" : "text-red-600"}`}>{t.points >= 0 ? "+" : ""}{t.points}</td>
                </tr>
              ))}
            </Table>
          )}
        </Section>
      )}
      {tab === "claims" && (
        <Section title="Activity Claims" count={p.claims.length}>
          {p.claims.length === 0 ? <Empty text="No claims submitted yet." /> : (
            <Table head={["Submitted", "Category", "Proof", "Status", "Points", "Mentor feedback"]}>
              {p.claims.map((c) => (
                <tr key={c.claimId}>
                  <td className="px-5 py-3 text-slate-500">{fmtDate(c.createdAt)}</td>
                  <td className="px-5 py-3 font-semibold text-slate-700">{label(c.category)}</td>
                  <td className="px-5 py-3 text-slate-500">{label(c.proofType)}</td>
                  <td className="px-5 py-3"><Pill status={c.status} /></td>
                  <td className="px-5 py-3 font-bold text-slate-800">{c.status === "APPROVED" ? `+${c.pointsAwarded ?? c.pointsRequested}` : c.pointsRequested}</td>
                  <td className="px-5 py-3 text-slate-500">{c.mentorFeedback ?? "-"}</td>
                </tr>
              ))}
            </Table>
          )}
        </Section>
      )}
      {tab === "courses" && (
        <Section title="Course Enrollments" count={p.courses.length}>
          {p.courses.length === 0 ? <Empty text="Not enrolled in any course." /> : (
            <Table head={["Course", "Provider", "Status", "Points", "Submitted", "Reviewed", "Feedback"]}>
              {p.courses.map((c) => (
                <tr key={c.enrollmentId}>
                  <td className="px-5 py-3 font-bold text-slate-800">{c.title}</td>
                  <td className="px-5 py-3 text-slate-600">{c.provider}</td>
                  <td className="px-5 py-3"><Pill status={c.status} /></td>
                  <td className="px-5 py-3 font-bold text-slate-800">{c.pointsEarned ? `+${c.pointsEarned}` : "-"}</td>
                  <td className="px-5 py-3 text-slate-500">{fmtDate(c.submittedAt)}</td>
                  <td className="px-5 py-3 text-slate-500">{fmtDate(c.reviewedAt)}</td>
                  <td className="px-5 py-3 text-slate-500">{c.reviewFeedback ?? "-"}</td>
                </tr>
              ))}
            </Table>
          )}
        </Section>
      )}
      {tab === "hackathons" && (
        <div className="space-y-6">
          <Section title="External Hackathon Registrations" count={p.hackathons.external.length}>
            {p.hackathons.external.length === 0 ? <Empty text="No external hackathon registrations." /> : (
              <Table head={["Hackathon", "Organizer", "Registered", "Verification", "Feedback"]}>
                {p.hackathons.external.map((h) => (
                  <tr key={h.registrationId}>
                    <td className="px-5 py-3 font-bold text-slate-800">{h.title}</td>
                    <td className="px-5 py-3 text-slate-600">{h.organizer ?? "-"}</td>
                    <td className="px-5 py-3 text-slate-500">{fmtDate(h.registeredAt)}</td>
                    <td className="px-5 py-3"><Pill status={h.status} /></td>
                    <td className="px-5 py-3 text-slate-500">{h.feedback ?? "-"}</td>
                  </tr>
                ))}
              </Table>
            )}
          </Section>
          <Section title="Hackathon Teams & Submissions" count={p.hackathons.teams.length}>
            {p.hackathons.teams.length === 0 ? <Empty text="Not part of any hackathon team." /> : (
              <Table head={["Hackathon", "Team", "Role", "Joined", "Submissions"]}>
                {p.hackathons.teams.map((t) => (
                  <tr key={t.teamId}>
                    <td className="px-5 py-3 font-bold text-slate-800">{t.hackathonTitle} <span className="ml-1"><Pill status={t.hackathonStatus} /></span></td>
                    <td className="px-5 py-3 text-slate-700">{t.teamName}</td>
                    <td className="px-5 py-3 text-slate-500">{label(t.role)}</td>
                    <td className="px-5 py-3 text-slate-500">{fmtDate(t.joinedAt)}</td>
                    <td className="px-5 py-3 text-slate-600">{t.submissions.length ? t.submissions.map((s) => s.title).join(", ") : "None yet"}</td>
                  </tr>
                ))}
              </Table>
            )}
          </Section>
        </div>
      )}
      {tab === "classes" && (
        <Section title="Live Class Attendance (CoE)" count={p.attendance.length}>
          {p.attendance.length === 0 ? <Empty text="No live classes attended yet." /> : (
            <Table head={["Class", "Category", "Class date", "Checked in"]}>
              {p.attendance.map((a) => (
                <tr key={a.attendanceId}>
                  <td className="px-5 py-3 font-bold text-slate-800">{a.eventTitle}</td>
                  <td className="px-5 py-3 text-slate-600">{label(a.category)}</td>
                  <td className="px-5 py-3 text-slate-500">{fmtDate(a.classDate)}</td>
                  <td className="px-5 py-3 text-slate-500">{new Date(a.checkedInAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                </tr>
              ))}
            </Table>
          )}
        </Section>
      )}
      {tab === "projects" && (
        <div className="space-y-6">
          <Section title="Startup Launchpad" count={p.projects.startups.length}>
            {p.projects.startups.length === 0 ? <Empty text="No startup projects." /> : (
              <Table head={["Project", "Stage", "GPU validated", "Milestones", "Created"]}>
                {p.projects.startups.map((s) => (
                  <tr key={s.projectId}>
                    <td className="px-5 py-3 font-bold text-slate-800">{s.title}</td>
                    <td className="px-5 py-3 text-slate-700">Stage {s.currentStage} of 6</td>
                    <td className="px-5 py-3 text-slate-600">{s.gpuValidated ? "Yes" : "No"}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">{s.milestones.length ? s.milestones.map((m) => <span key={m.milestoneId} className="inline-flex items-center gap-1 text-[11px] text-slate-500">S{m.targetStage} <Pill status={m.status} /></span>) : "-"}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{fmtDate(s.createdAt)}</td>
                  </tr>
                ))}
              </Table>
            )}
          </Section>
          <Section title="Project Records" count={p.projects.records.length}>
            {p.projects.records.length === 0 ? <Empty text="No project records." /> : (
              <Table head={["Project", "Type", "Status", "Milestones", "Links", "Created"]}>
                {p.projects.records.map((r) => (
                  <tr key={r.projectId}>
                    <td className="px-5 py-3 font-bold text-slate-800">{r.title}</td>
                    <td className="px-5 py-3 text-slate-600">{label(r.projectType)}</td>
                    <td className="px-5 py-3"><Pill status={r.status} /></td>
                    <td className="px-5 py-3 text-slate-600">{r.milestones.length ? `${r.milestones.filter((m) => m.status === "APPROVED" || m.status === "COMPLETED").length} of ${r.milestones.length} done` : "-"}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2 text-[11px] font-bold text-[#1755A7]">
                        {r.githubUrl && <a href={r.githubUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">GitHub</a>}
                        {r.demoUrl && <a href={r.demoUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">Demo</a>}
                        {!r.githubUrl && !r.demoUrl && <span className="text-slate-400">-</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{fmtDate(r.createdAt)}</td>
                  </tr>
                ))}
              </Table>
            )}
          </Section>
          <Section title="Industry Problem Solutions" count={p.projects.problemProjects.length}>
            {p.projects.problemProjects.length === 0 ? <Empty text="No industry problem solutions started." /> : (
              <Table head={["Problem", "Stage", "Status", "Started"]}>
                {p.projects.problemProjects.map((pr) => (
                  <tr key={pr.projectId}>
                    <td className="px-5 py-3 font-bold text-slate-800">{pr.problemTitle}</td>
                    <td className="px-5 py-3 text-slate-600">Stage {pr.currentStage} / 6 (verified {pr.verifiedStage})</td>
                    <td className="px-5 py-3 text-slate-500">{pr.pendingStage ? "Pending mentor review" : "—"}</td>
                    <td className="px-5 py-3 text-slate-500">{fmtDate(pr.createdAt)}</td>
                  </tr>
                ))}
              </Table>
            )}
          </Section>
        </div>
      )}
      {tab === "achievements" && (
        <div className="space-y-6">
          <Section title="Awards" count={p.achievements.awards.length}>
            {p.achievements.awards.length === 0 ? <Empty text="No award requests or nominations." /> : (
              <Table head={["Award", "Relation", "Status", "Reason", "Admin note", "Date"]}>
                {p.achievements.awards.map((a) => (
                  <tr key={a.nominationId}>
                    <td className="px-5 py-3 font-bold text-slate-800">{a.awardName}</td>
                    <td className="px-5 py-3 text-slate-600">{a.relation === "NOMINEE" ? "Nominated by someone" : a.relation === "REQUESTER" ? "Requested for another" : "Self request"}</td>
                    <td className="px-5 py-3"><Pill status={a.status} /></td>
                    <td className="px-5 py-3 text-slate-500">{a.reason ?? "-"}</td>
                    <td className="px-5 py-3 text-slate-500">{a.adminNote ?? "-"}</td>
                    <td className="px-5 py-3 text-slate-500">{fmtDate(a.createdAt)}</td>
                  </tr>
                ))}
              </Table>
            )}
          </Section>
          <Section title="Badges" count={p.achievements.badges.length}>
            {p.achievements.badges.length === 0 ? <Empty text="No badges earned yet." /> : (
              <Table head={["Badge", "Description", "Awarded"]}>
                {p.achievements.badges.map((b) => (
                  <tr key={b.badgeId}>
                    <td className="px-5 py-3 font-bold text-slate-800">{b.name}</td>
                    <td className="px-5 py-3 text-slate-600">{b.description ?? "-"}</td>
                    <td className="px-5 py-3 text-slate-500">{fmtDate(b.awardedAt)}</td>
                  </tr>
                ))}
              </Table>
            )}
          </Section>
          <Section title="Certificates" count={p.achievements.certificates.length}>
            {p.achievements.certificates.length === 0 ? <Empty text="No certificates issued yet." /> : (
              <Table head={["Certificate", "Type", "Issued"]}>
                {p.achievements.certificates.map((c) => (
                  <tr key={c.certificateId}>
                    <td className="px-5 py-3 font-bold text-slate-800">{c.title}</td>
                    <td className="px-5 py-3 text-slate-600">{c.type}</td>
                    <td className="px-5 py-3 text-slate-500">{fmtDate(c.issuedAt)}</td>
                  </tr>
                ))}
              </Table>
            )}
          </Section>
        </div>
      )}
      {tab === "gpu" && (
        <Section title={`GPU Credits (balance: ${p.gpu.balance})`} count={p.gpu.requests.length}>
          {p.gpu.requests.length === 0 ? <Empty text="No GPU requests." /> : (
            <Table head={["Request", "Status", "Requested", "Allocated", "Date"]}>
              {p.gpu.requests.map((g) => (
                <tr key={g.requestId}>
                  <td className="px-5 py-3 font-bold text-slate-800">{g.title}</td>
                  <td className="px-5 py-3"><Pill status={g.status} /></td>
                  <td className="px-5 py-3 text-slate-700">{g.requestedCredits}</td>
                  <td className="px-5 py-3 text-slate-700">{g.allocatedCredits ?? "-"}</td>
                  <td className="px-5 py-3 text-slate-500">{fmtDate(g.createdAt)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Section>
      )}
    </div>
  );
}

function Overview({ p }: { p: StudentProgressResponse }) {
  const max = Math.max(1, ...p.summary.pointsByCategory.map((c) => c.points));
  const recent = p.pointsHistory.slice(0, 5);
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Section title="Points by Category">
        {p.summary.pointsByCategory.length === 0 ? <Empty text="No approved points yet." /> : (
          <div className="space-y-3 p-5">
            {p.summary.pointsByCategory.map((c) => (
              <div key={c.category}>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                  <span>{label(c.category)}</span>
                  <span className="font-black text-slate-900">{c.points}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#1755A7] to-[#38BDF8]" style={{ width: `${(c.points / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
      <Section title="Recent Points Activity">
        {recent.length === 0 ? <Empty text="No points activity yet." /> : (
          <ul className="divide-y divide-slate-100">
            {recent.map((t) => (
              <li key={t.transactionId} className="flex items-center justify-between gap-3 px-5 py-3 text-xs">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-800">{t.reason}</div>
                  <div className="text-[11px] text-slate-400">{fmtDate(t.createdAt)}</div>
                </div>
                <span className={`font-black ${t.points >= 0 ? "text-emerald-600" : "text-red-600"}`}>{t.points >= 0 ? "+" : ""}{t.points}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section title="Record at a glance">
        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
          {[
            ["Claims pending", p.summary.claims.pending],
            ["Claims rejected", p.summary.claims.rejected],
            ["Courses in progress", p.summary.coursesInProgress],
            ["Hackathons verified", p.summary.hackathonRegistrationsVerified],
            ["Projects", p.summary.projects],
            ["GPU credits", p.gpu.balance],
          ].map(([k, v]) => (
            <div key={k as string} className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{k}</div>
              <div className="mt-1 text-lg font-black text-slate-900">{v}</div>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Learning">
        <div className="flex items-center gap-3 p-5 text-xs text-slate-600">
          <GraduationCap className="h-5 w-5 text-[#1755A7]" />
          <span>
            {p.summary.coursesCompleted} course{p.summary.coursesCompleted === 1 ? "" : "s"} completed, {p.summary.classesAttended} live class
            {p.summary.classesAttended === 1 ? "" : "es"} attended, {p.summary.certificates} certificate{p.summary.certificates === 1 ? "" : "s"} issued.
          </span>
        </div>
      </Section>
    </div>
  );
}
