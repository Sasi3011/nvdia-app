import { AdminProgramPage } from "../../../components/admin/AdminProgramPage";

export default function AdminResearchPage() {
  return (
    <AdminProgramPage
      title="Research Fellowship"
      description="Manage AI student/research fellowship applications, mentors, GPU allocation, outputs, papers and patents."
      primaryAction="Open fellowship cycle"
      metrics={[
        { label: "Programs", value: "Student + Research" },
        { label: "Outputs", value: "Paper / Patent" },
        { label: "GPU", value: "Research cluster" },
      ]}
      sections={[
        { title: "Admin features", items: ["Create fellowship cycle", "Review applications", "Assign research mentors", "Allocate GPU credits", "Track papers/patents", "Export research output"] },
        { title: "Application fields", items: ["Research area", "Proposal PDF", "Dataset", "Experiment plan", "Expected output", "GPU requirement", "Mentor recommendation"] },
      ]}
    />
  );
}
