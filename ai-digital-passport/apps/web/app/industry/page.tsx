import { ProgramModulePage } from "../../components/modules/ProgramModulePage";

export default function IndustryPage() {
  return (
    <ProgramModulePage
      title="Industry Connect"
      description="Real industry problems, internships, consultancy, research collaboration and placement pathways."
      badge="Possibilities"
      actions={[
        { label: "Open problem bank", href: "/problems", primary: true },
        { label: "Submit industry project", href: "/claims/new?category=industry_hackathon_win" },
      ]}
      steps={[
        { title: "Partner posts problem", description: "Industry partner shares problem statement, eligibility, timeline and expected deliverables." },
        { title: "Students build solution", description: "Teams submit proposal, repo, demo and final report with mentor guidance." },
        { title: "Partner evaluates", description: "Partner/evaluator scores the work and can shortlist for internship, project or placement." },
      ]}
      sections={[
        { title: "Industry partner features", items: ["Company profile", "Problem statements", "Assigned teams", "Feedback", "Evaluation", "Shortlist students", "Internship/opportunity listing"] },
        { title: "Student outcomes", items: ["Projects", "Internships", "Consultancy", "Research", "Placement", "Startup pilot"] },
      ]}
    />
  );
}
