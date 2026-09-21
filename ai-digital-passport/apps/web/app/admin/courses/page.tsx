"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { CourseForm, type CourseForEdit } from "../../../components/admin/CourseForm";
import { TaskCreationModal } from "../../../components/admin/TaskCreationModal";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { Spinner } from "../../../components/ui/Spinner";
import { adminCoursesApi, type AdminCourseListItemResponse } from "../../../lib/api";
import { 
  BookOpen, 
  Briefcase, 
  Clock, 
  Layers, 
  Award, 
  ShieldCheck, 
  Plus, 
  Search, 
  ExternalLink,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  Edit3,
  Archive,
  Trash2,
  Filter,
  ChevronDown
} from "lucide-react";

export default function AdminCoursesPage() {
  const queryClient = useQueryClient();
  const courses = useQuery({ queryKey: ["admin", "courses"], queryFn: adminCoursesApi.list });
  const [modalCourse, setModalCourse] = useState<CourseForEdit | "new" | null>(null);
  const [taskModalCourse, setTaskModalCourse] = useState<{ id: string, title: string } | null>(null);
  const [search, setSearch] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("ALL");

  const invalidate = () => {
    setModalCourse(null);
    queryClient.invalidateQueries({ queryKey: ["admin", "courses"] });
  };

  const archive = useMutation({
    mutationFn: (id: string) => adminCoursesApi.archive(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "courses"] }),
  });

  const publish = useMutation({
    mutationFn: (id: string) => adminCoursesApi.publish(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "courses"] }),
  });

  const deleteCourse = useMutation({
    mutationFn: (id: string) => adminCoursesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "courses"] }),
  });

  const allCourses = courses.data ?? [];
  const providers = ["ALL", ...Array.from(new Set(allCourses.map((c) => c.provider)))];

  const filteredCourses = allCourses.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase());
    const matchesProvider = selectedProvider === "ALL" || c.provider === selectedProvider;
    return matchesSearch && matchesProvider;
  });

  const totalPoints = allCourses.reduce((acc, c) => acc + (c.pointsValue || 0), 0);

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader
        title="Curriculum & Learning Pathways"
        description="Configure canonical course providers (NVIDIA DLI, Coursera, NPTEL), point weights, competency level requisites, and verification criteria."
        actions={
          <button
            onClick={() => setModalCourse("new")}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#2563EB] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1E40AF] transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Course</span>
          </button>
        }
      />

      {/* Course Modal Popup */}
      {modalCourse && (
        <CourseForm
          course={modalCourse === "new" ? undefined : modalCourse}
          onDone={invalidate}
          onCancel={() => setModalCourse(null)}
          isModal={true}
        />
      )}

      {/* KPI Overview Tiles */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Card 1: Total Curricula */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#1755A7] via-[#2563EB] to-[#38BDF8]" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold text-slate-500">Total Curricula</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1755A7]/15 to-[#2563EB]/10 text-[#1755A7]">
              <BookOpen className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{allCourses.length}</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
              Active Modules
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Published Courses:</span>
            <span className="font-bold text-slate-800">{allCourses.filter(c => c.status === "PUBLISHED").length}</span>
          </div>
        </div>

        {/* Card 2: Accredited Providers */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold text-slate-500">Accredited Providers</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-400/10 text-emerald-600">
              <GraduationCap className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{providers.length - 1 || 4}</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
              Platforms
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>NVIDIA DLI & DeepLearning.AI:</span>
            <span className="font-bold text-[#1755A7]">Primary</span>
          </div>
        </div>

        {/* Card 3: Certification Available */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#F8C401] via-amber-500 to-orange-500" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold text-slate-500">Certification Available</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 text-amber-600">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {allCourses.filter(c => c.certificateAvailable).length}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
              Verifiable
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Level 3+ Advanced:</span>
            <span className="font-bold text-[#1755A7]">{allCourses.filter(c => (c.levelRequirement || 1) >= 3).length} Tracks</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search courses or categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7]"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="w-full md:w-48 appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 py-2 text-xs font-bold text-slate-700 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7] shadow-2xs cursor-pointer"
          >
            {providers.map((p) => (
              <option key={p} value={p}>
                {p === "ALL" ? "All Platforms" : p}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Courses List Table with Full CRUD */}
      {courses.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner label="Loading curriculum..." />
        </div>
      ) : courses.isError ? (
        <ErrorBanner error={courses.error} />
      ) : filteredCourses.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm font-bold text-slate-700">No courses match your criteria.</p>
          <p className="text-xs text-slate-400 mt-1">Try changing the filter or clicking "Create New Course" above.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Course & Specialization</th>
                <th className="px-6 py-3.5">Provider / Track</th>
                <th className="px-6 py-3.5">Pillar & Level</th>
                <th className="px-6 py-3.5 text-right">Points Bounty</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCourses.map((c) => (
                <tr key={c.courseId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-[13px]">{c.title}</span>
                        <div className="mt-1 flex items-center gap-2">
                          {c.isFeatured && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                              <Sparkles className="h-2.5 w-2.5 text-amber-600" /> Featured
                            </span>
                          )}
                          {c.certificateAvailable && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              Cert Verified
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 font-medium">
                            {c.durationHours}h {c.durationWeeks ? `(${c.durationWeeks} weeks)` : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-[#1755A7] flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                        {c.provider}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">{c.category}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex w-fit items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-800 text-[11px]">
                        Lvl {c.levelRequirement || 1}+ Requisite
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">{c.difficulty}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center gap-1 font-mono font-black text-xs text-[#1755A7] bg-[#1755A7]/10 px-2.5 py-1 rounded-lg">
                      <Award className="h-3.5 w-3.5" />
                      +{c.pointsValue} pts
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      c.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' :
                      c.status === 'ARCHIVED' ? 'bg-slate-200 text-slate-700' :
                      'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}>
                      {c.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const fullCourse = allCourses.find((item) => item.courseId === c.courseId);
                          if (fullCourse) {
                            setModalCourse(fullCourse as unknown as CourseForEdit);
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:border-blue-300 transition-all active:scale-95"
                        title="Edit Course Pathway"
                      >
                        <Edit3 className="h-3 w-3 text-blue-500" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTaskModalCourse({ id: c.courseId, title: c.title });
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-all active:scale-95"
                        title="Add Task to Course"
                      >
                        <Plus className="h-3 w-3 text-emerald-600" />
                        <span>Manage Tasks</span>
                      </button>

                      {c.status === "PUBLISHED" ? (
                        <button
                          type="button"
                          disabled={archive.isPending}
                          onClick={() => archive.mutate(c.courseId)}
                          className="rounded-lg p-1.5 hover:bg-amber-50 hover:text-amber-700 transition-colors active:scale-95"
                          title="Archive Course"
                        >
                          <Archive className="h-3.5 w-3.5 text-amber-500" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={publish.isPending}
                          onClick={() => publish.mutate(c.courseId)}
                          className="rounded-lg p-1.5 hover:bg-emerald-50 hover:text-emerald-700 transition-colors active:scale-95"
                          title="Publish Course"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={deleteCourse.isPending}
                        onClick={() => {
                          if (confirm("Are you sure you want to permanently delete this course?")) {
                            deleteCourse.mutate(c.courseId);
                          }
                        }}
                        className="rounded-lg p-1.5 hover:bg-red-50 hover:text-red-700 transition-colors active:scale-95"
                        title="Delete Course"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {taskModalCourse && (
        <TaskCreationModal
          courseId={taskModalCourse.id}
          courseTitle={taskModalCourse.title}
          onClose={() => setTaskModalCourse(null)}
          onFinish={() => {
            setTaskModalCourse(null);
            courses.refetch();
          }}
        />
      )}
    </ConsoleShell>
  );
}
