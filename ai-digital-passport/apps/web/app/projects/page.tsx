"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StudentShell } from "../../components/shell/StudentShell";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { PageHeader } from "../../components/ui/PageHeader";
import { Spinner } from "../../components/ui/Spinner";
import { projectRecordsApi } from "../../lib/api";

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const projects = useQuery({ queryKey: ["project-records"], queryFn: projectRecordsApi.list });
  const [title, setTitle] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [projectType, setProjectType] = useState("AI Project");
  const create = useMutation({
    mutationFn: () => projectRecordsApi.create({ title, problemStatement, projectType }),
    onSuccess: () => {
      setTitle("");
      setProblemStatement("");
      queryClient.invalidateQueries({ queryKey: ["project-records"] });
    },
  });

  return (
    <StudentShell>
      <div className="flex flex-col gap-6">
        <PageHeader title="AI Projects" description="Create real projects, track milestones, and submit evidence for faculty review." />

        <Card>
          <h2 className="text-h2 text-ink">Create project</h2>
          <form
            className="mt-3 grid grid-cols-1 gap-3 tablet:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
          >
            {create.isError ? <ErrorBanner error={create.error} /> : null}
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project title" className="rounded-card border border-border px-3 py-2 text-body" />
            <select value={projectType} onChange={(e) => setProjectType(e.target.value)} className="rounded-card border border-border px-3 py-2 text-body">
              {["AI Project", "Research Project", "Industry Project", "Hackathon Project", "Startup Prototype"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <textarea required rows={3} value={problemStatement} onChange={(e) => setProblemStatement(e.target.value)} placeholder="Problem statement" className="rounded-card border border-border px-3 py-2 text-body tablet:col-span-2" />
            <Button type="submit" variant="primary" disabled={create.isPending} className="justify-self-start">
              {create.isPending ? "Creating..." : "Create project"}
            </Button>
          </form>
        </Card>

        {projects.isLoading ? (
          <Spinner />
        ) : projects.isError ? (
          <ErrorBanner error={projects.error} />
        ) : !projects.data || projects.data.length === 0 ? (
          <p className="text-body text-text-muted">No projects yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
            {projects.data.map((project) => (
              <ProjectCard key={project.project_id} project={project} />
            ))}
          </div>
        )}
      </div>
    </StudentShell>
  );
}

function ProjectCard({ project }: { project: Awaited<ReturnType<typeof projectRecordsApi.list>>[number] }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const addMilestone = useMutation({
    mutationFn: () => projectRecordsApi.createMilestone(project.project_id, { title, description }),
    onSuccess: () => {
      setTitle("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["project-records"] });
    },
  });

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-h2 text-ink">{project.title}</h2>
          <p className="text-caption text-text-muted">{project.project_type} · {project.status}</p>
        </div>
        <span className="rounded-full bg-surface-muted px-3 py-1 text-caption text-text-muted">{project.milestones.length} milestones</span>
      </div>
      <p className="mt-3 text-body text-text-muted">{project.problem_statement}</p>
      <div className="mt-4 space-y-2">
        {project.milestones.map((milestone) => (
          <div key={milestone.milestone_id} className="rounded-card bg-surface-muted p-3">
            <div className="text-body text-ink">{milestone.title}</div>
            <div className="text-caption text-text-muted">{milestone.status}{milestone.feedback ? ` · ${milestone.feedback}` : ""}</div>
          </div>
        ))}
      </div>
      <form
        className="mt-4 flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          addMilestone.mutate();
        }}
      >
        {addMilestone.isError ? <ErrorBanner error={addMilestone.error} /> : null}
        <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Milestone title" className="rounded-card border border-border px-3 py-2 text-body" />
        <input required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Milestone description" className="rounded-card border border-border px-3 py-2 text-body" />
        <Button type="submit" variant="secondary" disabled={addMilestone.isPending}>
          Add milestone
        </Button>
      </form>
    </Card>
  );
}
