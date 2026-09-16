import { AdminProgramPage } from "../../../components/admin/AdminProgramPage";

export default function AdminIndustryPage() {
  return (
    <AdminProgramPage
      title="Industry Connect"
      description="Manage companies, problem statements, student teams, partner feedback, internships and placement outcomes."
      primaryAction="Add partner"
      metrics={[
        { label: "Problem source", value: "Industry" },
        { label: "Eligible level", value: "AI Builder+" },
        { label: "Outcomes", value: "Internship / Placement" },
      ]}
      sections={[
        { title: "Admin features", items: ["Approve partners", "Publish problem statements", "Assign teams", "Track submissions", "Collect partner evaluations", "Record opportunities"] },
        { title: "Partner fields", items: ["Company profile", "Contact person", "Problem statement", "Eligibility", "Expected deliverables", "Timeline", "Shortlisted students"] },
      ]}
    />
  );
}
