"use client";

import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Award, BarChart3, BookOpen, Building2, CalendarCheck, CheckCircle2, Clock, Cpu, Flag, GraduationCap,
  Rocket, Trophy, Users, Code2, Medal,
} from "lucide-react";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { LevelBadge } from "../../../components/ui/LevelBadge";
import { CustomSelect } from "../../../components/ui/CustomSelect";
import { adminReportsApi, type AdminReportsSummaryResponse, type ReportRange } from "../../../lib/api";

const RANGES: { value: ReportRange; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "all", label: "All time" },
];

const BLUE = "#1755A7";
const STATUS_COLORS = { approved: "#059669", pending: "#D97706", rejected: "#DC2626" } as const;

const pretty = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
const num = (n: number) => n.toLocaleString("en-IN");

function Panel({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
          {icon}
          {title}
        </h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Empty({ text = "No data for this selection yet." }: { text?: string }) {
  return <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-xs font-semibold text-slate-400">{text}</p>;
}

function Kpi({ label, value, hint, icon, accent, tone }: { label: string; value: string; hint: string; icon: ReactNode; accent: string; tone: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm transition-all hover:shadow-md">
      <div className={`absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${accent}`} />
      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>{icon}</div>
      </div>
      <div className="mt-3 text-3xl font-black tracking-tight text-slate-900">{value}</div>
      <div className="mt-3 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">{hint}</div>
    </div>
  );
}

function Bar({ value, max, color = BLUE }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.max(value > 0 ? 2 : 0, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function StatChips({ items }: { items: { label: string; value: number }[] }) {
  if (items.length === 0) return <Empty />;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
          {i.label}
          <span className="font-mono font-black text-slate-900">{num(i.value)}</span>
        </span>
      ))}
    </div>
  );
}

function PointsChart({ data }: { data: AdminReportsSummaryResponse["pointsOverTime"] }) {
  const max = Math.max(...data.map((d) => d.points), 0);
  if (max === 0) return <Empty text="No points were awarded in this period." />;
  const step = Math.ceil(data.length / 8);
  return (
    <div>
      <div className="flex h-44 items-end gap-1 border-b border-slate-200 pb-px">
        {data.map((d, i) => (
          <div key={`${d.label}-${i}`} className="group relative flex h-full flex-1 items-end" title={`${d.label}: ${num(d.points)} pts`}>
            <div
              className="w-full rounded-t-[4px] transition-opacity group-hover:opacity-80"
              style={{ height: `${d.points > 0 ? Math.max(3, (d.points / max) * 100) : 0}%`, background: BLUE, maxWidth: 24, margin: "0 auto" }}
            />
            <div className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white group-hover:block">
              {d.label}: {num(d.points)} pts
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1 text-[10px] font-medium text-slate-500">
        {data.map((d, i) => (
          <div key={`${d.label}-x-${i}`} className="flex-1 truncate text-center">
            {i % step === 0 ? d.label : ""}
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-slate-400">Peak: {num(max)} pts in a single bucket</p>
    </div>
  );
}

function StatusLegend() {
  return (
    <div className="flex flex-wrap gap-4 text-[11px] font-semibold text-slate-600">
      {(["approved", "pending", "rejected"] as const).map((k) => (
        <span key={k} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: STATUS_COLORS[k] }} />
          {pretty(k)}
        </span>
      ))}
    </div>
  );
}

function Report({ d }: { d: AdminReportsSummaryResponse }) {
  const o = d.overview;
  const maxLevel = Math.max(...d.levels.map((l) => l.count), 0);
  const maxCat = Math.max(...d.claimsByCategory.map((c) => c.approved + c.pending + c.rejected), 0);
  const maxClass = Math.max(...d.liveClasses.map((c) => c.checkIns), 0);
  const maxStage = Math.max(...d.startups.stages.map((s) => s.count), 0);
  const maxDept = Math.max(...d.departments.map((x) => x.students), 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Total Students"
          value={num(o.totalStudents)}
          hint={`${num(o.activeStudents30d)} active in the last 30 days`}
          icon={<Users className="h-4 w-4" />}
          accent="from-[#1755A7] via-[#2563EB] to-[#38BDF8]"
          tone="bg-[#1755A7]/10 text-[#1755A7]"
        />
        <Kpi
          label="Points Awarded"
          value={num(o.pointsAwarded)}
          hint={`Average ${num(o.averagePoints)} pts per student (lifetime)`}
          icon={<Award className="h-4 w-4" />}
          accent="from-[#F8C401] via-amber-500 to-orange-500"
          tone="bg-amber-500/15 text-amber-600"
        />
        <Kpi
          label="Claims"
          value={num(o.claims.total)}
          hint={`${num(o.claims.approved)} approved, ${num(o.claims.pending)} pending`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          accent="from-emerald-500 via-emerald-400 to-teal-400"
          tone="bg-emerald-500/15 text-emerald-600"
        />
        <Kpi
          label="Approval Rate"
          value={o.approvalRatePct === null ? "-" : `${o.approvalRatePct}%`}
          hint={o.avgReviewHours === null ? "No reviewed claims yet" : `Average review time ${o.avgReviewHours} h`}
          icon={<Clock className="h-4 w-4" />}
          accent="from-indigo-400 via-purple-400 to-pink-400"
          tone="bg-indigo-400/15 text-indigo-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Points Awarded Over Time" subtitle={d.range === "all" ? "Last 12 months" : "Points added to student passports"} icon={<BarChart3 className="h-4 w-4 text-[#1755A7]" />}>
          <PointsChart data={d.pointsOverTime} />
        </Panel>

        <Panel title="Competency Level Distribution" subtitle="Students at each level right now" icon={<Medal className="h-4 w-4 text-[#1755A7]" />}>
          {o.totalStudents === 0 ? (
            <Empty />
          ) : (
            <div className="space-y-3">
              {d.levels.map((l) => {
                const pct = o.totalStudents ? Math.round((l.count / o.totalStudents) * 100) : 0;
                return (
                  <div key={l.levelId} className="flex items-center gap-3">
                    <LevelBadge levelId={l.levelId} size={34} locked={l.count === 0} />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-800">{l.levelName} <span className="font-normal text-slate-400">({num(l.minPoints)}+ pts)</span></span>
                        <span className="font-mono font-bold text-slate-700">{num(l.count)} <span className="font-normal text-slate-400">({pct}%)</span></span>
                      </div>
                      <Bar value={l.count} max={maxLevel} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel title="Claims by Category" subtitle="Approved, pending and rejected claims per activity" icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}>
          {d.claimsByCategory.length === 0 ? (
            <Empty text="No claims in this period." />
          ) : (
            <div className="space-y-4">
              <StatusLegend />
              {d.claimsByCategory.map((c) => {
                const total = c.approved + c.pending + c.rejected;
                return (
                  <div key={c.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800">{c.label}</span>
                      <span className="font-mono text-slate-500">
                        {num(total)} claims · <span className="font-bold text-[#1755A7]">{num(c.points)} pts</span>
                      </span>
                    </div>
                    <div className="flex h-2 gap-0.5" style={{ width: `${maxCat ? Math.max(4, (total / maxCat) * 100) : 0}%` }}>
                      {(["approved", "pending", "rejected"] as const).map((k) =>
                        c[k] > 0 ? (
                          <div key={k} title={`${pretty(k)}: ${c[k]}`} className="h-full rounded-[2px]" style={{ flex: c[k], background: STATUS_COLORS[k] }} />
                        ) : null,
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel title="Department Breakdown" subtitle="Students, average points and claims by department" icon={<Building2 className="h-4 w-4 text-[#1755A7]" />}>
          {d.departments.length === 0 ? (
            <Empty />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-xs">
                <thead className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="pb-2">Department</th>
                    <th className="pb-2 text-right">Students</th>
                    <th className="pb-2 text-right">Avg pts</th>
                    <th className="pb-2 text-right">Claims</th>
                    <th className="pb-2 text-right">Approved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {d.departments.map((x) => (
                    <tr key={x.name}>
                      <td className="py-2.5 pr-3">
                        <div className="font-bold text-slate-800">{x.name}</div>
                        <div className="mt-1 max-w-[160px]"><Bar value={x.students} max={maxDept} /></div>
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-800">{num(x.students)}</td>
                      <td className="py-2.5 text-right font-mono text-slate-600">{num(x.averagePoints)}</td>
                      <td className="py-2.5 text-right font-mono text-slate-600">{num(x.claims)}</td>
                      <td className="py-2.5 text-right font-mono text-slate-600">{num(x.approvedClaims)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Top Students" subtitle="Highest lifetime points" icon={<Trophy className="h-4 w-4 text-[#F8C401]" />}>
          {d.topStudents.length === 0 ? (
            <Empty />
          ) : (
            <ul className="divide-y divide-slate-100">
              {d.topStudents.map((s) => (
                <li key={s.userId} className="flex items-center gap-3 py-2.5">
                  <span className="w-5 text-center font-mono text-xs font-black text-slate-400">{s.rank}</span>
                  <LevelBadge levelId={s.levelId} size={30} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold text-slate-900">{s.fullName}</div>
                    <div className="text-[11px] text-slate-500">{s.department}</div>
                  </div>
                  <span className="font-mono text-xs font-black text-[#1755A7]">{num(s.totalPoints)} pts</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Courses" subtitle="Enrollments and completions per active course" icon={<BookOpen className="h-4 w-4 text-[#1755A7]" />}>
          {d.courses.length === 0 ? (
            <Empty text="No courses yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-xs">
                <thead className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="pb-2">Course</th>
                    <th className="pb-2 text-right">Enrolled</th>
                    <th className="pb-2 text-right">In review</th>
                    <th className="pb-2 text-right">Completed</th>
                    <th className="pb-2 text-right">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {d.courses.map((c) => (
                    <tr key={c.courseId}>
                      <td className="py-2.5 pr-3">
                        <div className="font-bold text-slate-800">{c.title}</div>
                        <div className="text-[11px] text-slate-400">{c.provider} · {pretty(c.status)}</div>
                      </td>
                      <td className="py-2.5 text-right font-mono text-slate-700">{num(c.enrolled)}</td>
                      <td className="py-2.5 text-right font-mono text-slate-700">{num(c.inReview)}</td>
                      <td className="py-2.5 text-right font-mono text-slate-700">{num(c.completed)}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-800">{c.completionRatePct === null ? "-" : `${c.completionRatePct}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Hackathons" subtitle="External registrations (mentor-verified) and internal hackathons" icon={<Flag className="h-4 w-4 text-[#1755A7]" />}>
          <div className="space-y-4">
            <div>
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">External registrations · {num(d.hackathons.external.total)}</div>
              <StatChips
                items={[
                  { label: "Verified", value: d.hackathons.external.approved },
                  { label: "Awaiting mentor", value: d.hackathons.external.pending },
                  { label: "Rejected", value: d.hackathons.external.rejected },
                ]}
              />
            </div>
            <div>
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Internal hackathons</div>
              <StatChips
                items={[
                  ...d.hackathons.internal.byStatus.map((s) => ({ label: pretty(s.status), value: s.count })),
                  { label: "Teams", value: d.hackathons.internal.teams },
                  { label: "Submissions", value: d.hackathons.internal.submissions },
                ]}
              />
            </div>
          </div>
        </Panel>

        <Panel title="CoE Classes Attendance" subtitle="Check-ins for the most recent classes" icon={<CalendarCheck className="h-4 w-4 text-[#1755A7]" />}>
          {d.liveClasses.length === 0 ? (
            <Empty text="No classes in this period." />
          ) : (
            <div className="space-y-3">
              {d.liveClasses.map((c) => (
                <div key={c.eventId} className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-xs font-semibold">
                    <span className="truncate text-slate-800">{c.title}</span>
                    <span className="shrink-0 font-mono text-slate-600">{num(c.checkIns)} check-ins</span>
                  </div>
                  <Bar value={c.checkIns} max={maxClass} />
                  <div className="text-[11px] text-slate-400">
                    {new Date(c.startsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {c.category}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Industry Problems" subtitle="Problem bank status and student submissions" icon={<Code2 className="h-4 w-4 text-[#1755A7]" />}>
          <div className="space-y-4">
            <StatChips items={d.problemBank.byStatus.map((s) => ({ label: pretty(s.status), value: s.count }))} />
            <StatChips
              items={[
                { label: "Submissions", value: d.problemBank.submissions },
                { label: "Distinct students", value: d.problemBank.distinctSubmitters },
              ]}
            />
          </div>
        </Panel>

        <Panel title="Startup Pipeline" subtitle="Student ventures by stage, and project records by status" icon={<Rocket className="h-4 w-4 text-[#1755A7]" />}>
          <div className="space-y-3">
            {d.startups.stages.map((s) => (
              <div key={s.stage} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1755A7]/10 font-mono text-[11px] font-bold text-[#1755A7]">{s.stage}</span>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800">{s.name}</span>
                    <span className="font-mono text-slate-600">{num(s.count)}</span>
                  </div>
                  <Bar value={s.count} max={maxStage} />
                </div>
              </div>
            ))}
            <div className="pt-2">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Project records</div>
              <StatChips items={d.startups.projectsByStatus.map((s) => ({ label: pretty(s.status), value: s.count }))} />
            </div>
          </div>
        </Panel>

        <Panel title="GPU Credits" subtitle="Compute requests raised by students" icon={<Cpu className="h-4 w-4 text-[#1755A7]" />}>
          <div className="space-y-4">
            <StatChips
              items={[
                { label: "Requests", value: d.gpu.total },
                { label: "Credits requested", value: d.gpu.requestedCredits },
                { label: "Credits allocated", value: d.gpu.allocatedCredits },
              ]}
            />
            <StatChips items={d.gpu.byStatus.map((s) => ({ label: pretty(s.status), value: s.count }))} />
          </div>
        </Panel>

        <Panel title="Awards & Certificates" subtitle="Award requests by status and certificates issued" icon={<GraduationCap className="h-4 w-4 text-[#1755A7]" />}>
          <div className="space-y-4">
            <StatChips
              items={d.awards.map((a) => ({
                label: a.status === "NOMINATED" ? "Pending" : a.status === "CONFIRMED" ? "Approved" : pretty(a.status),
                value: a.count,
              }))}
            />
            <StatChips items={[{ label: "Certificates issued", value: d.certificates.issuedCount }]} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

export default function AdminReportsPage() {
  const [range, setRange] = useState<ReportRange>("30d");
  const [department, setDepartment] = useState("");

  const report = useQuery({
    queryKey: ["admin", "reports", "summary", range, department],
    queryFn: () => adminReportsApi.summary({ range, department: department || undefined }),
    placeholderData: (prev) => prev,
  });

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader title="Reports & Analytics" description="Live program metrics across students, claims, courses and events." />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="grid w-full grid-cols-4 gap-1 rounded-xl border border-slate-200 bg-white p-1 sm:inline-flex sm:w-auto">
          {RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRange(r.value)}
              className={`whitespace-nowrap rounded-lg px-2 py-2 text-xs font-bold transition-colors sm:px-3 sm:py-1.5 ${range === r.value ? "bg-[#1755A7] text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="w-full md:w-52">
          <CustomSelect
            value={department}
            onChange={setDepartment}
            options={[
              { label: "All Departments", value: "" },
              ...(report.data?.departmentOptions ?? []).map((dep) => ({ label: dep, value: dep }))
            ]}
          />
        </div>
        {report.data && (
          <span className="ml-auto text-[11px] font-semibold text-slate-400">
            {report.isFetching ? "Refreshing..." : `Updated ${new Date(report.data.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
          </span>
        )}
      </div>

      <div className="mt-6">
        {report.isLoading ? (
          <div className="flex h-64 items-center justify-center"><Spinner label="Generating analytics report..." /></div>
        ) : report.isError ? (
          <ErrorBanner error={report.error} />
        ) : report.data ? (
          <Report d={report.data} />
        ) : null}
      </div>
    </ConsoleShell>
  );
}
