"use client";

import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { CoursesManager } from "../../../components/admin/CoursesManager";

export default function AdminCoursesPage() {
  return (
    <ConsoleShell role="ADMIN">
      <CoursesManager />
    </ConsoleShell>
  );
}
