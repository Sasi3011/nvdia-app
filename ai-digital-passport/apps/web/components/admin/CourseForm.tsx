"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ConsoleCard } from "../console/ConsoleCard";
import { Button } from "../ui/Button";
import { ErrorBanner } from "../ui/ErrorBanner";
import { adminCoursesApi, type UpsertCourseInput } from "../../lib/api";

const inputClass = "rounded-card border border-border bg-surface px-3 py-2 text-body text-ink placeholder:text-text-muted";
const labelClass = "flex flex-col gap-1 text-caption text-text-muted";
const STATUSES: UpsertCourseInput["status"][] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const CATEGORIES = ["AI Foundation", "AI Engineering", "AI Computing", "Advanced AI", "Research", "Startup / Innovation", "Industry Skills"];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced", "Expert"];
const DELIVERY_MODES = ["Online", "Offline", "Hybrid", "Lab-based", "Live cohort"];
const ENROLLMENT_TYPES = ["Open", "Approval Required", "Invite Only", "Assigned by Admin"];

type CourseForEdit = UpsertCourseInput & { courseId?: string };

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
}: {
  course?: CourseForEdit;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(course?.title ?? "");
  const [shortDescription, setShortDescription] = useState(course?.shortDescription ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [provider, setProvider] = useState(course?.provider ?? "Coursera");
  const [externalUrl, setExternalUrl] = useState(course?.externalUrl ?? "");
  const [category, setCategory] = useState(course?.category ?? "AI Foundation");
  const [difficulty, setDifficulty] = useState(course?.difficulty ?? "Beginner");
  const [durationHours, setDurationHours] = useState(course?.durationHours ?? 8);
  const [durationWeeks, setDurationWeeks] = useState<number | "">(course?.durationWeeks ?? "");
  const [deliveryMode, setDeliveryMode] = useState(course?.deliveryMode ?? "Online");
  const [enrollmentType, setEnrollmentType] = useState(course?.enrollmentType ?? "Open");
  const [certificateAvailable, setCertificateAvailable] = useState(course?.certificateAvailable ?? true);
  const [isFeatured, setIsFeatured] = useState(course?.isFeatured ?? false);
  const [pointsValue, setPointsValue] = useState(course?.pointsValue ?? 50);
  const [levelRequirement, setLevelRequirement] = useState<number | "">(course?.levelRequirement ?? "");
  const [status, setStatus] = useState<UpsertCourseInput["status"]>(course?.status ?? "PUBLISHED");
  const [targetAudience, setTargetAudience] = useState(course?.targetAudience ?? "");
  const [skillsCovered, setSkillsCovered] = useState(joinLines(course?.skillsCovered));
  const [prerequisites, setPrerequisites] = useState(joinLines(course?.prerequisites));
  const [learningOutcomes, setLearningOutcomes] = useState(joinLines(course?.learningOutcomes));
  const [toolsRequired, setToolsRequired] = useState(joinLines(course?.toolsRequired));

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
    onSuccess: onDone,
  });

  return (
    <ConsoleCard className="mb-6">
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        {save.isError ? <ErrorBanner error={save.error} /> : null}
        <Section title="1. Course identity" description="What students see in the catalog and course detail page.">
          <div className="grid grid-cols-1 gap-3 tablet:grid-cols-2">
            <label className={labelClass}>
              Course title
              <input required placeholder="Python for AI" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
            </label>
            <label className={labelClass}>
              Source platform
              <input required placeholder="Coursera, Udemy, NPTEL, NVIDIA, AWS" value={provider} onChange={(e) => setProvider(e.target.value)} className={inputClass} />
            </label>
          </div>
          <label className={labelClass}>
            Short catalog summary
            <input placeholder="Hands-on Python, notebooks, NumPy, Pandas and first ML model." value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            Full description
            <textarea required rows={4} placeholder="What the course teaches, how students will work, and what proof they submit." value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            External course URL
            <input required type="url" placeholder="https://..." value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} className={inputClass} />
          </label>
        </Section>

        <Section title="2. Track, level and access" description="Use these fields to make the listing work like a real learning catalog.">
          <div className="grid grid-cols-1 gap-3 tablet:grid-cols-3">
            <Select label="Academy track" value={category} onChange={setCategory} options={CATEGORIES} />
            <Select label="Difficulty" value={difficulty} onChange={setDifficulty} options={DIFFICULTIES} />
            <Select label="Delivery mode" value={deliveryMode} onChange={setDeliveryMode} options={DELIVERY_MODES} />
          </div>
          <div className="grid grid-cols-1 gap-3 tablet:grid-cols-4">
            <label className={labelClass}>
              Duration hours
              <input required type="number" min={0} value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))} className={inputClass} />
            </label>
            <label className={labelClass}>
              Duration weeks
              <input type="number" min={1} placeholder="Optional" value={durationWeeks} onChange={(e) => setDurationWeeks(e.target.value === "" ? "" : Number(e.target.value))} className={inputClass} />
            </label>
            <Select label="Enrollment type" value={enrollmentType} onChange={setEnrollmentType} options={ENROLLMENT_TYPES} />
            <label className={labelClass}>
              Required AI level
              <input type="number" min={1} max={6} placeholder="Optional" value={levelRequirement} onChange={(e) => setLevelRequirement(e.target.value === "" ? "" : Number(e.target.value))} className={inputClass} />
            </label>
          </div>
        </Section>

        <Section title="3. Points, certificate and visibility" description="These settings connect course completion to AI Passport progress.">
          <div className="grid grid-cols-1 gap-3 tablet:grid-cols-4">
            <label className={labelClass}>
              Completion points
              <input required type="number" min={0} value={pointsValue} onChange={(e) => setPointsValue(Number(e.target.value))} className={inputClass} />
            </label>
            <Select label="Status" value={status} onChange={(value) => setStatus(value as UpsertCourseInput["status"])} options={STATUSES} />
            <label className="flex items-center gap-2 pt-6 text-body text-ink">
              <input type="checkbox" checked={certificateAvailable} onChange={(e) => setCertificateAvailable(e.target.checked)} />
              Certificate
            </label>
            <label className="flex items-center gap-2 pt-6 text-body text-ink">
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
              Featured
            </label>
          </div>
        </Section>

        <Section title="4. Learning design" description="One item per line. These appear in the student detail page.">
          <div className="grid grid-cols-1 gap-3 tablet:grid-cols-2">
            <TextList label="Skills covered" value={skillsCovered} onChange={setSkillsCovered} placeholder={"Prompt engineering\nPython\nModel training"} />
            <TextList label="Tools required" value={toolsRequired} onChange={setToolsRequired} placeholder={"Python\nJupyter Notebook\nGoogle Colab"} />
            <TextList label="Prerequisites" value={prerequisites} onChange={setPrerequisites} placeholder={"Basic computer knowledge\nNo prior AI required"} />
            <TextList label="Learning outcomes" value={learningOutcomes} onChange={setLearningOutcomes} placeholder={"Build a small ML model\nSubmit certificate proof\nExplain responsible AI basics"} />
          </div>
          <label className={labelClass}>
            Target audience
            <textarea rows={2} placeholder="Example: 1st and 2nd year students starting their AI Explorer journey." value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className={inputClass} />
          </label>
        </Section>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="primary" disabled={save.isPending}>
            {save.isPending ? "Saving..." : course?.courseId ? "Save changes" : "Create course"}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </ConsoleCard>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-card border border-navy-700 p-4">
      <div>
        <h3 className="text-body font-semibold text-ink">{title}</h3>
        <p className="text-caption text-text-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className={labelClass}>
      {label}
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

function TextList({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className={labelClass}>
      {label}
      <textarea rows={4} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputClass} />
    </label>
  );
}
