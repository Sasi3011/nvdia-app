"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConsolePageHeader } from "../console/ConsolePageHeader";
import { CourseDetailModal } from "./CourseDetailModal";
import { CourseForm, POPULAR_PROVIDERS, type CourseForEdit } from "./CourseForm";
import { ErrorBanner } from "../ui/ErrorBanner";
import { Spinner } from "../ui/Spinner";
import { useConfirm } from "../ui/ConfirmDialogProvider";
import { adminCoursesApi, type AdminCourseListItemResponse } from "../../lib/api";
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
  ChevronDown,
  Eye,
  CheckCircle
} from "lucide-react";
import { CustomSelect } from "../ui/CustomSelect";

// Full course management (list, create, edit, publish, archive, delete).
// Shared by the admin Courses & Curricula page and the faculty Course
// Catalog - the API grants both roles the same access (admin-courses.controller).
export function CoursesManager() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const courses = useQuery({ queryKey: ["admin", "courses"], queryFn: adminCoursesApi.list });
  const [modalCourse, setModalCourse] = useState<CourseForEdit | "new" | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("ALL");
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);
  const [editError, setEditError] = useState<unknown>(null);

  // The list only has summary fields; fetch the full record so the editor never saves blanks over real data.
  async function openEditor(courseId: string) {
    setEditError(null);
    setLoadingEditId(courseId);
    try {
      const full = await queryClient.fetchQuery({ queryKey: ["admin", "courses", courseId], queryFn: () => adminCoursesApi.get(courseId), staleTime: 0 });
      setModalCourse(full as unknown as CourseForEdit);
    } catch (err) {
      setEditError(err);
    } finally {
      setLoadingEditId(null);
    }
  }

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


  const activeCourses = allCourses.filter((c) => c.status !== "ARCHIVED");
  const providerCounts = activeCourses.reduce<Record<string, { name: string; count: number }>>((acc, c) => {
    const key = c.provider.trim().toLowerCase();
    return { ...acc, [key]: { name: acc[key]?.name ?? c.provider.trim(), count: (acc[key]?.count ?? 0) + 1 } };
  }, {});
  const providerList = Object.values(providerCounts).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const topProvider = providerList[0];
  // Accredited = the platforms the catalog accepts (the form's provider list) plus any other provider used by an active course.
  // The KPI count and the filter dropdown both use this one list, so adding a provider updates both.
  const accreditedList = (() => {
    const seen = new Map<string, string>();
    for (const name of [...POPULAR_PROVIDERS, ...activeCourses.map((c) => c.provider.trim())]) {
      if (name && !seen.has(name.toLowerCase())) seen.set(name.toLowerCase(), name);
    }
    return Array.from(seen.values());
  })();
  const providers = ["ALL", ...accreditedList];

  const filteredCourses = allCourses.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase());
    const matchesProvider = selectedProvider === "ALL" || c.provider.trim().toLowerCase() === selectedProvider.toLowerCase();
    return matchesSearch && matchesProvider;
  });

  const renderActions = (c: AdminCourseListItemResponse) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setViewId(c.courseId)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all"
            title="View Course Details"
          >
            <Eye className="h-3.5 w-3.5 text-slate-500" />
          </button>
          {c.status !== "PUBLISHED" && (
            <button
              type="button"
              disabled={publish.isPending}
              onClick={() => publish.mutate(c.courseId)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-200 transition-all disabled:opacity-50"
              title="Publish"
            >
              <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
            </button>
          )}
          {c.status !== "ARCHIVED" && (
            <button
              type="button"
              disabled={archive.isPending}
              onClick={async () => { if (await confirm({ message: "Archive this course?", confirmLabel: "Archive" })) archive.mutate(c.courseId); }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-amber-50 hover:border-amber-200 transition-all disabled:opacity-50"
              title="Archive"
            >
              <Archive className="h-3.5 w-3.5 text-amber-500" />
            </button>
          )}
          <button
            type="button"
            disabled={loadingEditId === c.courseId}
            onClick={() => void openEditor(c.courseId)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all active:scale-95"
            title="Edit"
          >
            <Edit3 className="h-3.5 w-3.5 text-blue-500" />
          </button>
          <button
            type="button"
            disabled={deleteCourse.isPending}
            onClick={async () => {
              if (await confirm({ message: "Are you sure you want to permanently delete this course?", confirmLabel: "Delete" })) {
                deleteCourse.mutate(c.courseId);
              }
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 transition-all active:scale-95"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-500 hover:text-red-600" />
          </button>
        </div>
  );

  return (
    <>
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

      {viewId && <CourseDetailModal courseId={viewId} onClose={() => setViewId(null)} />}

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
            <span className="text-3xl font-black text-slate-900 tracking-tight">{accreditedList.length}</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
              Platforms
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Most used (active courses):</span>
            <span className="font-bold text-[#1755A7]">{topProvider ? `${topProvider.name} (${topProvider.count})` : "-"}</span>
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

      {(archive.isError || publish.isError || deleteCourse.isError || !!editError) && (
        <div className="mt-4">
          <ErrorBanner error={archive.error ?? publish.error ?? deleteCourse.error ?? editError} />
        </div>
      )}

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

        <div className="w-full md:w-48">
          <CustomSelect
            value={selectedProvider}
            onChange={setSelectedProvider}
            options={providers.map(p => ({ label: p === "ALL" ? "All Platforms" : p, value: p }))}
          />
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
        <>
        <div className="mt-6 space-y-3 md:hidden">
          {filteredCourses.map((c) => (
            <div key={c.courseId} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <button type="button" onClick={() => setViewId(c.courseId)} className="min-w-0 break-words text-left text-[13px] font-bold text-slate-900">{c.title}</button>
                <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${c.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : c.status === "ARCHIVED" ? "bg-slate-100 text-slate-500" : "bg-amber-50 text-amber-700"}`}>{c.status}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-600">
                <span className="flex items-center gap-1.5 text-[#1755A7]"><Briefcase className="h-3.5 w-3.5 text-slate-400" />{c.provider}</span>
                <span>{c.durationHours}h{c.durationWeeks ? ` (${c.durationWeeks} weeks)` : ""}</span>
              </div>
              <div className="mt-3 border-t border-slate-100 pt-3">{renderActions(c)}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Course & Specialization</th>
                <th className="px-6 py-3.5">Provider</th>
                <th className="px-6 py-3.5 text-center">Timeline</th>
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
                        <button type="button" onClick={() => setViewId(c.courseId)} className="text-left font-bold text-slate-900 text-[13px] hover:text-[#1755A7] transition-colors">{c.title}</button>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-[#1755A7] flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                        {c.provider}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="text-[12px] font-bold text-slate-700 whitespace-nowrap">
                      {c.durationHours}h {c.durationWeeks ? `(${c.durationWeeks} weeks)` : ""}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${c.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : c.status === "ARCHIVED" ? "bg-slate-100 text-slate-500" : "bg-amber-50 text-amber-700"}`}>{c.status}</span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    {renderActions(c)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </>
  );
}
