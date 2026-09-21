"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ErrorBanner } from "../ui/ErrorBanner";
import { adminCoursesApi, type UpsertCourseInput } from "../../lib/api";
import { 
  BookOpen, 
  Layers, 
  Award, 
  ShieldCheck, 
  Clock, 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  FileText,
  Sliders,
  GraduationCap,
  X,
  Plus
} from "lucide-react";
import { CustomSelect } from "../ui/CustomSelect";

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7] transition-colors";
const labelClass = "flex flex-col gap-1.5 text-xs font-bold text-slate-700";

const STATUSES: UpsertCourseInput["status"][] = ["PUBLISHED", "DRAFT", "ARCHIVED"];
const CATEGORIES = ["AI Foundation", "AI Engineering", "AI Computing", "Advanced AI", "Research", "Startup / Innovation", "Industry Skills"];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced", "Expert"];
const DELIVERY_MODES = ["Online", "Offline", "Hybrid", "Lab-based", "Live cohort"];
const ENROLLMENT_TYPES = ["Open", "Approval Required", "Invite Only", "Assigned by Admin"];
export const POPULAR_PROVIDERS = ["NVIDIA", "NPTEL", "Coursera", "AWS", "Microsoft Learn", "Google Cloud", "Cisco", "GitHub", "Kaggle", "Hugging Face", "LeetCode"];

export type CourseForEdit = UpsertCourseInput & { courseId?: string };

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinLines(value?: string[]) {
  return (value ?? []).join("\n");
}

export function CourseForm({
  course,
  onDone,
  onCancel,
  isModal = false,
}: {
  course?: CourseForEdit;
  onDone: () => void;
  onCancel: () => void;
  isModal?: boolean;
}) {
  const [title, setTitle] = useState(course?.title ?? "");
  const [shortDescription, setShortDescription] = useState(course?.shortDescription ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [provider, setProvider] = useState(course?.provider ?? "NVIDIA DLI");
  const [externalUrl, setExternalUrl] = useState(course?.externalUrl ?? "");
  const [category, setCategory] = useState(course?.category ?? "AI Computing");
  const [difficulty, setDifficulty] = useState(course?.difficulty ?? "Intermediate");
  const [durationHours, setDurationHours] = useState(course?.durationHours ?? 16);
  const [durationWeeks, setDurationWeeks] = useState<number | "">(course ? (course.durationWeeks ?? "") : 4);
  const [deliveryMode, setDeliveryMode] = useState(course?.deliveryMode ?? "Hybrid");
  const [enrollmentType, setEnrollmentType] = useState(course?.enrollmentType ?? "Open");
  const [certificateAvailable, setCertificateAvailable] = useState(course?.certificateAvailable ?? true);
  const [isFeatured, setIsFeatured] = useState(course?.isFeatured ?? false);
  const [pointsValue, setPointsValue] = useState(course?.pointsValue ?? 100);
  const [levelRequirement, setLevelRequirement] = useState<number | "">(course ? (course.levelRequirement ?? "") : "");
  const [status, setStatus] = useState<UpsertCourseInput["status"]>(course?.status ?? "PUBLISHED");
  const [targetAudience, setTargetAudience] = useState(course?.targetAudience ?? "");
  const [skillsCovered, setSkillsCovered] = useState(joinLines(course?.skillsCovered));
  const [prerequisites, setPrerequisites] = useState(joinLines(course?.prerequisites));
  const [learningOutcomes, setLearningOutcomes] = useState(joinLines(course?.learningOutcomes));
  const [toolsRequired, setToolsRequired] = useState(joinLines(course?.toolsRequired));

  const [customProviders, setCustomProviders] = useState<string[]>([]);
  const [isAddingProvider, setIsAddingProvider] = useState(false);
  const [newProviderName, setNewProviderName] = useState("");
  const allProviders = useMemo(() => Array.from(new Set([...POPULAR_PROVIDERS, ...customProviders, provider])), [customProviders, provider]);

  const listValues = useMemo(
    () => ({
      skills: splitLines(skillsCovered),
      outcomes: splitLines(learningOutcomes),
      prerequisites: splitLines(prerequisites),
      tools: splitLines(toolsRequired),
    }),
    [learningOutcomes, prerequisites, skillsCovered, toolsRequired],
  );

  const save = useMutation({
    mutationFn: () => {
      const input: UpsertCourseInput = {
        title,
        shortDescription,
        description,
        category,
        difficulty,
        durationHours,
        durationWeeks: durationWeeks === "" ? null : durationWeeks,
        deliveryMode,
        enrollmentType,
        certificateAvailable,
        isFeatured,
        skillsCovered: listValues.skills,
        prerequisites: listValues.prerequisites,
        learningOutcomes: listValues.outcomes,
        toolsRequired: listValues.tools,
        targetAudience,
        provider,
        externalUrl,
        pointsValue,
        levelRequirement: levelRequirement === "" ? null : levelRequirement,
        status,
      };
      return course?.courseId ? adminCoursesApi.update(course.courseId, input) : adminCoursesApi.create(input);
    },
    onSuccess: () => {
      onDone();
    },
  });

  const formContent = (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl ${isModal ? "flex max-h-[92vh] w-full max-w-4xl flex-col" : "mb-8"}`}>
      {/* Header Banner */}
      <div className="flex shrink-0 items-center justify-between gap-3 bg-gradient-to-r from-[#1755A7] via-[#1E40AF] to-[#2563EB] px-4 py-4 text-white sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#F8C401] backdrop-blur-sm shadow-2xs">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold">
              {course?.courseId ? "Edit Curriculum & Specialization" : "Create New Course Pathway"}
            </h3>
            <p className="text-xs text-blue-100">
              Configure course syllabus, credit weighting, requisite competency levels, and accredited proof
            </p>
          </div>
        </div>

        {isModal && (
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <form
        className={`flex flex-col gap-6 overflow-y-auto p-4 minute-scrollbar sm:p-6 md:p-8 ${isModal ? "min-h-0 flex-1" : "max-h-[75vh]"}`}
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        {save.isError && <ErrorBanner error={save.error} />}

        {/* Section 1: Course Information */}
        <FormSection 
          icon={GraduationCap}
          title="Course Information" 
          description="Basic information visible on the student curriculum catalog."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span>Course Title <span className="text-red-500">*</span></span>
              <input required placeholder="E.g. Fundamentals of Deep Learning with TensorRT" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
            </label>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                <span>Accredited Provider <span className="text-red-500">*</span></span>
              </label>
              {isAddingProvider ? (
                <div className="flex items-center gap-2">
                  <input 
                    autoFocus
                    placeholder="Type new provider name..." 
                    value={newProviderName} 
                    onChange={(e) => setNewProviderName(e.target.value)} 
                    className={inputClass}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newProviderName.trim()) {
                          setCustomProviders(prev => [...prev, newProviderName.trim()]);
                          setProvider(newProviderName.trim());
                          setIsAddingProvider(false);
                          setNewProviderName("");
                        }
                      }
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      if (newProviderName.trim()) {
                        setCustomProviders(prev => [...prev, newProviderName.trim()]);
                        setProvider(newProviderName.trim());
                      }
                      setIsAddingProvider(false);
                      setNewProviderName("");
                    }}
                    className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setIsAddingProvider(false); setNewProviderName(""); }}
                    className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <CustomSelect 
                      value={provider} 
                      onChange={setProvider} 
                      options={allProviders.map(p => ({ label: p, value: p }))}
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setIsAddingProvider(true)}
                    className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    title="Add New Provider"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <label className={labelClass}>
            <span>Catalog Summary (One-liner)</span>
            <input placeholder="Hands-on neural networks, CUDA acceleration, and deployment on NVIDIA DGX." value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} className={inputClass} />
          </label>

          <label className={labelClass}>
            <span>Full Syllabus & Learning Objective <span className="text-red-500">*</span></span>
            <textarea required rows={3} placeholder="Comprehensive course syllabus, laboratory exercises, and expected proof of completion..." value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
          </label>

          <label className={labelClass}>
            <span>External Course / Enrollment URL <span className="text-red-500">*</span></span>
            <input required type="url" placeholder="https://learn.nvidia.com/..." value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} className={inputClass} />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span>Duration (Hours) <span className="text-red-500">*</span></span>
              <input required type="number" min={1} value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))} className={inputClass} />
            </label>

            <label className={labelClass}>
              <span>Duration (Weeks)</span>
              <input type="number" min={1} placeholder="Optional" value={durationWeeks} onChange={(e) => setDurationWeeks(e.target.value === "" ? "" : Number(e.target.value))} className={inputClass} />
            </label>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input 
              type="checkbox" 
              id="certCheck"
              checked={certificateAvailable} 
              onChange={(e) => setCertificateAvailable(e.target.checked)} 
              className="h-4 w-4 rounded text-[#1755A7] focus:ring-[#1755A7]"
            />
            <label htmlFor="certCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
              Certificate Required
            </label>
          </div>
        </FormSection>

        {/* Action Buttons Sticky Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-end">
          <button 
            type="button" 
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-5 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors active:scale-95 sm:py-2.5"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={save.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#2563EB] px-6 py-3 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1E40AF] transition-all disabled:opacity-50 active:scale-95 sm:py-2.5"
          >
            {save.isPending ? "Saving Curriculum..." : course?.courseId ? "Save Changes" : "Publish Course Pathway"}
          </button>
        </div>
      </form>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
        {formContent}
      </div>
    );
  }

  return formContent;
}

  function FormSection({ 
    icon: Icon, 
    title, 
    description, 
    children 
  }: { 
    icon: typeof BookOpen; 
    title: string; 
    description: string; 
    children: ReactNode 
  }) {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200/90 bg-slate-50/40 p-4 sm:p-5">
        <div className="border-b border-slate-200/70 pb-3">
          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
            <Icon className="h-4 w-4 text-[#1755A7]" />
            {title}
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
        </div>
        {children}
      </div>
    );
  }
