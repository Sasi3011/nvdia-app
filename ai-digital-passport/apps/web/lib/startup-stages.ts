export interface StageField {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "textarea" | "url" | "select";
  options?: string[];
  required?: boolean;
}

export interface StageForm {
  stage: number;
  intro: string;
  fields: StageField[];
}

export const STARTUP_STAGE_FORMS: StageForm[] = [
  {
    stage: 1,
    intro: "Pitch your idea. Your mentor verifies it before you can move to the prototype stage.",
    fields: [
      { key: "problem", label: "Problem Statement", type: "textarea", placeholder: "What problem are you solving and for whom?", required: true },
      { key: "solution", label: "Proposed AI Solution", type: "textarea", placeholder: "How does your AI approach solve it?", required: true },
      { key: "domain", label: "AI Domain", type: "select", options: ["Computer Vision", "NLP / LLMs", "Robotics", "Healthcare AI", "AgriTech AI", "EdTech AI", "FinTech AI", "Other"], required: true },
      { key: "targetCustomer", label: "Target Customers / Market", type: "text", placeholder: "e.g. Small farmers in Tamil Nadu", required: true },
      { key: "teamMembers", label: "Team Members", type: "text", placeholder: "Names and roles, comma separated", required: true },
      { key: "uniqueValue", label: "Uniqueness / Competitors", type: "textarea", placeholder: "What makes this different from existing solutions?" },
      { key: "documentLink", label: "Idea Pitch Deck Link (PPT / Drive)", type: "url", placeholder: "https://drive.google.com/...", required: true },
    ],
  },
  {
    stage: 2,
    intro: "Show a working prototype with supporting documents.",
    fields: [
      { key: "prototypeSummary", label: "Prototype Summary", type: "textarea", placeholder: "What have you built and what does it demonstrate?", required: true },
      { key: "techStack", label: "Tech Stack / Models Used", type: "text", placeholder: "e.g. PyTorch, YOLOv8, FastAPI", required: true },
      { key: "repoUrl", label: "GitHub Repository", type: "url", placeholder: "https://github.com/..." },
      { key: "demoUrl", label: "Demo Video / Live Link", type: "url", placeholder: "https://..." },
      { key: "documentLink", label: "Prototype Documents Link (design doc, report, screenshots)", type: "url", placeholder: "https://drive.google.com/...", required: true },
    ],
  },
  {
    stage: 3,
    intro: "Prove your model benefits from GPU compute with benchmark evidence.",
    fields: [
      { key: "gpuUsed", label: "GPU / Compute Used", type: "text", placeholder: "e.g. NVIDIA A100 on DGX node", required: true },
      { key: "trainingDetails", label: "Model Training / Inference Details", type: "textarea", placeholder: "Dataset size, epochs, training time, batch size…", required: true },
      { key: "benchmark", label: "Benchmark Results", type: "textarea", placeholder: "Accuracy, latency, speedup vs CPU…", required: true },
      { key: "logsUrl", label: "Training Logs / W&B Link", type: "url", placeholder: "https://..." },
      { key: "documentLink", label: "GPU Validation Report Link", type: "url", placeholder: "https://drive.google.com/...", required: true },
    ],
  },
  {
    stage: 4,
    intro: "Submit your Minimum Viable Product with early traction.",
    fields: [
      { key: "mvpFeatures", label: "MVP Features Delivered", type: "textarea", required: true },
      { key: "mvpUrl", label: "MVP Live Link / App Link", type: "url", placeholder: "https://...", required: true },
      { key: "usersCount", label: "Number of Test Users", type: "text", placeholder: "e.g. 50" },
      { key: "feedbackSummary", label: "User Feedback Summary", type: "textarea" },
      { key: "documentLink", label: "MVP Documentation / User Feedback Report Link", type: "url", placeholder: "https://drive.google.com/...", required: true },
    ],
  },
  {
    stage: 5,
    intro: "Run a pilot with an industry partner and submit the outcome.",
    fields: [
      { key: "partnerName", label: "Industry Partner / Company", type: "text", required: true },
      { key: "pilotScope", label: "Pilot Scope & Duration", type: "textarea", required: true },
      { key: "pilotOutcome", label: "Pilot Outcome / Results", type: "textarea", required: true },
      { key: "contactPerson", label: "Partner Contact Person", type: "text" },
      { key: "documentLink", label: "Pilot Proof Link (LoI / MoU / Completion Letter)", type: "url", placeholder: "https://drive.google.com/...", required: true },
    ],
  },
  {
    stage: 6,
    intro: "Final mentor review confirming your venture is ready to be launched as a startup.",
    fields: [
      { key: "businessModel", label: "Business Model", type: "textarea", required: true },
      { key: "revenuePlan", label: "Revenue / Funding Plan", type: "textarea", required: true },
      { key: "proposedEntity", label: "Proposed Entity Type", type: "select", options: ["Private Limited Company", "LLP", "One Person Company (OPC)", "Partnership Firm", "Sole Proprietorship"], required: true },
      { key: "founders", label: "Founders & Shareholding", type: "text", required: true },
      { key: "documentLink", label: "Final Pitch Deck / Business Plan Link", type: "url", placeholder: "https://drive.google.com/...", required: true },
    ],
  },
];

export interface RegistrationStep {
  title: string;
  authority: string;
  summary: string;
  steps: string[];
  documents: string[];
  link: string;
  cost: string;
}

// Guidance only — fees and rules change, so verify on the official portals before filing.
export const STARTUP_REGISTRATION_GUIDE: RegistrationStep[] = [
  {
    title: "Incorporate the Company / LLP",
    authority: "Ministry of Corporate Affairs (MCA)",
    summary: "The legal entity is the base for every other registration. Private Limited is preferred by investors.",
    steps: [
      "Obtain Digital Signature Certificates (DSC) for all directors.",
      "Apply for Director Identification Numbers (DIN) through SPICe+.",
      "Reserve the company name in SPICe+ Part A.",
      "File SPICe+ Part B with MoA, AoA and registered office proof.",
      "Receive the Certificate of Incorporation with CIN, PAN and TAN.",
    ],
    documents: ["PAN & Aadhaar of directors", "Address proof of directors", "Registered office proof + NOC", "Recent utility bill"],
    link: "https://www.mca.gov.in",
    cost: "Approx. ₹7,000 – ₹15,000 incl. govt. fees",
  },
  {
    title: "MSME / Udyam Registration",
    authority: "Ministry of MSME",
    summary: "Free registration that unlocks subsidies, collateral-free loans and priority in government tenders.",
    steps: [
      "Open the Udyam Registration portal and choose 'For New Entrepreneurs'.",
      "Enter the Aadhaar of the proprietor / authorised signatory and verify with OTP.",
      "Enter PAN and GSTIN details (auto-validated).",
      "Fill business details: activity, NIC code, investment and turnover.",
      "Submit and download the Udyam Registration Certificate.",
    ],
    documents: ["Aadhaar of authorised person", "PAN of the entity", "Bank account details", "GSTIN (if applicable)"],
    link: "https://udyamregistration.gov.in",
    cost: "Free",
  },
  {
    title: "DPIIT Startup India Recognition",
    authority: "Dept. for Promotion of Industry and Internal Trade",
    summary: "Recognition enables tax benefits (80-IAC), angel-tax relief, self-certification under labour laws and fast-track patents.",
    steps: [
      "Register on the Startup India portal with your company details.",
      "Fill the recognition form: nature of business, innovation and scalability.",
      "Upload the incorporation certificate and a pitch deck / website link.",
      "Confirm the entity is under 10 years old with turnover below ₹100 crore.",
      "Receive the DPIIT Recognition Certificate with a unique number.",
    ],
    documents: ["Certificate of Incorporation", "Brief write-up on innovation", "Website / pitch deck link", "Director details"],
    link: "https://www.startupindia.gov.in",
    cost: "Free",
  },
  {
    title: "GST Registration",
    authority: "GST Council / CBIC",
    summary: "Mandatory above turnover thresholds or for inter-state supply; most B2B clients will ask for it.",
    steps: [
      "Apply on the GST portal with PAN, mobile and email.",
      "Fill Part B with business details, place of business and bank account.",
      "Upload documents and complete Aadhaar authentication.",
      "Receive the ARN, then the GSTIN after officer verification (about 3–7 days).",
    ],
    documents: ["PAN", "Incorporation certificate", "Business address proof", "Cancelled cheque / bank statement", "Director photo"],
    link: "https://www.gst.gov.in",
    cost: "Free",
  },
  {
    title: "Current Bank Account",
    authority: "Any scheduled bank",
    summary: "A business current account in the company name is needed to receive grants and payments.",
    steps: ["Choose a startup-friendly bank.", "Submit incorporation documents and a board resolution.", "Complete KYC of all directors."],
    documents: ["Certificate of Incorporation", "MoA & AoA", "Company PAN", "KYC of directors"],
    link: "",
    cost: "Varies by bank",
  },
  {
    title: "Other Compliances & Funding",
    authority: "Various",
    summary: "Stay compliant and protect your IP while tapping startup schemes.",
    steps: [
      "Trademark your brand and logo (IP India).",
      "Shops & Establishment / Professional Tax registration as per your state.",
      "PF / ESI registration once you cross the employee threshold.",
      "Register on GeM if you plan to sell to government.",
      "Apply for the Startup India Seed Fund Scheme and state schemes (e.g. TANSIM in Tamil Nadu).",
      "Maintain ROC annual filings, statutory audit and income-tax returns.",
    ],
    documents: ["Logo / brand name", "Incorporation documents", "Founders' ID proofs"],
    link: "https://ipindiaservices.gov.in",
    cost: "Varies",
  },
];
