import type { StageField, StageForm } from "./startup-stages";

// Industry Problem Bank — 6-stage solution flow, same staged/mentor-approved
// pattern as the Startup Launchpad (see lib/startup-stages.ts). Each stage's
// evidence is a link (Google Drive, GitHub, etc.) — no file uploads.
export const PROBLEM_STAGES = [
  { stage: 1, name: "Problem Analysis" },
  { stage: 2, name: "Technical Approach" },
  { stage: 3, name: "Prototype" },
  { stage: 4, name: "Testing" },
  { stage: 5, name: "Demo" },
  { stage: 6, name: "Final Delivery" },
];

export const PROBLEM_STAGE_FORMS: StageForm[] = [
  {
    stage: 1,
    intro: "Show you understand the problem before proposing a fix. Your mentor verifies it before you can move to the approach stage.",
    fields: [
      { key: "problemRestatement", label: "Problem Restatement (in your own words)", type: "textarea", placeholder: "What exactly is the problem, and who does it affect?", required: true },
      { key: "targetUsers", label: "Who Faces This Problem?", type: "text", placeholder: "e.g. Manufacturing QA inspectors", required: true },
      { key: "researchSummary", label: "Research / Prior Art Summary", type: "textarea", placeholder: "Existing solutions, their limitations, relevant papers…" },
      { key: "documentLink", label: "Research Notes Link", type: "url", placeholder: "https://drive.google.com/...", required: true },
    ],
  },
  {
    stage: 2,
    intro: "Propose your technical approach with a clear architecture.",
    fields: [
      { key: "proposedSolution", label: "Proposed AI Solution", type: "textarea", placeholder: "How will you solve it? What models/techniques?", required: true },
      { key: "techStack", label: "Tech Stack", type: "text", placeholder: "e.g. PyTorch, YOLOv8, FastAPI, TensorRT", required: true },
      { key: "architectureNotes", label: "Architecture Notes", type: "textarea", placeholder: "System design, data pipeline, deployment plan…" },
      { key: "documentLink", label: "Architecture / Design Doc Link", type: "url", placeholder: "https://drive.google.com/...", required: true },
    ],
  },
  {
    stage: 3,
    intro: "Show a working prototype.",
    fields: [
      { key: "prototypeSummary", label: "Prototype Summary", type: "textarea", placeholder: "What have you built and what does it demonstrate?", required: true },
      { key: "repoUrl", label: "GitHub Repository", type: "url", placeholder: "https://github.com/..." },
      { key: "demoUrl", label: "Demo Video / Live Link", type: "url", placeholder: "https://..." },
      { key: "documentLink", label: "Prototype Documentation Link", type: "url", placeholder: "https://drive.google.com/...", required: true },
    ],
  },
  {
    stage: 4,
    intro: "Prove the solution actually works with test evidence.",
    fields: [
      { key: "testingApproach", label: "Testing Approach", type: "textarea", placeholder: "Test dataset, methodology, evaluation metrics…", required: true },
      { key: "resultsSummary", label: "Results Summary", type: "textarea", placeholder: "Accuracy, latency, comparison to baseline…", required: true },
      { key: "benchmarkUrl", label: "Benchmark / Logs Link", type: "url", placeholder: "https://..." },
      { key: "documentLink", label: "Test Report Link", type: "url", placeholder: "https://drive.google.com/...", required: true },
    ],
  },
  {
    stage: 5,
    intro: "Present your solution live to your faculty mentor.",
    fields: [
      { key: "demoSummary", label: "Demo Summary", type: "textarea", placeholder: "What was shown, key highlights, mentor questions…", required: true },
      { key: "demoVideoUrl", label: "Demo Video Link", type: "url", placeholder: "https://...", required: true },
      { key: "feedbackNotes", label: "Feedback Received", type: "textarea", placeholder: "Notes from the mentor demo session" },
      { key: "documentLink", label: "Presentation Deck Link", type: "url", placeholder: "https://drive.google.com/...", required: true },
    ],
  },
  {
    stage: 6,
    intro: "Wrap up with your final, deployable solution.",
    fields: [
      { key: "finalSummary", label: "Final Solution Summary", type: "textarea", placeholder: "What was delivered, final architecture, how it's used…", required: true },
      { key: "deploymentUrl", label: "Deployment / Live Link", type: "url", placeholder: "https://..." },
      { key: "impactSummary", label: "Impact Summary", type: "textarea", placeholder: "Measured impact for the organization/problem owner", required: true },
      { key: "documentLink", label: "Final Report / Repository Link", type: "url", placeholder: "https://drive.google.com/...", required: true },
    ],
  },
];
