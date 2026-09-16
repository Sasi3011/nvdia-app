"use client";

import { ConsoleShell } from "../console/ConsoleShell";
import { ConsolePageHeader } from "../console/ConsolePageHeader";
import { Button } from "../ui/Button";
import { Target, ListTodo, Activity, CheckCircle2 } from "lucide-react";

export function AdminProgramPage({
  title,
  description,
  primaryAction,
  metrics,
  sections,
}: {
  title: string;
  description: string;
  primaryAction: string;
  metrics: { label: string; value: string }[];
  sections: { title: string; items: string[] }[];
}) {
  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader
        title={title}
        description={description}
        actions={<Button variant="primary">{primaryAction}</Button>}
      />

      <div className="mb-8 grid grid-cols-1 gap-4 tablet:grid-cols-3">
        {metrics.map((metric, i) => (
          <div key={metric.label} className="flex flex-col rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-[#1A56DB]/10 text-[#1A56DB]">
              {i === 0 ? <Target className="h-5 w-5" /> : i === 1 ? <Activity className="h-5 w-5" /> : <ListTodo className="h-5 w-5" />}
            </div>
            <div className="text-[13px] font-bold uppercase tracking-wider text-text-muted">{metric.label}</div>
            <div className="mt-1 text-[24px] font-bold text-ink">{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 desktop:grid-cols-2">
        {sections.map((section) => (
          <div key={section.title} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-[18px] font-bold text-ink border-b border-border pb-3">{section.title}</h2>
            <ul className="flex flex-col gap-3">
              {section.items.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1A56DB]" />
                  <span className="text-[14px] font-medium text-text-muted">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </ConsoleShell>
  );
}
