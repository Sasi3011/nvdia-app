"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { StudentShell } from "../../components/shell/StudentShell";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { PageHeader } from "../../components/ui/PageHeader";
import { Spinner } from "../../components/ui/Spinner";
import { notificationsApi } from "../../lib/api";

// Page 19 — Notifications (spec 02 Section 6.2). Rejected claims notify
// with mentor feedback (FR-VERIF-03); approved claims and level-ups also
// land here (apps/api's PointsService/MentorService).
export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const notifications = useQuery({ queryKey: ["notifications"], queryFn: () => notificationsApi.list({ page: 1, pageSize: 50 }) });

  return (
    <StudentShell>
      <PageHeader title="Notifications" />

      {notifications.isLoading ? (
        <Spinner />
      ) : notifications.isError ? (
        <ErrorBanner error={notifications.error} />
      ) : !notifications.data || notifications.data.items.length === 0 ? (
        <EmptyState message="No notifications yet." />
      ) : (
        <Card className="divide-y divide-border p-0">
          {notifications.data.items.map((n) => (
            <button
              key={n.notificationId}
              onClick={async () => {
                if (!n.readAt) {
                  await notificationsApi.markRead(n.notificationId);
                  queryClient.invalidateQueries({ queryKey: ["notifications"] });
                }
              }}
              className={"flex w-full items-start justify-between gap-4 px-6 py-4 text-left hover:bg-surface-muted" + (n.readAt ? "" : " bg-accent/5")}
            >
              <div>
                <div className="text-body text-ink">{n.title}</div>
                <div className="mt-1 text-body text-text-muted">{n.message}</div>
              </div>
              <span className="whitespace-nowrap font-mono text-caption text-text-muted">
                {new Date(n.createdAt).toLocaleDateString()}
              </span>
            </button>
          ))}
        </Card>
      )}
    </StudentShell>
  );
}
