"use client";

import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { CoursesManager } from "../../../components/admin/CoursesManager";

// Same course management as the admin Courses & Curricula page — faculty
// have the same create/edit/publish/archive/delete access.
export default function MentorCourseCatalogPage() {
  return (
    <ConsoleShell role="MENTOR">
      <CoursesManager />
    </ConsoleShell>
  );
}
