"use client";

import { ConsoleShell } from "../console/ConsoleShell";
import { ConsoleCard } from "../console/ConsoleCard";
import { ConsolePageHeader } from "../console/ConsolePageHeader";
import { Button } from "../ui/Button";

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

      <div className="mb-6 grid grid-cols-1 gap-4 tablet:grid-cols-3">
        {metrics.map((metric) => (
          <ConsoleCard key={metric.label}>
            <div className="text-caption text-text-muted">{metric.label}</div>
            <div className="mt-1 text-h1 text-ink">{metric.value}</div>
          </ConsoleCard>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 desktop:grid-cols-2">
        {sections.map((section) => (
          <ConsoleCard key={section.title}>
            <h2 className="text-h2 text-ink">{section.title}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-body text-text-muted">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </ConsoleCard>
        ))}
      </div>
    </ConsoleShell>
  );
}
