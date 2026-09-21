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
  X
} from "lucide-react";
import { TaskCreationModal } from "./TaskCreationModal";

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7] transition-colors";
const labelClass = "flex flex-col gap-1.5 text-xs font-bold text-slate-700";

const STATUSES: UpsertCourseInput["status"][] = ["PUBLISHED", "DRAFT", "ARCHIVED"];
const CATEGORIES = ["AI Foundation", "AI Engineering", "AI Computing", "Advanced AI", "Research", "Startup / Innovation", "Industry Skills"];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced", "Expert"];
const DELIVERY_MODES = ["Online", "Offline", "Hybrid", "Lab-based", "Live cohort"];
const ENROLLMENT_TYPES = ["Open", "Approval Required", "Invite Only", "Assigned by Admin"];
const POPULAR_PROVIDERS = ["NVIDIA DLI", "Coursera", "DeepLearning.AI", "NPTEL", "Sri Eshwar AI Academy", "AWS Academy"];

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
  const [showTaskCreation, setShowTaskCreation] = useState(false);
  const [title, setTitle] = useState(course?.title ?? "");
  const [shortDescription, setShortDescription] = useState(course?.shortDescription ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [provider, setProvider] = useState(course?.provider ?? "NVIDIA DLI");
  const [externalUrl, setExternalUrl] = useState(course?.externalUrl ?? "");
  const [category, setCategory] = useState(course?.category ?? "AI Computing");
  const [difficulty, setDifficulty] = useState(course?.difficulty ?? "Intermediate");
  const [durationHours, setDurationHours] = useState(course?.durationHours ?? 16);
  const [durationWeeks, setDurationWeeks] = useState<number | "">(course?.durationWeeks ?? 4);
  const [deliveryMode, setDeliveryMode] = useState(course?.deliveryMode ?? "Hybrid");
  const [enrollmentType, setEnrollmentType] = useState(course?.enrollmentType ?? "Open");
  const [certificateAvailable, setCertificateAvailable] = useState(course?.certificateAvailable ?? true);
  const [isFeatured, setIsFeatured] = useState(course?.isFeatured ?? false);
  const [pointsValue, setPointsValue] = useState(course?.pointsValue ?? 100);
  const [levelRequirement, setLevelRequirement] = useState<number | "">(course?.levelRequirement ?? 2);
  const [status, setStatus] = useState<UpsertCourseInput["status"]>(course?.status ?? "PUBLISHED");
  const [targetAudience, setTargetAudience] = useState(course?.targetAudience ?? "");
  const [skillsCovered, setSkillsCovered] = useState(joinLines(course?.skillsCovered ?? ["PyTorch", "TensorRT", "CUDA Basics"]));
  const [prerequisites, setPrerequisites] = useState(joinLines(course?.prerequisites ?? ["Basic Python", "Linear Algebra"]));
  const [learningOutcomes, setLearningOutcomes] = useState(joinLines(course?.learningOutcomes ?? ["Optimize deep learning models", "Deploy on NVIDIA DGX"]));
  const [toolsRequired, setToolsRequired] = useState(joinLines(course?.toolsRequired ?? ["Jupyter Lab", "NVIDIA Omniverse"]));

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
      setShowTaskCreation(true);
    },
  });

  const formContent = (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl ${isModal ? "w-full max-w-4xl" : "mb-8"}`}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1755A7] via-[#1E40AF] to-[#2563EB] px-6 py-4 text-white flex items-center justify-between">
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
        className="p-6 md:p-8 flex flex-col gap-6 max-h-[75vh] overflow-y-auto minute-scrollbar"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        {save.isError && <ErrorBanner error={save.error} />}

        {/* Section 1: Course Identity */}
        <FormSection 
          icon={GraduationCap}
          title="1. Course Identity & Platform Source" 
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
              <input required placeholder="E.g. NVIDIA DLI" value={provider} onChange={(e) => setProvider(e.target.value)} className={inputClass} />
              <div className="flex flex-wrap gap-1.5 mt-1">
                {POPULAR_PROVIDERS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProvider(p)}
                    className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                      provider === p ? "bg-[#1755A7] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
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
        </FormSection>

        {/* Section 2: Academic Rigor & Track */}
        <FormSection 
          icon={Layers}
          title="2. Academic Track & Competency Prerequisites" 
          description="Classify the specialization track, difficulty level, and duration."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SelectField label="Academy Track" value={category} onChange={setCategory} options={CATEGORIES} />
            <SelectField label="Difficulty Tier" value={difficulty} onChange={setDifficulty} options={DIFFICULTIES} />
            <SelectField label="Delivery Mode" value={deliveryMode} onChange={setDeliveryMode} options={DELIVERY_MODES} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <label className={labelClass}>
              <span>Duration (Hours) <span className="text-red-500">*</span></span>
              <input required type="number" min={1} value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))} className={inputClass} />
            </label>

            <label className={labelClass}>
              <span>Duration (Weeks)</span>
              <input type="number" min={1} placeholder="Optional" value={durationWeeks} onChange={(e) => setDurationWeeks(e.target.value === "" ? "" : Number(e.target.value))} className={inputClass} />
            </label>

            <SelectField label="Enrollment Type" value={enrollmentType} onChange={setEnrollmentType} options={ENROLLMENT_TYPES} />

            <label className={labelClass}>
              <span>Requisite Level (1-6)</span>
              <input type="number" min={1} max={6} placeholder="E.g. 2" value={levelRequirement} onChange={(e) => setLevelRequirement(e.target.value === "" ? "" : Number(e.target.value))} className={inputClass} />
            </label>
          </div>
        </FormSection>

        {/* Section 3: Points & Verification */}
        <FormSection 
          icon={Award}
          title="3. Competency Points & Verification Configuration" 
          description="Points granted upon student verification, badges, and catalog visibility."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 items-center">
            <label className={labelClass}>
              <span>Completion Points Bounty <span className="text-red-500">*</span></span>
              <div className="relative">
                <input required type="number" min={10} value={pointsValue} onChange={(e) => setPointsValue(Number(e.target.value))} className={`${inputClass} pr-12 font-bold font-mono text-[#1755A7]`} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">pts</span>
              </div>
            </label>

            <SelectField label="Publish Status" value={status} onChange={(v) => setStatus(v as UpsertCourseInput["status"])} options={STATUSES} />

            <div className="flex items-center gap-3 pt-4 sm:pt-6">
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

            <div className="flex items-center gap-3 pt-4 sm:pt-6">
              <input 
                type="checkbox" 
                id="featCheck"
                checked={isFeatured} 
                onChange={(e) => setIsFeatured(e.target.checked)} 
                className="h-4 w-4 rounded text-[#1755A7] focus:ring-[#1755A7]"
              />
              <label htmlFor="featCheck" className="text-xs font-bold text-slate-800 cursor-pointer flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" /> Featured Course
              </label>
            </div>
          </div>
        </FormSection>

        {/* Section 4: Detailed Learning Outcomes */}
        <FormSection 
          icon={FileText}
          title="4. Syllabus Modules, Tools & Target Cohort" 
          description="Enter one item per line. Displayed in student curriculum details."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextListField label="Skills Covered" value={skillsCovered} onChange={setSkillsCovered} placeholder={"CUDA Programming\nPyTorch\nTensorRT Acceleration"} />
            <TextListField label="Tools & Frameworks" value={toolsRequired} onChange={setToolsRequired} placeholder={"NVIDIA Omniverse\nJupyter Lab\nDocker / Containers"} />
            <TextListField label="Prerequisites" value={prerequisites} onChange={setPrerequisites} placeholder={"Python Fundamentals\nBasic Linear Algebra"} />
            <TextListField label="Learning Outcomes" value={learningOutcomes} onChange={setLearningOutcomes} placeholder={"Build an optimized LLM pipeline\nDeploy on NVIDIA DGX A100"} />
          </div>

          <label className={labelClass}>
            <span>Target Audience</span>
            <input placeholder="Example: 2nd and 3rd year students pursuing the AI Specialist track." value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className={inputClass} />
          </label>
        </FormSection>

        {/* Action Buttons Sticky Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button 
            type="button" 
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors active:scale-95"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={save.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#2563EB] px-6 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#1755A7]/25 hover:from-[#124282] hover:to-[#1E40AF] transition-all disabled:opacity-50 active:scale-95"
          >
            {save.isPending ? "Saving Curriculum..." : course?.courseId ? "Save Changes" : "Publish Course Pathway"}
          </button>
        </div>
      </form>
    </div>
  );

  if (showTaskCreation) {
    return (
      <TaskCreationModal 
        courseId={save.data?.courseId ?? course?.courseId ?? ""}
        courseTitle={title}
        onClose={() => {
          setShowTaskCreation(false);
          onDone();
        }}
        onFinish={() => {
          setShowTaskCreation(false);
          onDone();
        }}
      />
    );
  }

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
    <div className="rounded-xl border border-slate-200/90 bg-slate-50/40 p-5 flex flex-col gap-4">
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

function SelectField({ 
  label, 
  value, 
  onChange, 
  options 
}: { 
  label: string; 
  value: string; 
  onChange: (value: string) => void; 
  options: string[] 
}) {
  return (
    <label className={labelClass}>
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextListField({ 
  label, 
  value, 
  onChange, 
  placeholder 
}: { 
  label: string; 
  value: string; 
  onChange: (value: string) => void; 
  placeholder: string 
}) {
  return (
    <label className={labelClass}>
      <span>{label}</span>
      <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputClass} />
    </label>
  );
}
