"use client";

import Link from "next/link";
import { StudentShell } from "../shell/StudentShell";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { PageHeader } from "../ui/PageHeader";

export interface ProgramAction {
  label: string;
  href: string;
  primary?: boolean;
}

export interface ProgramStep {
  title: string;
  description: string;
  points?: string;
}

export function ProgramModulePage({
  title,
  description,
  badge,
  actions,
  steps,
  sections,
}: {
  title: string;
  description: string;
  badge: string;
  actions: ProgramAction[];
  steps: ProgramStep[];
  sections: { title: string; items: string[] }[];
}) {
  return (
    <StudentShell>
      <div className="flex flex-col gap-6">
        <PageHeader title={title} description={description} />

        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="rounded-full bg-accent/10 px-3 py-1 text-caption font-medium text-accent-deep">{badge}</span>
              <h2 className="mt-4 text-h1 text-ink">What you need to do</h2>
              <p className="mt-2 max-w-2xl text-body text-text-muted">
                Follow the workflow, collect evidence, submit it for mentor/admin review, and let the approved points update your AI Passport.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => (
                <Link key={action.href + action.label} href={action.href}>
                  <Button variant={action.primary ? "primary" : "secondary"}>{action.label}</Button>
                </Link>
              ))}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
          {steps.map((step, index) => (
            <Card key={step.title} className="flex h-full flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-caption font-semibold text-white">
                  {index + 1}
                </span>
                {step.points ? <span className="font-mono text-caption text-navy-700">{step.points}</span> : null}
              </div>
              <h3 className="text-h2 text-ink">{step.title}</h3>
              <p className="text-body text-text-muted">{step.description}</p>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
          {sections.map((section) => (
            <Card key={section.title}>
              <h3 className="text-h2 text-ink">{section.title}</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-body text-text-muted">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </StudentShell>
  );
}
