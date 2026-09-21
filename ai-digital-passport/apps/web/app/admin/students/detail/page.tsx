"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ConsoleShell } from "../../../../components/console/ConsoleShell";
import { Spinner } from "../../../../components/ui/Spinner";
import { StudentProgressView } from "../../../../components/staff/StudentProgressView";

export default function AdminStudentDetailPage() {
  return (
    <ConsoleShell role="ADMIN">
      <Suspense fallback={<div className="flex h-64 items-center justify-center"><Spinner label="Loading student..." /></div>}>
        <Content />
      </Suspense>
    </ConsoleShell>
  );
}

function Content() {
  const id = useSearchParams().get("id");
  return <StudentProgressView userId={id} backHref="/admin/students" />;
}
