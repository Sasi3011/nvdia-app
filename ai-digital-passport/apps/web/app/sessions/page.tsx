import { ProgramModulePage } from "../../components/modules/ProgramModulePage";

export default function SessionsPage() {
  return (
    <ProgramModulePage
      title="Sessions & Masterclasses"
      description="Tech Eve sessions, AI masterclasses, deep insight talks and future-ready knowledge programs."
      badge="AI Explorer"
      actions={[
        { label: "Submit attendance", href: "/claims/new?category=tech_eve_masterclass", primary: true },
        { label: "Scan QR", href: "/scan" },
      ]}
      steps={[
        { title: "Attend session", description: "Join Tech Eve, AI masterclass, orientation or expert talk.", points: "+10" },
        { title: "Verify presence", description: "Scan live QR when available or submit approved evidence." },
        { title: "Grow passport", description: "Approved attendance appears in points history and AI Passport activity." },
      ]}
      sections={[
        { title: "Program examples", items: ["Tech Eve at AI Centre", "AI Masterclass", "Top experts and deep insights", "Responsible AI orientation", "Future-ready knowledge sessions"] },
        { title: "Admin needs", items: ["Create event", "Create session", "Activate QR", "Track attendance", "Export participation", "Award points"] },
      ]}
    />
  );
}
