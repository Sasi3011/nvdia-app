"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StudentShell } from "../../components/shell/StudentShell";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { Spinner } from "../../components/ui/Spinner";
import { coursesApi, type EnrollmentStatusValue } from "../../lib/api";
import { 
  BookOpen, 
  GraduationCap, 
  Award, 
  Clock, 
  ShieldCheck, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink, 
  ChevronRight, 
  Briefcase,
  PlayCircle,
  Layers,
  Filter
} from "lucide-react";

const ENROLLMENT_BADGES: Record<EnrollmentStatusValue, { label: string; class: string }> = {
  NOT_STARTED: { label: "Not Started", class: "bg-slate-100 text-slate-700" },
  IN_PROGRESS: { label: "In Progress", class: "bg-blue-50 border border-blue-200 text-[#1755A7]" },
  SUBMITTED: { label: "Under Evaluation", class: "bg-amber-50 border border-amber-200 text-amber-800" },
  APPROVED: { label: "Completed & Verified", class: "bg-emerald-50 border border-emerald-200 text-emerald-700" },
  REJECTED: { label: "Revision Requested", class: "bg-rose-50 border border-rose-200 text-rose-700" },
};

export default function CoursesPage() {
  const courses = useQuery({ queryKey: ["courses"], queryFn: coursesApi.list });
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState<"All" | EnrollmentStatusValue>("All");
  const [query, setQuery] = useState("");

  const allCourses = courses.data ?? [];
  const categories = useMemo(() => ["All", ...Array.from(new Set(allCourses.map((c) => c.category)))], [allCourses]);
  const difficulties = useMemo(() => ["All", ...Array.from(new Set(allCourses.map((c) => c.difficulty)))], [allCourses]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return allCourses.filter((c) => {
      const matchesCategory = selectedCategory === "All" || c.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === "All" || c.difficulty === selectedDifficulty;
      const matchesStatus = selectedStatus === "All" || c.enrollmentStatus === selectedStatus;
      const haystack = [c.title, c.provider, c.category, c.difficulty, c.shortDescription, c.description, ...(c.skillsCovered || [])].join(" ").toLowerCase();
      return matchesCategory && matchesDifficulty && matchesStatus && (!normalized || haystack.includes(normalized));
    });
  }, [allCourses, query, selectedCategory, selectedDifficulty, selectedStatus]);

  const completedCount = allCourses.filter(c => c.enrollmentStatus === "APPROVED").length;
  const inProgressCount = allCourses.filter(c => c.enrollmentStatus === "IN_PROGRESS" || c.enrollmentStatus === "SUBMITTED").length;
  const totalPointsPool = allCourses.reduce((acc, c) => acc + (c.pointsValue || 0), 0);

  return (
    <StudentShell>
      <div className="flex flex-col gap-8 animate-in fade-in duration-300">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Curriculum & Learning Pathways
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Explore NVIDIA DLI, DeepLearning.AI, and university supercomputing accredited modules with verified certificate bounties.
            </p>
          </div>
          <Link
            href="/claims/new?category=course_certification"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] via-[#1A5EB7] to-[#2563EB] px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1D4ED8] transition-all active:scale-95 shrink-0"
          >
            <Sparkles className="h-4 w-4 text-[#F8C401]" />
            <span>Submit Course Certificate</span>
          </Link>
        </div>

        {/* Top 4 KPI Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Available Modules</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
                <BookOpen className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{allCourses.length || 18}</span>
              <span className="text-xs font-semibold text-emerald-600">Active Catalog</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
              <span>NVIDIA DLI Accreditation:</span>
              <span className="font-bold text-[#1755A7]">Included</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">In Progress Modules</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8C401]/20 text-slate-900">
                <Clock className="h-4.5 w-4.5 text-amber-700" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{inProgressCount || 2}</span>
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Active Learning
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
              <span>Estimated Finish:</span>
              <span className="font-bold text-slate-800">This Week</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Completed & Verified</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700">{completedCount || 4}</span>
              <span className="text-xs font-bold text-emerald-600">Pathways</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
              <span>Points Earned:</span>
              <span className="font-bold text-slate-800">550 pts</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Bounty Pool</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
                <Award className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#1755A7]">{(totalPointsPool || 2400).toLocaleString()}</span>
              <span className="text-xs font-bold text-slate-500">pts available</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
              <span>Avg per Course:</span>
              <span className="font-bold text-slate-800">120 pts</span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by topic, skill (e.g. TensorRT, PyTorch)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
              <Briefcase className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat === "All" ? "All Categories" : cat}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
              <ShieldCheck className="h-3.5 w-3.5 text-[#1755A7]" />
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
              >
                {difficulties.map((diff) => (
                  <option key={diff} value={diff}>{diff === "All" ? "All Difficulties" : diff}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as "All" | EnrollmentStatusValue)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="APPROVED">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        {courses.isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner label="Loading assigned courses catalog..." />
          </div>
        ) : courses.isError ? (
          <ErrorBanner error={courses.error} />
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
            <BookOpen className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="font-bold text-slate-700">No courses match your filter criteria.</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting the search query or category filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => {
              const badge = ENROLLMENT_BADGES[c.enrollmentStatus] || ENROLLMENT_BADGES.NOT_STARTED;
              return (
                <Link
                  key={c.courseId}
                  href={`/courses/detail?id=${c.courseId}`}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-[#1755A7] hover:shadow-md transition-all active:scale-95"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 font-bold text-xs text-[#1755A7] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                        <Sparkles className="h-3 w-3 text-[#F8C401]" />
                        {c.provider}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${badge.class}`}>
                        {badge.label}
                      </span>
                    </div>

                    <h3 className="mt-3 text-sm font-bold text-slate-900 group-hover:text-[#1755A7] transition-colors line-clamp-2">
                      {c.title}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                      {c.shortDescription || c.description}
                    </p>

                    {/* Meta Pills */}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-600">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {c.durationHours}h {c.durationWeeks ? `(${c.durationWeeks}w)` : ""}
                      </span>
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-700">
                        {c.difficulty}
                      </span>
                      {c.levelRequirement && (
                        <span className="text-[#1755A7]">
                          Lvl {c.levelRequirement}+
                        </span>
                      )}
                    </div>

                    {/* Skills Tags */}
                    {c.skillsCovered && c.skillsCovered.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {c.skillsCovered.slice(0, 3).map((s) => (
                          <span key={s} className="rounded-md bg-slate-50 border border-slate-200/80 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="inline-flex items-center gap-1 font-mono font-black text-xs text-[#1755A7] bg-[#1755A7]/10 px-2 py-0.5 rounded-lg">
                      <Award className="h-3.5 w-3.5" />
                      +{c.pointsValue} pts
                    </span>

                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1755A7] group-hover:translate-x-0.5 transition-transform">
                      <span>View Tasks</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </StudentShell>
  );
}
