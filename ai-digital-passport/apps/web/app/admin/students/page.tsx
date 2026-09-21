"use client";

import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { StudentList } from "../../../components/staff/StudentList";

export default function AdminStudentsPage() {
  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader title="Student Progress" description="Browse every student and open their full progress record." />
      <StudentList basePath="/admin/students" />
    </ConsoleShell>
  );
}
