"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { Spinner } from "../../../components/ui/Spinner";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { adminCoursesApi } from "../../../lib/api";
import { 
  BookOpen, 
  Sparkles, 
  Search, 
  Filter, 
  Clock, 
  Award, 
  ArrowUpRight, 
  CheckCircle2, 
  Layers, 
  ExternalLink,
  Users,
  ShieldCheck
} from "lucide-react";

export default function MentorCourseCatalogPage() {
  const [search, setSearch] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("ALL");
  const courses = useQuery({ queryKey: ["mentor", "course-catalog"], queryFn: adminCoursesApi.list });

  const rawCourses = courses.data ?? [];
  const publishedCount = rawCourses.filter((c) => c.status === "PUBLISHED").length;
  const featuredCount = rawCourses.filter((c) => c.isFeatured).length;

  const filteredCourses = rawCourses.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.provider.toLowerCase().includes(search.toLowerCase()) || (c.shortDescription && c.shortDescription.toLowerCase().includes(search.toLowerCase()));
    const matchesDiff = selectedDifficulty === "ALL" || c.difficulty === selectedDifficulty;
    return matchesSearch && matchesDiff;
  });

  return (
    <ConsoleShell role="MENTOR">
      <div className="space-y-6">
        
        {/* Top Header Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 lg:p-8 shadow-xs">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-gradient-to-br from-[#1755A7]/10 to-[#F8C401]/15 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-3xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1755A7]/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#1755A7]">
                  <Sparkles className="h-3.5 w-3.5 text-[#F8C401]" />
                  Faculty Mentor Hub
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Course Catalog
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900">Institutional Curricula & DLI Courses</h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Explore accredited NVIDIA Deep Learning Institute (DLI) syllabi and college courses. Monitor curriculum status and jump directly into the student submission verification queue.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/mentor/courses"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1755A7] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#134486] hover:shadow-md hover:shadow-[#1755A7]/20 active:scale-95"
              >
                Review Student Submissions
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* 4 KPI Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Published Curricula</div>
            <div className="mt-2 text-2xl font-black text-slate-900">{publishedCount} Active</div>
            <div className="mt-1 text-xs text-slate-500">Live in student catalog</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Featured AI Tracks</div>
            <div className="mt-2 text-2xl font-black text-amber-600">{featuredCount} Specializations</div>
            <div className="mt-1 text-xs text-slate-500">High-priority NVIDIA tracks</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Catalog Size</div>
            <div className="mt-2 text-2xl font-black text-[#1755A7]">{rawCourses.length} Curricula</div>
            <div className="mt-1 text-xs text-slate-500">Includes archived courses</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Accreditation Tier</div>
            <div className="mt-2 text-2xl font-black text-emerald-600">NVIDIA DLI</div>
            <div className="mt-1 text-xs text-slate-500">Digitally verifiable certificates</div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search course title, provider, keywords…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Difficulty:</span>
            {["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED"].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDifficulty(d)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedDifficulty === d
                    ? "bg-[#1755A7] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {d === "ALL" ? "All Levels" : d.charAt(0) + d.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Course Catalog Cards Grid */}
        {courses.isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Spinner label="Loading course catalog…" />
          </div>
        ) : courses.isError ? (
          <ErrorBanner error={courses.error} />
        ) : filteredCourses.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center shadow-xs space-y-3">
            <BookOpen className="mx-auto h-12 w-12 text-slate-400" />
            <p className="text-xs text-slate-500">No courses match your filter criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => {
              const isPublished = course.status === "PUBLISHED";
              return (
                <div
                  key={course.courseId}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-[#1755A7]/40 hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1755A7]/10 px-2.5 py-0.5 text-xs font-bold text-[#1755A7]">
                        {course.provider}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {course.isFeatured && (
                          <span className="rounded-full bg-amber-50 border border-amber-200/60 px-2 py-0.5 text-[10px] font-extrabold text-amber-800 uppercase">
                            Featured
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                            isPublished
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {course.status}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-black text-slate-900 leading-snug">{course.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {course.shortDescription || "Master deep learning, foundation models, and accelerated GPU computing workflows."}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-semibold text-slate-500">
                      <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-slate-700">
                        {course.category}
                      </span>
                      <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-slate-700">
                        {course.difficulty}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="h-3 w-3" /> {course.durationHours} hrs
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F8C401]/15 px-2.5 py-0.5 font-mono text-xs font-black text-amber-900 border border-[#F8C401]/30">
                      <Sparkles className="h-3 w-3 text-[#F8C401]" />
                      +{course.pointsValue} pts
                    </span>

                    <Link
                      href="/mentor/courses"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white transition-all hover:bg-slate-800 active:scale-95"
                    >
                      Review Proofs
                      <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </ConsoleShell>
  );
}
