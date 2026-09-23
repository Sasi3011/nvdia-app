import { ProgramModulePage } from "../../components/modules/ProgramModulePage";

export default function CertificationsPage() {
  return (
    <ProgramModulePage
      title="Certifications"
      description="Submit verified certificates from Coursera, Udemy, NVIDIA, NPTEL, AWS, Microsoft, Google Cloud, Cisco, Kaggle, GitHub, Hugging Face and more."
      badge="AI Practitioner"
      actions={[
        { label: "Submit certificate", href: "/claims/new?category=course_completion", primary: true },
        { label: "Course catalog", href: "/courses" },
      ]}
      steps={[
        { title: "Complete course", description: "Finish approved internal or external learning path.", pointsCategory: "course_completion" },
        { title: "Upload certificate", description: "Upload PDF proof into PostgreSQL-backed storage for mentor review." },
        { title: "Receive approval", description: "Mentor verifies and points are awarded to your AI Passport." },
      ]}
      sections={[
        { title: "Accepted platforms", items: ["NVIDIA", "NPTEL", "Coursera", "Udemy", "AWS", "Microsoft Learn", "Google Cloud", "Cisco", "Kaggle", "GitHub", "Hugging Face", "LeetCode"] },
        { title: "Verification data", items: ["Certificate PDF", "Issuer/platform", "Course title", "Completion date", "Credential URL", "Mentor/admin feedback"] },
      ]}
    />
  );
}
