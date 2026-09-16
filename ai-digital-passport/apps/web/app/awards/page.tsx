import { ProgramModulePage } from "../../components/modules/ProgramModulePage";

export default function AwardsPage() {
  return (
    <ProgramModulePage
      title="AI Excellence Awards"
      description="Annual celebration for learners, builders, researchers, mentors, industry projects and GPU computing impact."
      badge="AI Champion"
      actions={[
        { label: "View leaderboard", href: "/leaderboard", primary: true },
        { label: "Submit evidence", href: "/claims/new" },
      ]}
      steps={[
        { title: "Build profile", description: "Complete courses, labs, projects, hackathons, research and startup milestones." },
        { title: "Audit shortlist", description: "Admin runs the annual audit using points, level, impact and nominations." },
        { title: "Award result", description: "Winners receive recognition and certificates during the celebration night." },
      ]}
      sections={[
        { title: "Award categories", items: ["AI Student of the Year", "AI Researcher of the Year", "Best AI Project", "Best AI Startup", "Best AI Faculty Mentor", "Best Industry Project", "Most Active AI Learner", "Best GPU Computing Project"] },
        { title: "Selection signals", items: ["Total points", "Current AI level", "Research/patent output", "Industry impact", "Mentor feedback", "GPU project quality", "Leadership and community contribution"] },
      ]}
    />
  );
}
