import { ProgramModulePage } from "../../components/modules/ProgramModulePage";

export default function LabsPage() {
  return (
    <ProgramModulePage
      title="GPU Labs"
      description="Weekly GPU Friday and hands-on lab work for AI computing, CUDA, training, optimization and inference."
      badge="AI Computing"
      actions={[
        { label: "Submit lab evidence", href: "/claims/new?category=gpu_friday_lab", primary: true },
        { label: "Browse courses", href: "/courses" },
      ]}
      steps={[
        { title: "Attend lab", description: "Join a scheduled GPU Friday or assigned hands-on lab session.", pointsCategory: "gpu_friday_lab" },
        { title: "Complete exercise", description: "Run the notebook/code, capture output, and prepare a PDF or repo link." },
        { title: "Submit proof", description: "Upload the lab proof so faculty can verify and approve your points." },
      ]}
      sections={[
        { title: "Expected lab types", items: ["GPU computing basics", "CUDA fundamentals", "Parallel computing", "Model training on GPU", "Model optimization", "AI inference"] },
        { title: "Student UI needs", items: ["Lab instructions", "Starter files/dataset link", "GPU requirement", "Submission status", "Faculty score and feedback", "Resubmission option"] },
      ]}
    />
  );
}
