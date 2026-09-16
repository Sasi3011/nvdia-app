"use client";

import { Suspense, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { ConsoleShell } from "../../../../components/console/ConsoleShell";
import { ConsoleCard } from "../../../../components/console/ConsoleCard";
import { ConsolePageHeader } from "../../../../components/console/ConsolePageHeader";
import { Button } from "../../../../components/ui/Button";
import { ErrorBanner } from "../../../../components/ui/ErrorBanner";
import { Spinner } from "../../../../components/ui/Spinner";
import { CourseForm } from "../../../../components/admin/CourseForm";
import { adminCoursesApi, type CourseTaskTypeValue, type UpsertCourseTaskInput } from "../../../../lib/api";

const inputClass = "rounded-card border border-border bg-surface px-3 py-2 text-body text-ink placeholder:text-text-muted";
const TASK_TYPES: CourseTaskTypeValue[] = ["STANDARD", "LIVE_PROCTORED"];

export default function AdminCourseDetailPage() {
  return (
    <ConsoleShell role="ADMIN">
      <Suspense>
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
  if (course.isLoading) return <Spinner label="Loading course…" />;
  if (course.isError) return <ErrorBanner error={course.error} />;
  if (!course.data) return null;

  const c = course.data;

  return (
    <div className="flex flex-col gap-6">
      <ConsolePageHeader
        title={c.title}
        description={`${c.provider} · ${c.category} · ${c.difficulty} · ${c.pointsValue} pts · status: ${c.status}`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditingCourse((v) => !v)}>
              {editingCourse ? "Close editor" : "Edit"}
            </Button>
            {c.status !== "PUBLISHED" ? (
              <Button variant="primary" disabled={publish.isPending} onClick={() => publish.mutate()}>
                Publish
              </Button>
            ) : (
              <Button variant="destructive" disabled={archive.isPending} onClick={() => archive.mutate()}>
                Archive
              </Button>
            )}
          </div>
        }
      />

      {editingCourse ? <CourseForm course={{ ...c, courseId: c.courseId }} onDone={refresh} onCancel={() => setEditingCourse(false)} /> : null}

      <ConsoleCard>
        <h2 className="text-h2 text-ink">Catalog setup</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 tablet:grid-cols-4">
          <Info label="Track" value={c.category} />
          <Info label="Difficulty" value={c.difficulty} />
          <Info label="Duration" value={`${c.durationHours}h${c.durationWeeks ? ` / ${c.durationWeeks} weeks` : ""}`} />
          <Info label="Mode" value={c.deliveryMode} />
          <Info label="Enrollment" value={c.enrollmentType} />
          <Info label="Certificate" value={c.certificateAvailable ? "Available" : "No certificate"} />
          <Info label="Required level" value={c.levelRequirement ? `Level ${c.levelRequirement}` : "Open to all"} />
          <Info label="Featured" value={c.isFeatured ? "Yes" : "No"} />
        </div>
        {c.shortDescription ? <p className="mt-4 text-body text-text-muted">{c.shortDescription}</p> : null}
        <ListBlock title="Skills" items={c.skillsCovered} />
        <ListBlock title="Outcomes" items={c.learningOutcomes} />
      </ConsoleCard>

      <ConsoleCard>
        <div className="flex items-center justify-between">
          <h2 className="text-h2 text-ink">Tasks</h2>
          <Button variant="secondary" onClick={() => setAddingTask((v) => !v)}>
            {addingTask ? "Cancel" : "Add task"}
          </Button>
        </div>

        {addingTask ? <TaskForm courseId={id} onDone={refresh} onCancel={() => setAddingTask(false)} /> : null}

        <div className="mt-4 flex flex-col gap-2">
          {c.tasks.length === 0 ? (
            <p className="text-body text-text-muted">No tasks — the course is just the external link + proof submission.</p>
          ) : (
            c.tasks.map((t) =>
              editingTaskId === t.taskId ? (
                <TaskForm key={t.taskId} courseId={id} task={t} onDone={refresh} onCancel={() => setEditingTaskId(null)} />
              ) : (
                <button
                  key={t.taskId}
                  onClick={() => setEditingTaskId(t.taskId)}
                  className="flex items-center justify-between rounded-card border border-navy-700 px-4 py-3 text-left hover:bg-surface-muted"
                >
                  <div>
                    <div className="text-body text-ink">
                      {t.sequenceOrder}. {t.title} {t.isRequired ? <span className="text-caption text-text-muted">(required)</span> : null}
                    </div>
                    {t.instructions ? <p className="text-caption text-text-muted">{t.instructions}</p> : null}
                  </div>
                  <span className={"font-mono text-caption " + (t.type === "LIVE_PROCTORED" ? "text-pending" : "text-text-muted")}>{t.type}</span>
                </button>
              ),
            )
          )}
        </div>
      </ConsoleCard>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-navy-700 p-3">
      <div className="text-caption text-text-muted">{label}</div>
      <div className="mt-1 text-body text-ink">{value}</div>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4">
      <h3 className="text-caption text-text-muted">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full bg-surface-muted px-3 py-1 text-caption text-text-muted">
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
    <div className="mt-3 flex flex-col gap-3 rounded-card border border-navy-700 p-4">
      {save.isError ? <ErrorBanner error={save.error} /> : null}
      <input required placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
      <textarea rows={2} placeholder="Instructions (optional)" value={instructions} onChange={(e) => setInstructions(e.target.value)} className={inputClass} />
      <div className="grid grid-cols-1 gap-3 tablet:grid-cols-3">
        <select value={type} onChange={(e) => setType(e.target.value as CourseTaskTypeValue)} className={inputClass}>
          {TASK_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input type="number" min={0} placeholder="Order" value={sequenceOrder} onChange={(e) => setSequenceOrder(Number(e.target.value))} className={inputClass} />
        <label className="flex items-center gap-2 text-body text-ink">
          <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} />
          Required for approval
        </label>
      </div>
      {type === "LIVE_PROCTORED" ? (
        <p className="text-caption text-pending">
          Live Proctored: the student must enter fullscreen and stay on-tab; violations lock the task after 4 strikes (see the mentor
          Proctoring Locks page).
        </p>
      ) : null}
      <div className="flex gap-3">
        <Button type="button" variant="primary" disabled={save.isPending || !title.trim()} onClick={() => save.mutate()}>
          {save.isPending ? "Saving…" : task ? "Save task" : "Add task"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
