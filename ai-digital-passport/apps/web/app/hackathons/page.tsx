import { ProgramModulePage } from "../../components/modules/ProgramModulePage";

export default function HackathonsPage() {
  return (
    <ProgramModulePage
      title="Hackathons & Challenges"
      description="Monthly mini challenges, semester AI buildathons, annual flagship hackathons and NVIDIA AI grand challenge workflows."
      badge="AI Innovator"
      actions={[
        { label: "Submit participation", href: "/claims/new?category=certification_project_hackathon", primary: true },
        { label: "Submit win/project", href: "/claims/new?category=industry_hackathon_win" },
      ]}
      steps={[
        { title: "Register team", description: "Create or join a team and select a problem statement." },
        { title: "Submit solution", description: "Upload PPT/PDF, GitHub link, demo video and final explanation." },
        { title: "Evaluation", description: "Evaluator scores innovation, depth, impact, presentation and completeness.", points: "+100 to +250" },
      ]}
      sections={[
        { title: "Hackathon calendar", items: ["Quarterly AI mini challenge", "Semester AI buildathon", "Annual flagship Sri Eshwar NVIDIA AI grand challenge"] },
        { title: "Evaluator UI needs", items: ["Assigned submissions", "Rubric scoring", "Comments", "Leaderboard", "Winner declaration", "Certificate issue"] },
      ]}
    />
  );
}
