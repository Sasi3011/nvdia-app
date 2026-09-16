import { ProgramModulePage } from "../../components/modules/ProgramModulePage";

export default function ResearchPage() {
  return (
    <ProgramModulePage
      title="AI Research Fellowship"
      description="Research proposals, GPU-intensive experiments, papers, patents, publications and knowledge sharing."
      badge="AI Researcher"
      actions={[
        { label: "Submit paper/patent", href: "/claims/new?category=research_patent", primary: true },
        { label: "Request GPU support", href: "/gpu" },
      ]}
      steps={[
        { title: "Submit proposal", description: "Define domain, objective, dataset, experiment plan and expected research output." },
        { title: "Run experiments", description: "Use mentor guidance and GPU credits to collect results." },
        { title: "Publish output", description: "Submit paper, patent, dataset, model or presentation evidence.", points: "+300 to +500" },
      ]}
      sections={[
        { title: "Research review fields", items: ["Research area", "Problem statement", "Mentor", "GPU need", "Experiment notes", "Paper draft", "Publication/patent link"] },
        { title: "Mentor responsibilities", items: ["Review proposal", "Guide experiment design", "Validate results", "Approve GPU request", "Support paper/patent submission"] },
      ]}
    />
  );
}
