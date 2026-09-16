"use client";

import { Suspense, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ConsoleShell } from "../../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../../components/console/ConsolePageHeader";
import { ErrorBanner } from "../../../../components/ui/ErrorBanner";
import { Spinner } from "../../../../components/ui/Spinner";
import { CourseForm } from "../../../../components/admin/CourseForm";
import { adminCoursesApi, type CourseTaskTypeValue, type UpsertCourseTaskInput } from "../../../../lib/api";
import { 
  BookOpen, 
  ArrowLeft, 
  Edit3, 
  Archive, 
  CheckCircle, 
  Plus, 
  Layers, 
  Award, 
  ShieldCheck, 
  Clock, 
  ExternalLink,
  Sparkles,
  Lock,
  ListTodo
} from "lucide-react";

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7] transition-colors";
const TASK_TYPES: CourseTaskTypeValue[] = ["STANDARD", "LIVE_PROCTORED"];

export default function AdminCourseDetailPage() {
  return (
    <ConsoleShell role="ADMIN">
      <Suspense fallback={<div className="flex h-64 items-center justify-center"><Spinner label="Loading course..." /></div>}>
        <Content />
      </Suspense>
    </ConsoleShell>
  );
}

function Content() {
  const id = useSearchParams().get("id");
  const queryClient = useQueryClient();
  const [editingCourse, setEditingCourse] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const course = useQuery({ queryKey: ["admin", "courses", id], queryFn: () => adminCoursesApi.get(id!), enabled: !!id });
  const refresh = () => {
    setEditingCourse(false);
    setAddingTask(false);
    setEditingTaskId(null);
    queryClient.invalidateQueries({ queryKey: ["admin", "courses"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "courses", id] });
  };

  const publish = useMutation({ mutationFn: () => adminCoursesApi.publish(id!), onSuccess: refresh });
  const archive = useMutation({ mutationFn: () => adminCoursesApi.archive(id!), onSuccess: refresh });

  if (!id) return <ErrorBanner error="No course id given." />;
  if (course.isLoading) return <div className="flex h-64 items-center justify-center"><Spinner label="Loading curriculum details…" /></div>;
  if (course.isError) return <ErrorBanner error={course.error} />;
  if (!course.data) return null;

  const c = course.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link 
          href="/admin/courses" 
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-xs font-bold text-slate-400">Back to Curriculum Catalog</span>
      </div>

      <ConsolePageHeader
        title={c.title}
        description={`${c.provider} • ${c.category} • ${c.difficulty} • +${c.pointsValue} pts`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditingCourse((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all"
            >
              <Edit3 className="h-3.5 w-3.5 text-[#1755A7]" />
              <span>{editingCourse ? "Close Editor" : "Edit Details"}</span>
            </button>
            {c.status !== "PUBLISHED" ? (
              <button
                disabled={publish.isPending}
                onClick={() => publish.mutate()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1755A7] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#124282] transition-all disabled:opacity-50"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Publish Course</span>
              </button>
            ) : (
              <button
                disabled={archive.isPending}
                onClick={() => archive.mutate()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 transition-all disabled:opacity-50"
              >
                <Archive className="h-3.5 w-3.5" />
                <span>Archive</span>
              </button>
            )}
          </div>
        }
      />

      {editingCourse && (
        <CourseForm course={{ ...c, courseId: c.courseId }} onDone={refresh} onCancel={() => setEditingCourse(false)} />
      )}

      {/* Catalog Setup Overview */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[#1755A7]" />
          Curriculum Metadata & Pathway Rules
        </h3>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <InfoCard label="Track Pillar" value={c.category} />
          <InfoCard label="Difficulty Tier" value={c.difficulty} />
          <InfoCard label="Duration" value={`${c.durationHours}h${c.durationWeeks ? ` (${c.durationWeeks} weeks)` : ""}`} />
          <InfoCard label="Delivery Mode" value={c.deliveryMode} />
          <InfoCard label="Enrollment Type" value={c.enrollmentType} />
          <InfoCard label="Certificate" value={c.certificateAvailable ? "Verified Cert" : "No Certificate"} />
          <InfoCard label="Requisite Level" value={c.levelRequirement ? `Level ${c.levelRequirement}+` : "Open (Lvl 1)"} />
          <InfoCard label="Status" value={c.status} isHighlight={c.status === "PUBLISHED"} />
        </div>

        {c.shortDescription && (
          <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
            {c.shortDescription}
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <ListBlock title="Skills Covered" items={c.skillsCovered} />
          <ListBlock title="Learning Outcomes" items={c.learningOutcomes} />
        </div>
      </div>

      {/* Tasks & Milestones */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-[#1755A7]" />
              Submission Tasks & Proctoring Modules ({c.tasks.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tasks that students must submit evidence for to earn points
            </p>
          </div>

          <button
            onClick={() => setAddingTask((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            {addingTask ? "Cancel" : <><Plus className="h-3.5 w-3.5" /> <span>Add Task</span></>}
          </button>
        </div>

        {addingTask && (
          <div className="mt-4">
            <TaskForm courseId={id} onDone={refresh} onCancel={() => setAddingTask(false)} />
          </div>
        )}

        <div className="mt-4 space-y-2.5">
          {c.tasks.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              No custom tasks configured — completion is verified via external certificate proof submission.
            </p>
          ) : (
            c.tasks.map((t) =>
              editingTaskId === t.taskId ? (
                <TaskForm key={t.taskId} courseId={id} task={t} onDone={refresh} onCancel={() => setEditingTaskId(null)} />
              ) : (
                <div
                  key={t.taskId}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#1755A7]/10 font-mono text-xs font-bold text-[#1755A7]">
                      {t.sequenceOrder}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{t.title}</span>
                        {t.isRequired && (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-800 border border-amber-200">
                            Required
                          </span>
                        )}
                        {t.type === "LIVE_PROCTORED" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[9px] font-bold uppercase text-purple-700 border border-purple-200">
                            <Lock className="h-2.5 w-2.5" /> Live Proctored
                          </span>
                        )}
                      </div>
                      {t.instructions && (
                        <p className="text-[11px] text-slate-500 mt-1 max-w-xl">{t.instructions}</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setEditingTaskId(t.taskId)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Edit Task
                  </button>
                </div>
              )
            )
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value, isHighlight }: { label: string; value: string; isHighlight?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`mt-1 text-xs font-bold ${isHighlight ? "text-emerald-700" : "text-slate-900"}`}>{value}</div>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</h4>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function TaskForm({
  courseId,
  task,
  onDone,
  onCancel,
}: {
  courseId: string;
  task?: { taskId: string; title: string; type: CourseTaskTypeValue; instructions: string | null; sequenceOrder: number; isRequired: boolean };
  onDone: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [type, setType] = useState<CourseTaskTypeValue>(task?.type ?? "STANDARD");
  const [instructions, setInstructions] = useState(task?.instructions ?? "");
  const [sequenceOrder, setSequenceOrder] = useState(task?.sequenceOrder ?? 1);
  const [isRequired, setIsRequired] = useState(task?.isRequired ?? true);

  const save = useMutation({
    mutationFn: () => {
      const input: UpsertCourseTaskInput = { title, type, instructions: instructions || undefined, sequenceOrder, isRequired };
      return task ? adminCoursesApi.updateTask(courseId, task.taskId, input) : adminCoursesApi.createTask(courseId, input);
    },
    onSuccess: onDone,
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col gap-3">
      {save.isError && <ErrorBanner error={save.error} />}
      
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input required placeholder="Task title (e.g. Model Checkpoint Upload)" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        <select value={type} onChange={(e) => setType(e.target.value as CourseTaskTypeValue)} className={inputClass}>
          {TASK_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === "LIVE_PROCTORED" ? "Live Proctored Task" : "Standard Submission"}
            </option>
          ))}
        </select>
      </div>

      <textarea rows={2} placeholder="Submission instructions for students..." value={instructions} onChange={(e) => setInstructions(e.target.value)} className={inputClass} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input type="number" min={1} placeholder="Order" value={sequenceOrder} onChange={(e) => setSequenceOrder(Number(e.target.value))} className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono" />
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
            <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} className="h-4 w-4 rounded text-[#1755A7]" />
            Required for course completion
          </label>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={save.isPending || !title.trim()}
            onClick={() => save.mutate()}
            className="rounded-xl bg-[#1755A7] px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#124282] transition-colors disabled:opacity-50"
          >
            {save.isPending ? "Saving…" : task ? "Save Task" : "Add Task"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
