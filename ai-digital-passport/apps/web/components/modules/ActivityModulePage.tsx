"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { StudentShell } from "../shell/StudentShell";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { ErrorBanner } from "../ui/ErrorBanner";
import { PageHeader } from "../ui/PageHeader";
import { Spinner } from "../ui/Spinner";
import { activitiesApi } from "../../lib/api";

/**
 * Pages 5-10 (Sessions, Certifications, Labs, Projects, Hackathons,
 * Research) share one template: each is a lens over the scoring matrix
 * (spec 04 Section 11.1), showing the category/categories relevant to
 * that module with their fixed point value, and routing "Submit evidence"
 * to /claims/new pre-filled with that category.
 *
 * ASSUMPTION: the source spec does not define which of the 6 scoring
 * categories maps to which of these 6 module pages (the "Certification /
 * Mini Project / Hackathon" category, for instance, spans three page
 * names). The mapping used here (passed in as `categories` by each page)
 * is a reasonable reading, not a spec-given rule — flagged for
 * product-owner confirmation like the other open decisions.
 */
export function ActivityModulePage({
  title,
  description,
  categories,
}: {
  title: string;
  description: string;
  categories: string[];
}) {
  return (
    <StudentShell>
      <PageHeader title={title} description={description} />
      <ActivityList categories={categories} />
    </StudentShell>
  );
}

function ActivityList({ categories }: { categories: string[] }) {
  const activities = useQuery({ queryKey: ["activities"], queryFn: () => activitiesApi.discover() });

  if (activities.isLoading) return <Spinner />;
  if (activities.isError) return <ErrorBanner error={activities.error} />;

  const items = (activities.data ?? []).filter((a) => categories.includes(a.category));

  if (items.length === 0) {
    return <EmptyState message="No activities currently open in this category — check back soon." />;
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((activity) => (
        <Card key={activity.category} className="flex items-center justify-between">
          <div>
            <div className="text-body text-ink">{activity.label}</div>
            <div className="font-mono text-caption text-text-muted">+{activity.points} points on approval</div>
          </div>
          <Link href={`/claims/new?category=${activity.category}`}>
            <Button variant="primary">Submit evidence</Button>
          </Link>
        </Card>
      ))}
    </div>
  );
}
