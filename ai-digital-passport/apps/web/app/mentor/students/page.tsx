"use client";

import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { ConsolePageHeader } from "../../../components/console/ConsolePageHeader";
import { StudentList } from "../../../components/staff/StudentList";

export default function MentorStudentsPage() {
  return (
    <ConsoleShell role="MENTOR">
      <ConsolePageHeader title="Student Progress" description="Browse every student and open their full progress record." />
      <StudentList basePath="/mentor/students" />
    </ConsoleShell>
  );
}
