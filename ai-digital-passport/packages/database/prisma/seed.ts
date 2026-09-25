/**
 * Seeds configurable domain data (the six levels, scoring matrix, roles,
 * awards) plus a demo dataset: accounts, courses, CoE classes and teaching
 * logs, industry problems, GPU requests (student + industry), claims and a
 * points ledger that every student's total/level is derived from.
 *
 * The level/scoring values live in packages/shared-types (single source of
 * truth for both apps and this seed).
 *
 * Idempotent: baseline data and accounts are upserted; the demo dataset is
 * only inserted when the database has no courses yet. To start from a clean
 * slate run `pnpm db:reset` (empties every table, then runs this seed).
 *
 * Built-in sign-in accounts (password = DEV_LOGIN_PASSWORD):
 *   admin@sece.ac.in, mentor@sece.ac.in, student@sece.ac.in
 */
import { ClaimStatus, CourseStatus, CourseTaskType, EnrollmentStatus, NotificationType, Prisma, PrismaClient, ProblemStatus, ProctoringStatus, ProofType, RequestStatus, RoleName } from "@prisma/client";
import { LEVEL_DEFINITIONS, SCORING_MATRIX, UserRole, studentYearLabel } from "@ai-digital-passport/shared-types";

const prisma = new PrismaClient();

const NOW = Date.now();
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const daysAgo = (d: number, hour = 10) => {
  const t = new Date(NOW - d * DAY);
  t.setHours(hour, 0, 0, 0);
  return t;
};
const daysAhead = (d: number, hour = 10) => daysAgo(-d, hour);
const pointsFor = (category: string) => SCORING_MATRIX.find((r) => r.category === category)?.points ?? 0;

async function main() {
  await seedBaseline();
  const accounts = await seedAccounts();

  if ((await prisma.course.count()) > 0) {
    console.log("Demo data already present — skipping (run `pnpm db:reset` for a clean re-seed).");
    return;
  }
  await seedDemoData(accounts);
  await recomputeStudentTotals();
  console.log("Seed complete.");
}

// ---------------------------------------------------------------------------
// Baseline: roles, levels, scoring matrix, awards
// ---------------------------------------------------------------------------

async function seedBaseline() {
  for (const role of Object.values(UserRole)) {
    await prisma.role.upsert({ where: { name: role }, update: {}, create: { name: role } });
  }

  for (const level of LEVEL_DEFINITIONS) {
    const data = {
      level_name: level.levelName,
      min_points: level.minPoints,
      unlocked_privilege: level.unlockedPrivilege,
      requires_high_impact: level.requiresHighImpact,
    };
    await prisma.level.upsert({ where: { level_id: level.levelId }, update: data, create: { level_id: level.levelId, ...data } });
  }

  for (const rule of SCORING_MATRIX) {
    await prisma.scoringRule.upsert({
      where: { category: rule.category },
      update: { label: rule.label, points: rule.points },
      create: { category: rule.category, label: rule.label, points: rule.points },
    });
  }

  const awardNames = [
    "AI Student of the Year",
    "AI Researcher of the Year",
    "Best AI Project",
    "Best AI Startup",
    "Best AI Faculty Mentor",
    "Best Industry Mentor",
    "Most Active AI Learner",
    "Best GPU Computing Project",
  ];
  for (const name of awardNames) {
    await prisma.award.upsert({ where: { name }, update: {}, create: { name } });
  }
}

// ---------------------------------------------------------------------------
// Accounts — whitelisted and fully onboarded, so no onboarding step is needed
// after first sign-in. Year label -> cohort via the same rule the app uses.
// ---------------------------------------------------------------------------

const YEAR = new Date(NOW).getFullYear();
const cohortFor = (year: number) => YEAR - (year - 1);

const ADMINS = [{ email: "admin@sece.ac.in", fullName: "Chief Administrator", designation: "CoE Director" }];

const MENTORS = [
  { email: "mentor@sece.ac.in", fullName: "Faculty AI Mentor", department: "B.E CSE", designation: "Assistant Professor" },
  { email: "priya.raman@sece.ac.in", fullName: "Dr. Priya Raman", department: "B.E AIML(CSE)", designation: "Associate Professor" },
  { email: "karthik.subramanian@sece.ac.in", fullName: "Karthik Subramanian", department: "B.E ECE", designation: "Assistant Professor" },
  { email: "meena.krishnan@sece.ac.in", fullName: "Dr. Meena Krishnan", department: "B.Tech AIDS", designation: "Professor & Head" },
  { email: "vignesh.babu@sece.ac.in", fullName: "Vignesh Babu", department: "B.Tech IT", designation: "Assistant Professor" },
];

const STUDENTS = [
  { email: "student@sece.ac.in", fullName: "AI Research Scholar", department: "B.E CSE", year: 3, regNum: "727624BCS001", gpuCredits: 40, carryForward: 1250 },
  { email: "arun.kumar@sece.ac.in", fullName: "Arun Kumar", department: "B.E CSE", year: 4, regNum: "727623BCS014", gpuCredits: 80, carryForward: 2400 },
  { email: "divya.lakshmi@sece.ac.in", fullName: "Divya Lakshmi", department: "B.E AIML(CSE)", year: 3, regNum: "727624BAM007", gpuCredits: 20, carryForward: 900 },
  { email: "harish.venkatesh@sece.ac.in", fullName: "Harish Venkatesh", department: "B.Tech AIDS", year: 4, regNum: "727623BAD021", gpuCredits: 120, carryForward: 4400 },
  { email: "keerthana.s@sece.ac.in", fullName: "Keerthana S", department: "B.E ECE", year: 2, regNum: "727625BEC033", gpuCredits: 0, carryForward: 150 },
  { email: "mohammed.irfan@sece.ac.in", fullName: "Mohammed Irfan", department: "B.E CSE", year: 2, regNum: "727625BCS042", gpuCredits: 0, carryForward: 120 },
  { email: "nandhini.r@sece.ac.in", fullName: "Nandhini R", department: "B.Tech IT", year: 3, regNum: "727624BIT018", gpuCredits: 10, carryForward: 400 },
  { email: "pranav.menon@sece.ac.in", fullName: "Pranav Menon", department: "B.E MECH", year: 1, regNum: "727626BME005", gpuCredits: 0 },
  { email: "sanjay.raj@sece.ac.in", fullName: "Sanjay Raj", department: "B.E AIML(CSE)", year: 1, regNum: "727626BAM011", gpuCredits: 0 },
  { email: "swetha.priya@sece.ac.in", fullName: "Swetha Priya", department: "B.E CSE(CYS)", year: 2, regNum: "727625BCY009", gpuCredits: 0, carryForward: 90 },
  { email: "vishal.anand@sece.ac.in", fullName: "Vishal Anand", department: "B.Tech CSBS", year: 4, regNum: "727623BCB003", gpuCredits: 60, carryForward: 1300 },
];

type Accounts = {
  admin: string;
  mentors: string[]; // user ids, same order as MENTORS (mentors[0] = mentor@)
  students: Map<string, { userId: string; cohortYear: number }>; // by email
};

async function seedAccounts(): Promise<Accounts> {
  const roleRows = await prisma.role.findMany();
  const roleIdByName = new Map(roleRows.map((r) => [r.name, r.role_id]));

  async function upsertUser(email: string, fullName: string, role: RoleName, department: string, year?: string) {
    await prisma.accessWhitelist.upsert({
      where: { email },
      update: { full_name: fullName, role, department, year: year ?? null, status: "AUTHORIZED" },
      create: { email, full_name: fullName, role, department, year: year ?? null, status: "AUTHORIZED", source: "Demo seed" },
    });
    const user = await prisma.user.upsert({ where: { email }, update: { full_name: fullName }, create: { email, full_name: fullName } });
    const roleId = roleIdByName.get(role)!;
    await prisma.userRole.upsert({
      where: { user_id_role_id: { user_id: user.user_id, role_id: roleId } },
      update: {},
      create: { user_id: user.user_id, role_id: roleId },
    });
    return user.user_id;
  }

  let admin = "";
  for (const a of ADMINS) {
    admin = await upsertUser(a.email, a.fullName, RoleName.ADMIN, "");
    const employeeId = a.email.split("@")[0]!.toUpperCase();
    await prisma.admin.upsert({
      where: { user_id: admin },
      update: { designation: a.designation },
      create: { user_id: admin, employee_id: employeeId, designation: a.designation },
    });
  }

  const mentors: string[] = [];
  for (const m of MENTORS) {
    const userId = await upsertUser(m.email, m.fullName, RoleName.MENTOR, m.department);
    const employeeId = m.email.split("@")[0]!.toUpperCase();
    await prisma.faculty.upsert({
      where: { user_id: userId },
      update: { department: m.department, designation: m.designation, mentor_department: m.department },
      create: { user_id: userId, employee_id: employeeId, department: m.department, designation: m.designation, mentor_department: m.department },
    });
    mentors.push(userId);
  }

  const students = new Map<string, { userId: string; cohortYear: number }>();
  for (const s of STUDENTS) {
    const cohortYear = cohortFor(s.year);
    const userId = await upsertUser(s.email, s.fullName, RoleName.STUDENT, s.department, studentYearLabel(cohortYear, new Date(NOW)));
    await prisma.student.upsert({
      where: { user_id: userId },
      update: { department: s.department, cohort_year: cohortYear },
      create: { user_id: userId, register_num: s.regNum, department: s.department, cohort_year: cohortYear, gpu_credit_balance: s.gpuCredits },
    });
    students.set(s.email, { userId, cohortYear });
  }

  return { admin, mentors, students };
}

// ---------------------------------------------------------------------------
// Demo dataset
// ---------------------------------------------------------------------------

async function seedDemoData({ admin, mentors, students }: Accounts) {
  const sid = (email: string) => students.get(email)!.userId;
  const [mentorMain, mentorPriya, mentorKarthik, mentorMeena, mentorVignesh] = mentors as [string, string, string, string, string];
  const allStudentEmails = [...students.keys()];

  const award = (userId: string, points: number, reason: string, createdAt: Date, link: { claimId?: string; enrollmentId?: string } = {}) =>
    prisma.pointsTransaction.create({
      data: { user_id: userId, points, reason, created_at: createdAt, claim_id: link.claimId, enrollment_id: link.enrollmentId },
    });

  // Opening balance for students who already earned points last academic year.
  for (const s of STUDENTS) {
    if (s.carryForward) await award(sid(s.email), s.carryForward, "Carried forward from 2025–26 passport", daysAgo(100));
  }

  // ---- Courses -------------------------------------------------------------

  const courseDefs = [
    {
      title: "Fundamentals of Deep Learning",
      short: "Train neural networks end-to-end on NVIDIA GPUs.",
      description: "Hands-on NVIDIA DLI course: build, train and deploy deep neural networks for image classification, data augmentation, transfer learning and sequence models, finishing with a GPU-accelerated assessment.",
      category: "Deep Learning", difficulty: "Beginner", hours: 8, weeks: 2, mode: "Online (Self-paced)",
      provider: "NVIDIA DLI", url: "https://learn.nvidia.com/courses/course-detail?course_id=course-v1:DLI+S-FX-01+V1",
      points: 50, level: null, featured: true,
      skills: ["Neural networks", "CNNs", "Transfer learning", "Data augmentation"],
      prereqs: ["Basic Python"], outcomes: ["Train an image classifier on GPU", "Apply transfer learning to a new dataset"],
      tools: ["Python", "PyTorch", "Jupyter"], audience: "1st–3rd year students starting with AI",
      tasks: ["Complete Module 1: The Mechanics of Deep Learning", "Complete Module 2: CNNs & Data Augmentation", "Complete Module 3: Pre-trained Models & Transfer Learning", "Upload DLI completion certificate"],
    },
    {
      title: "Getting Started with Accelerated Computing in CUDA C/C++",
      short: "Write your first CUDA kernels and profile them.",
      description: "Learn to accelerate C/C++ applications with CUDA: kernels, thread hierarchy, unified memory, asynchronous streams and Nsight Systems profiling. Includes a live proctored coding assessment in the CoE lab.",
      category: "GPU Computing", difficulty: "Intermediate", hours: 8, weeks: 2, mode: "Hybrid",
      provider: "NVIDIA DLI", url: "https://learn.nvidia.com/courses/course-detail?course_id=course-v1:DLI+S-AC-04+V1",
      points: 60, level: 1, featured: true,
      skills: ["CUDA kernels", "Unified memory", "Streams", "Nsight profiling"],
      prereqs: ["C programming", "Pointers & memory"], outcomes: ["Port a CPU loop to a CUDA kernel", "Profile and optimise GPU memory access"],
      tools: ["CUDA Toolkit", "Nsight Systems", "DGX lab access"], audience: "2nd–4th year CSE/ECE/AIDS",
      tasks: ["Lab 1: Accelerating applications with CUDA kernels", "Lab 2: Managing unified memory", "Lab 3: Asynchronous streaming & profiling"],
      proctored: "Live proctored CUDA assessment (CoE Lab)",
    },
    {
      title: "Building RAG Agents with LLMs",
      short: "Retrieval-augmented generation and agentic LLM pipelines.",
      description: "Design LLM applications that retrieve from your own documents: embeddings, vector stores, chunking strategies, guardrails and agent orchestration, deployed with NVIDIA NIM microservices.",
      category: "Generative AI", difficulty: "Intermediate", hours: 8, weeks: 3, mode: "Online (Self-paced)",
      provider: "NVIDIA DLI", url: "https://learn.nvidia.com/courses/course-detail?course_id=course-v1:DLI+S-FX-15+V1",
      points: 60, level: 1, featured: true,
      skills: ["RAG", "Embeddings", "Vector databases", "LLM agents"],
      prereqs: ["Python", "Basic ML"], outcomes: ["Build a document Q&A assistant", "Evaluate RAG answer quality"],
      tools: ["LangChain", "FAISS", "NVIDIA NIM"], audience: "3rd & 4th year students",
      tasks: ["Build an embedding + vector store pipeline", "Implement a RAG chain over course PDFs", "Add guardrails and evaluation", "Upload completion certificate"],
    },
    {
      title: "Machine Learning Specialization",
      short: "Andrew Ng's foundational ML specialization.",
      description: "Three-course specialization covering supervised learning (regression, classification), advanced algorithms (neural networks, decision trees) and unsupervised learning, recommenders and reinforcement learning.",
      category: "AI Foundation", difficulty: "Beginner", hours: 90, weeks: 12, mode: "Online",
      provider: "Coursera", url: "https://www.coursera.org/specializations/machine-learning-introduction",
      points: 80, level: null, featured: false,
      skills: ["Regression", "Classification", "Decision trees", "Clustering"],
      prereqs: ["High-school maths"], outcomes: ["Implement ML models with NumPy & scikit-learn", "Apply best practices for ML development"],
      tools: ["Python", "NumPy", "scikit-learn", "TensorFlow"], audience: "All years",
      tasks: ["Course 1: Supervised Machine Learning", "Course 2: Advanced Learning Algorithms", "Course 3: Unsupervised Learning & Recommenders"],
    },
    {
      title: "Deep Learning for Computer Vision",
      short: "NPTEL — IIT Hyderabad, 12 weeks.",
      description: "NPTEL course on CNN architectures, object detection, segmentation, visual attention, vision transformers and generative models for vision. Proctored NPTEL exam at the end of the term.",
      category: "Computer Vision", difficulty: "Intermediate", hours: 36, weeks: 12, mode: "Online + Proctored Exam",
      provider: "NPTEL", url: "https://onlinecourses.nptel.ac.in/noc24_cs89/preview",
      points: 70, level: 1, featured: false,
      skills: ["Object detection", "Segmentation", "Vision transformers"],
      prereqs: ["Linear algebra", "Intro to ML"], outcomes: ["Explain modern CV architectures", "Train a detector on a custom dataset"],
      tools: ["PyTorch", "OpenCV"], audience: "3rd & 4th year students",
      tasks: ["Weekly assignments 1–6", "Weekly assignments 7–12", "Clear NPTEL proctored exam"],
    },
    {
      title: "Introduction to Large Language Models",
      short: "NPTEL — IIT Madras, 12 weeks.",
      description: "Transformer internals, pre-training objectives, instruction tuning, RLHF, parameter-efficient fine-tuning and responsible deployment of large language models.",
      category: "Generative AI", difficulty: "Intermediate", hours: 36, weeks: 12, mode: "Online + Proctored Exam",
      provider: "NPTEL", url: "https://onlinecourses.nptel.ac.in/noc25_cs45/preview",
      points: 70, level: 1, featured: true,
      skills: ["Transformers", "Fine-tuning", "LoRA", "RLHF"],
      prereqs: ["Deep learning basics"], outcomes: ["Fine-tune an open LLM with LoRA", "Evaluate LLM outputs responsibly"],
      tools: ["Hugging Face", "PyTorch"], audience: "3rd & 4th year students",
      tasks: ["Weekly assignments 1–6", "Weekly assignments 7–12", "Clear NPTEL proctored exam"],
    },
    {
      title: "Python for Data Science",
      short: "NPTEL — IIT Madras, 4 weeks.",
      description: "Short NPTEL course on Python fundamentals, NumPy, Pandas, visualisation with Matplotlib and simple regression/classification case studies.",
      category: "AI Foundation", difficulty: "Beginner", hours: 12, weeks: 4, mode: "Online",
      provider: "NPTEL", url: "https://onlinecourses.nptel.ac.in/noc25_cs67/preview",
      points: 40, level: null, featured: false,
      skills: ["Python", "Pandas", "Data visualisation"],
      prereqs: [], outcomes: ["Clean and analyse a dataset with Pandas"],
      tools: ["Python", "Jupyter", "Pandas"], audience: "1st & 2nd year students",
      tasks: ["Week 1–2 assignments", "Week 3–4 assignments", "Upload NPTEL certificate"],
    },
    {
      title: "Applied MLOps with Docker & Kubernetes",
      short: "Ship models to production with CI/CD.",
      description: "Package models with Docker, serve them with FastAPI and Triton, orchestrate on Kubernetes, and add monitoring and CI/CD pipelines for continuous training.",
      category: "MLOps", difficulty: "Advanced", hours: 20, weeks: 4, mode: "Online",
      provider: "Udemy", url: "https://www.udemy.com/topic/mlops/",
      points: 50, level: 2, featured: false,
      skills: ["Docker", "Kubernetes", "Model serving", "CI/CD"],
      prereqs: ["Python", "Linux basics", "Trained ML model"], outcomes: ["Deploy a model behind an autoscaling endpoint"],
      tools: ["Docker", "Kubernetes", "Triton Inference Server", "GitHub Actions"], audience: "Level 2+ students",
      tasks: ["Containerise a model with Docker", "Deploy on Kubernetes with autoscaling", "Set up CI/CD + monitoring"],
    },
  ];

  const courses: { id: string; title: string; points: number; tasks: { id: string; type: CourseTaskType }[] }[] = [];
  for (const [i, c] of courseDefs.entries()) {
    const taskData: Prisma.CourseTaskCreateWithoutCourseInput[] = c.tasks.map((t, idx) => ({
      title: t, type: CourseTaskType.STANDARD, sequence_order: idx + 1, instructions: `Complete "${t}" and mark it done here.`,
    }));
    if (c.proctored) {
      taskData.push({
        title: c.proctored, type: CourseTaskType.LIVE_PROCTORED, sequence_order: taskData.length + 1,
        instructions: "60-minute live coding assessment in fullscreen. Leaving fullscreen or switching tabs is logged; the 4th violation locks the session.",
      });
    }
    const created = await prisma.course.create({
      data: {
        title: c.title, description: c.description, short_description: c.short, category: c.category, difficulty: c.difficulty,
        duration_hours: c.hours, duration_weeks: c.weeks, delivery_mode: c.mode, is_featured: c.featured,
        skills_covered: c.skills, prerequisites: c.prereqs, learning_outcomes: c.outcomes, tools_required: c.tools, target_audience: c.audience,
        provider: c.provider, external_url: c.url, points_value: c.points, level_requirement: c.level,
        status: CourseStatus.PUBLISHED, created_by: i % 2 === 0 ? admin : mentorPriya, created_at: daysAgo(90 - i * 3),
        tasks: { create: taskData },
      },
      include: { tasks: { orderBy: { sequence_order: "asc" } } },
    });
    courses.push({ id: created.course_id, title: created.title, points: created.points_value, tasks: created.tasks.map((t) => ({ id: t.task_id, type: t.type })) });
  }

  await prisma.course.create({
    data: {
      title: "Edge AI with NVIDIA Jetson", description: "Deploy vision models on Jetson Orin Nano: TensorRT conversion, DeepStream pipelines and power profiling.",
      short_description: "Deploy AI at the edge on Jetson devices.", category: "Edge AI", difficulty: "Intermediate", duration_hours: 10, duration_weeks: 2,
      delivery_mode: "In-person Lab", provider: "NVIDIA DLI", external_url: "https://learn.nvidia.com/", points_value: 60, level_requirement: 2,
      status: CourseStatus.DRAFT, created_by: mentorMain, skills_covered: ["TensorRT", "DeepStream", "Jetson"],
      tasks: { create: [{ title: "Flash JetPack and run a sample", sequence_order: 1 }, { title: "Convert a model to TensorRT", sequence_order: 2 }] },
    },
  });

  // [studentEmail, courseIndex, status, submittedDaysAgo, reviewer, feedback?]
  type E = [string, number, EnrollmentStatus, number, string?, string?];
  const enrollments: E[] = [
    ["student@sece.ac.in", 0, EnrollmentStatus.APPROVED, 42, mentorMain, "Certificate verified. Great work!"],
    ["student@sece.ac.in", 3, EnrollmentStatus.APPROVED, 24, mentorMain, "All three courses verified."],
    ["student@sece.ac.in", 1, EnrollmentStatus.SUBMITTED, 2],
    ["student@sece.ac.in", 2, EnrollmentStatus.IN_PROGRESS, 0],
    ["student@sece.ac.in", 4, EnrollmentStatus.REJECTED, 10, mentorMain, "Certificate name doesn't match your registered name — please re-upload the correct one."],
    ["student@sece.ac.in", 5, EnrollmentStatus.NOT_STARTED, 0],
    ["arun.kumar@sece.ac.in", 0, EnrollmentStatus.APPROVED, 80, mentorMain, "Verified."],
    ["arun.kumar@sece.ac.in", 1, EnrollmentStatus.APPROVED, 60, mentorMain, "Excellent proctored assessment score."],
    ["arun.kumar@sece.ac.in", 2, EnrollmentStatus.APPROVED, 35, mentorPriya, "Verified."],
    ["arun.kumar@sece.ac.in", 7, EnrollmentStatus.APPROVED, 12, mentorVignesh, "Nice CI/CD pipeline."],
    ["arun.kumar@sece.ac.in", 5, EnrollmentStatus.IN_PROGRESS, 0],
    ["divya.lakshmi@sece.ac.in", 0, EnrollmentStatus.APPROVED, 50, mentorPriya, "Verified."],
    ["divya.lakshmi@sece.ac.in", 5, EnrollmentStatus.APPROVED, 20, mentorPriya, "Top 5% in NPTEL exam — well done."],
    ["divya.lakshmi@sece.ac.in", 2, EnrollmentStatus.SUBMITTED, 1],
    ["harish.venkatesh@sece.ac.in", 0, EnrollmentStatus.APPROVED, 95, mentorMeena, "Verified."],
    ["harish.venkatesh@sece.ac.in", 1, EnrollmentStatus.APPROVED, 70, mentorMeena, "Verified."],
    ["harish.venkatesh@sece.ac.in", 4, EnrollmentStatus.APPROVED, 40, mentorMeena, "Elite certificate — verified."],
    ["harish.venkatesh@sece.ac.in", 7, EnrollmentStatus.SUBMITTED, 3],
    ["keerthana.s@sece.ac.in", 6, EnrollmentStatus.APPROVED, 15, mentorKarthik, "Verified."],
    ["keerthana.s@sece.ac.in", 3, EnrollmentStatus.IN_PROGRESS, 0],
    ["mohammed.irfan@sece.ac.in", 6, EnrollmentStatus.SUBMITTED, 1],
    ["mohammed.irfan@sece.ac.in", 0, EnrollmentStatus.IN_PROGRESS, 0],
    ["nandhini.r@sece.ac.in", 3, EnrollmentStatus.APPROVED, 30, mentorVignesh, "Verified."],
    ["nandhini.r@sece.ac.in", 2, EnrollmentStatus.IN_PROGRESS, 0],
    ["pranav.menon@sece.ac.in", 6, EnrollmentStatus.IN_PROGRESS, 0],
    ["sanjay.raj@sece.ac.in", 6, EnrollmentStatus.NOT_STARTED, 0],
    ["sanjay.raj@sece.ac.in", 0, EnrollmentStatus.IN_PROGRESS, 0],
    ["swetha.priya@sece.ac.in", 3, EnrollmentStatus.REJECTED, 6, mentorMain, "Only 2 of 3 course certificates were uploaded."],
    ["vishal.anand@sece.ac.in", 3, EnrollmentStatus.APPROVED, 55, mentorMain, "Verified."],
    ["vishal.anand@sece.ac.in", 2, EnrollmentStatus.APPROVED, 18, mentorPriya, "Verified."],
  ];

  for (const [email, ci, status, ago, reviewer, feedback] of enrollments) {
    const userId = sid(email);
    const course = courses[ci]!;
    const submitted = status === EnrollmentStatus.SUBMITTED || status === EnrollmentStatus.APPROVED || status === EnrollmentStatus.REJECTED;
    const reviewed = status === EnrollmentStatus.APPROVED || status === EnrollmentStatus.REJECTED;
    const submittedAt = daysAgo(ago + (reviewed ? 2 : 0), 16);
    const reviewedAt = daysAgo(ago, 11);

    const enrollment = await prisma.courseEnrollment.create({
      data: {
        course_id: course.id, user_id: userId, status,
        submitted_proof_url: submitted ? `https://certificates.example.com/${course.id.slice(0, 8)}/${userId.slice(0, 8)}.pdf` : null,
        submitted_at: submitted ? submittedAt : null,
        reviewed_by: reviewed ? reviewer : null, review_feedback: reviewed ? feedback : null, reviewed_at: reviewed ? reviewedAt : null,
        created_at: daysAgo(ago + 20),
      },
    });

    // Task completions: all for submitted/reviewed, the first half for in-progress.
    const doneCount = submitted ? course.tasks.length : status === EnrollmentStatus.IN_PROGRESS ? Math.ceil(course.tasks.length / 2) : 0;
    for (const [ti, task] of course.tasks.slice(0, doneCount).entries()) {
      const at = daysAgo(ago + 18 - ti * 3, 15);
      if (task.type === CourseTaskType.LIVE_PROCTORED) {
        await prisma.proctoringSession.create({
          data: { task_id: task.id, user_id: userId, status: ProctoringStatus.COMPLETED, violation_count: ti % 2, started_at: at, ended_at: new Date(at.getTime() + 55 * MIN) },
        });
      } else {
        await prisma.courseTaskCompletion.create({ data: { task_id: task.id, user_id: userId, completed_at: at } });
      }
    }

    if (status === EnrollmentStatus.APPROVED) {
      await award(userId, course.points, `Course completed: ${course.title}`, reviewedAt, { enrollmentId: enrollment.enrollment_id });
    }
  }

  // One locked proctoring session waiting for a mentor to grant access.
  const cudaProctored = courses[1]!.tasks.find((t) => t.type === CourseTaskType.LIVE_PROCTORED)!;
  const divyaCuda = await prisma.courseEnrollment.create({
    data: { course_id: courses[1]!.id, user_id: sid("divya.lakshmi@sece.ac.in"), status: EnrollmentStatus.IN_PROGRESS, created_at: daysAgo(12) },
  });
  for (const t of courses[1]!.tasks.filter((t) => t.type === CourseTaskType.STANDARD)) {
    await prisma.courseTaskCompletion.create({ data: { task_id: t.id, user_id: divyaCuda.user_id, completed_at: daysAgo(5) } });
  }
  const locked = await prisma.proctoringSession.create({
    data: { task_id: cudaProctored.id, user_id: divyaCuda.user_id, status: ProctoringStatus.LOCKED, violation_count: 4, started_at: daysAgo(1, 14), locked_at: new Date(daysAgo(1, 14).getTime() + 22 * MIN) },
  });
  const violations = ["TAB_SWITCH", "WINDOW_BLUR", "FULLSCREEN_EXIT", "TAB_SWITCH"] as const;
  for (const [i, v] of violations.entries()) {
    await prisma.proctoringViolation.create({
      data: { session_id: locked.session_id, violation_type: v, occurred_at: new Date(daysAgo(1, 14).getTime() + (5 + i * 5) * MIN), mentor_notified: true },
    });
  }

  // ---- CoE Classes (events + QR sessions) and attendance ------------------

  type ClassDef = {
    title: string; description: string; category: string; year: string | null; location: string; sessionType: string;
    start: Date; durationHours: number; mentor: string; coMentors: string[];
    log?: { topics: string; materials?: string; notes?: string };
  };
  const classes: ClassDef[] = [
    {
      title: "Tech Eve: Introduction to Generative AI", category: "tech_eve_masterclass", year: null, location: "IT Centre", sessionType: "Forenoon",
      description: "Program kickoff Tech Eve — what generative AI is, how the AI Digital Passport works, and how to earn your first points.",
      start: daysAgo(21, 10), durationHours: 1.5, mentor: mentorMain, coMentors: [mentorPriya],
      log: { topics: "History of generative models; diffusion vs. autoregressive models; live ChatGPT/Stable Diffusion demo; passport levels & scoring walkthrough", materials: "https://drive.google.com/drive/folders/genai-tech-eve-slides", notes: "Full hall (~180 students). Many asked about GPU credit eligibility — will cover in Friday Lab." },
    },
    {
      title: "GPU Friday Lab — CUDA Kernels & Memory Hierarchy", category: "gpu_friday_lab", year: "3rd Year", location: "Code Studio", sessionType: "Afternoon",
      description: "Hands-on CUDA lab on the DGX nodes: writing kernels, thread/block indexing, global vs. shared memory.",
      start: daysAgo(18, 14), durationHours: 2, mentor: mentorMain, coMentors: [mentorKarthik],
      log: { topics: "Thread/block/grid indexing; vector add & matrix multiply kernels; shared-memory tiling; nvcc & Nsight basics", materials: "https://github.com/sece-coe/gpu-friday-labs/tree/main/01-cuda-basics", notes: "Two DGX nodes used; 3 students had driver issues on lab PCs — fixed by switching to the JupyterHub image." },
    },
    {
      title: "GPU Friday Lab — Training CNNs on DGX", category: "gpu_friday_lab", year: "4th Year", location: "Code Studio", sessionType: "Afternoon",
      description: "Multi-GPU training of ResNet-50 on a subset of ImageNet using PyTorch and mixed precision.",
      start: daysAgo(11, 14), durationHours: 2, mentor: mentorMeena, coMentors: [mentorMain],
      log: { topics: "PyTorch DataLoader tuning; automatic mixed precision; DistributedDataParallel on 4×A100; monitoring with nvidia-smi and TensorBoard", materials: "https://github.com/sece-coe/gpu-friday-labs/tree/main/03-cnn-dgx", notes: "AMP gave ~2.3× speed-up. Assigned optional take-home: fine-tune on the textile-defect dataset." },
    },
    {
      title: "Masterclass: Prompt Engineering & LLM Apps", category: "tech_eve_masterclass", year: "2nd Year", location: "Collab Space", sessionType: "Forenoon",
      description: "Prompting patterns, structured output and building a small LLM-powered app.",
      start: daysAgo(9, 10), durationHours: 1.5, mentor: mentorPriya, coMentors: [],
      log: { topics: "Zero/few-shot prompting; chain-of-thought; JSON-mode structured output; building a FAQ bot with an LLM API", materials: "https://drive.google.com/drive/folders/prompt-eng-masterclass", notes: "Students built a department FAQ bot in groups of 3." },
    },
    {
      title: "Python & NumPy Bootcamp", category: "tech_eve_masterclass", year: "1st Year", location: "Full Stack Lab", sessionType: "Afternoon",
      description: "Foundations bootcamp for first-years: Python refresher, NumPy arrays and vectorised thinking.",
      start: daysAgo(6, 14), durationHours: 2, mentor: mentorVignesh, coMentors: [mentorMain],
      log: { topics: "Python data types & functions; NumPy arrays, broadcasting, vectorisation; mini-exercise: image as a NumPy array", materials: "https://github.com/sece-coe/bootcamps/tree/main/python-numpy", notes: "Pace was a bit fast for MECH students — will share extra practice notebooks." },
    },
    {
      title: "GPU Friday Lab — TensorRT Inference Optimisation", category: "gpu_friday_lab", year: "3rd Year", location: "Code Studio", sessionType: "Afternoon",
      description: "Convert a trained PyTorch model to ONNX and TensorRT; measure latency and throughput gains.",
      start: daysAgo(4, 14), durationHours: 2, mentor: mentorKarthik, coMentors: [mentorMain, mentorMeena],
      log: { topics: "PyTorch → ONNX export; TensorRT engine build (FP16/INT8); latency benchmarking; Triton Inference Server overview", materials: "https://github.com/sece-coe/gpu-friday-labs/tree/main/04-tensorrt", notes: "Observed 4–6× latency reduction with FP16 engines. INT8 calibration left as homework." },
    },
    {
      title: "Research Paper Writing Workshop", category: "tech_eve_masterclass", year: "4th Year", location: "Seminar Hall", sessionType: "Forenoon",
      description: "Structuring an AI research paper, related-work surveys, experiments and choosing the right venue.",
      start: daysAgo(2, 10), durationHours: 1.5, mentor: mentorMeena, coMentors: [mentorPriya],
      log: { topics: "IMRaD structure; writing related work with Zotero; reporting experiments & ablations; IEEE/Springer conference selection", materials: "https://drive.google.com/drive/folders/research-writing-workshop", notes: "Four capstone teams plan to submit to ICACCS 2027." },
    },
    {
      title: "GPU Friday Lab — RAPIDS cuDF for Data Science", category: "gpu_friday_lab", year: null, location: "Code Studio", sessionType: "Afternoon",
      description: "GPU-accelerated dataframes with RAPIDS cuDF and cuML — live now, scan the QR to check in.",
      start: new Date(NOW - 30 * MIN), durationHours: 2, mentor: mentorMain, coMentors: [mentorVignesh],
    },
    {
      title: "Tech Eve: Computer Vision in Manufacturing", category: "tech_eve_masterclass", year: null, location: "IT Centre", sessionType: "Forenoon",
      description: "Industry talk on vision-based quality inspection, with a walkthrough of open industry problems on the portal.",
      start: daysAhead(2, 10), durationHours: 1.5, mentor: mentorKarthik, coMentors: [],
    },
    {
      title: "GPU Friday Lab — Multi-GPU Training with DDP", category: "gpu_friday_lab", year: "3rd Year", location: "Code Studio", sessionType: "Afternoon",
      description: "Scaling training across GPUs with PyTorch DistributedDataParallel and NCCL.",
      start: daysAhead(7, 14), durationHours: 2, mentor: mentorMain, coMentors: [mentorMeena],
    },
    {
      title: "Hackathon Prep: Building an AI MVP in 48 Hours", category: "certification_project_hackathon", year: "4th Year", location: "Full Stack Lab", sessionType: "Afternoon",
      description: "Team formation, scoping, and a rapid-prototyping playbook for the upcoming industry hackathon.",
      start: daysAhead(10, 14), durationHours: 3, mentor: mentorVignesh, coMentors: [mentorMain],
    },
    {
      title: "Masterclass: NVIDIA NIM & AI Agents", category: "tech_eve_masterclass", year: "2nd Year", location: "Collab Space", sessionType: "Forenoon",
      description: "Deploying optimised model microservices with NVIDIA NIM and orchestrating simple tool-using agents.",
      start: daysAhead(14, 10), durationHours: 1.5, mentor: mentorPriya, coMentors: [],
    },
  ];

  for (const c of classes) {
    const end = new Date(c.start.getTime() + c.durationHours * HOUR);
    const isLive = c.start.getTime() <= NOW && end.getTime() > NOW;
    const event = await prisma.event.create({
      data: {
        title: c.title, description: c.description, location: c.location, category: c.category, year: c.year, session_type: c.sessionType,
        starts_at: c.start, ends_at: end, created_by: admin, created_at: new Date(c.start.getTime() - 10 * DAY),
        sessions: { create: { title: c.title, starts_at: c.start, ends_at: end } },
      },
      include: { sessions: true },
    });
    const session = event.sessions[0]!;

    if (end.getTime() > NOW && !isLive) continue; // upcoming: nothing to record yet

    // Attendance: every student in the class's year (or everyone for an
    // all-years class), skipping a few so attendance isn't a flat 100%.
    const eligible = allStudentEmails.filter((e) => !c.year || studentYearLabel(students.get(e)!.cohortYear, new Date(NOW)) === c.year);
    const attendees = isLive ? eligible.slice(0, 3) : eligible.filter((_, i) => i % 5 !== 4);
    const points = pointsFor(c.category);
    for (const [i, email] of attendees.entries()) {
      const userId = sid(email);
      const at = new Date(c.start.getTime() + (5 + i * 2) * MIN);
      const claim = await prisma.activityClaim.create({
        data: { user_id: userId, category: c.category, proof_type: ProofType.TOTP_QR, points_requested: points, points_awarded: points, status: ClaimStatus.APPROVED, reviewed_at: at, created_at: at },
      });
      await prisma.attendance.create({ data: { user_id: userId, session_id: session.session_id, checked_in_at: at } });
      await award(userId, points, `Live event attendance: ${c.title}`, at, { claimId: claim.claim_id });
    }

    if (c.log) {
      await prisma.classTeachingLog.create({
        data: {
          event_id: event.event_id, mentor_id: c.mentor, co_mentor_ids: c.coMentors, class_date: c.start,
          topics_covered: c.log.topics, materials_url: c.log.materials, notes: c.log.notes, created_at: new Date(end.getTime() + 2 * HOUR),
        },
      });
    }
  }

  // ---- Activity claims (mentor-verified) ------------------------------------

  type C = { email: string; category: string; proof: ProofType; url: string; status: ClaimStatus; ago: number; reviewer?: string; feedback?: string };
  const claims: C[] = [
    { email: "student@sece.ac.in", category: "course_completion", proof: ProofType.PDF_FILE, url: "https://nptel.ac.in/noc/Ecertificate/?q=NOC25CS11S3345", status: ClaimStatus.APPROVED, ago: 30, reviewer: mentorMain, feedback: "NPTEL Cloud Computing (Elite) — verified." },
    { email: "student@sece.ac.in", category: "certification_project_hackathon", proof: ProofType.GITHUB_LINK, url: "https://github.com/ai-scholar/textile-defect-yolo", status: ClaimStatus.APPROVED, ago: 15, reviewer: mentorMain, feedback: "Solid mini project with clear README and results." },
    { email: "student@sece.ac.in", category: "industry_hackathon_win", proof: ProofType.PDF_FILE, url: "https://drive.google.com/file/d/hackathon-cert", status: ClaimStatus.REJECTED, ago: 12, reviewer: mentorMain, feedback: "This is a participation certificate, not a winner certificate — please claim under Hackathon instead." },
    { email: "student@sece.ac.in", category: "research_patent", proof: ProofType.DOI_LINK, url: "https://doi.org/10.1109/ICACCS.2026.10492211", status: ClaimStatus.PENDING, ago: 1 },
    { email: "arun.kumar@sece.ac.in", category: "industry_hackathon_win", proof: ProofType.PDF_FILE, url: "https://drive.google.com/file/d/sih-2026-winner", status: ClaimStatus.APPROVED, ago: 45, reviewer: mentorMain, feedback: "Smart India Hackathon winner — congratulations!" },
    { email: "arun.kumar@sece.ac.in", category: "research_patent", proof: ProofType.DOI_LINK, url: "https://doi.org/10.1007/978-981-97-2211-4_18", status: ClaimStatus.APPROVED, ago: 28, reviewer: mentorMeena, feedback: "Springer LNNS paper verified." },
    { email: "arun.kumar@sece.ac.in", category: "certification_project_hackathon", proof: ProofType.GITHUB_LINK, url: "https://github.com/arunk/cnc-spindle-anomaly", status: ClaimStatus.PENDING, ago: 2 },
    { email: "divya.lakshmi@sece.ac.in", category: "certification_project_hackathon", proof: ProofType.PDF_FILE, url: "https://aws.amazon.com/verification/ML-SPEC-2026-7781", status: ClaimStatus.APPROVED, ago: 22, reviewer: mentorPriya, feedback: "AWS ML Specialty verified." },
    { email: "divya.lakshmi@sece.ac.in", category: "course_completion", proof: ProofType.PDF_FILE, url: "https://coursera.org/verify/DL-SPEC-DL88", status: ClaimStatus.PENDING, ago: 1 },
    { email: "harish.venkatesh@sece.ac.in", category: "research_patent", proof: ProofType.DOI_LINK, url: "https://doi.org/10.1016/j.compag.2026.109120", status: ClaimStatus.APPROVED, ago: 60, reviewer: mentorMeena, feedback: "Elsevier journal paper — excellent." },
    { email: "harish.venkatesh@sece.ac.in", category: "industry_hackathon_win", proof: ProofType.PDF_FILE, url: "https://drive.google.com/file/d/nvidia-hack-2nd-place", status: ClaimStatus.APPROVED, ago: 33, reviewer: mentorMeena, feedback: "2nd place — verified." },
    { email: "harish.venkatesh@sece.ac.in", category: "certification_project_hackathon", proof: ProofType.GITHUB_LINK, url: "https://github.com/harishv/crop-disease-mobilenet", status: ClaimStatus.APPROVED, ago: 20, reviewer: mentorMeena },
    { email: "keerthana.s@sece.ac.in", category: "certification_project_hackathon", proof: ProofType.GITHUB_LINK, url: "https://github.com/keerthana-s/esp32-tinyml-keyword", status: ClaimStatus.PENDING, ago: 3 },
    { email: "mohammed.irfan@sece.ac.in", category: "course_completion", proof: ProofType.PDF_FILE, url: "https://coursera.org/verify/PY4E-2231", status: ClaimStatus.REJECTED, ago: 8, reviewer: mentorMain, feedback: "Certificate link is private — please make it public and resubmit." },
    { email: "nandhini.r@sece.ac.in", category: "certification_project_hackathon", proof: ProofType.PDF_FILE, url: "https://drive.google.com/file/d/azure-ai-900", status: ClaimStatus.APPROVED, ago: 14, reviewer: mentorVignesh, feedback: "Azure AI-900 verified." },
    { email: "swetha.priya@sece.ac.in", category: "certification_project_hackathon", proof: ProofType.GITHUB_LINK, url: "https://github.com/swethap/phishing-url-detector", status: ClaimStatus.PENDING, ago: 0 },
    { email: "vishal.anand@sece.ac.in", category: "industry_hackathon_win", proof: ProofType.PDF_FILE, url: "https://drive.google.com/file/d/fintech-hack-winner", status: ClaimStatus.APPROVED, ago: 26, reviewer: mentorMain, feedback: "Winner certificate verified." },
    { email: "vishal.anand@sece.ac.in", category: "research_patent", proof: ProofType.DOI_LINK, url: "https://doi.org/10.1109/ICCCNT.2026.1103345", status: ClaimStatus.PENDING, ago: 4 },
  ];

  const labelFor = (category: string) => SCORING_MATRIX.find((r) => r.category === category)?.label ?? category;
  for (const c of claims) {
    const userId = sid(c.email);
    const points = pointsFor(c.category);
    const createdAt = daysAgo(c.ago + (c.status === ClaimStatus.PENDING ? 0 : 2), 17);
    const reviewedAt = c.status === ClaimStatus.PENDING ? null : daysAgo(c.ago, 11);
    const claim = await prisma.activityClaim.create({
      data: {
        user_id: userId, category: c.category, proof_type: c.proof, proof_url: c.url, points_requested: points,
        points_awarded: c.status === ClaimStatus.APPROVED ? points : null, status: c.status, mentor_feedback: c.feedback,
        reviewed_by: c.reviewer, reviewed_at: reviewedAt, created_at: createdAt,
      },
    });
    if (c.reviewer && reviewedAt) {
      await prisma.claimReview.create({ data: { claim_id: claim.claim_id, reviewer_id: c.reviewer, decision: c.status, comment: c.feedback, created_at: reviewedAt } });
    }
    if (c.status === ClaimStatus.APPROVED) {
      await award(userId, points, `Claim approved: ${labelFor(c.category)}`, reviewedAt!, { claimId: claim.claim_id });
    }
  }

  // ---- Industry problems + student solution projects ----------------------

  const problemDefs = [
    { title: "Visual Defect Detection on Textile Looms", org: "Kovai Weaves Pvt. Ltd.", level: 2, status: ProblemStatus.PUBLISHED, description: "Detect weaving defects (broken warp, slubs, holes, oil stains) in real time from line-scan cameras mounted on power looms. Target: ≥95% recall at 30 FPS on an edge GPU, with defect location overlaid for the operator. A labelled dataset of ~12,000 images is provided." },
    { title: "Predictive Maintenance for CNC Spindles", org: "Precision Tooling Works, Coimbatore", level: 3, status: ProblemStatus.PUBLISHED, description: "Use vibration, temperature and spindle-load telemetry (1 kHz) from 24 CNC machines to predict bearing failure at least 48 hours in advance. Six months of labelled historical data with 31 failure events is available." },
    { title: "Tamil–English Customer Support Assistant", org: "Nilgiri Retail Networks", level: 2, status: ProblemStatus.PUBLISHED, description: "Build a bilingual (Tamil/English, including code-mixed 'Tanglish') support assistant that answers order, return and store-timing questions from the company knowledge base, and hands off to a human agent when confidence is low." },
    { title: "Crop Disease Detection from Leaf Images", org: "AgroSense Farmers Collective", level: 1, status: ProblemStatus.PUBLISHED, description: "A mobile-friendly model that identifies common diseases in tomato, chilli and banana leaves from phone photos taken in the field, working offline on low-end Android devices and suggesting remedial action in Tamil." },
    { title: "Campus Energy Load Forecasting", org: "SECE Facilities & Estates", level: 1, status: ProblemStatus.PUBLISHED, description: "Forecast hourly electricity demand for 14 campus buildings 24 hours ahead using smart-meter history, timetable and weather data, to plan solar and diesel-generator scheduling. Target MAPE below 8%." },
    { title: "Clinical Report Summarisation with LLMs", org: "Kongu Care Hospitals", level: 3, status: ProblemStatus.PUBLISHED, description: "Summarise discharge reports and lab results into a one-page patient-friendly summary, with citations back to source lines. Must run on-premise (no external APIs) with de-identified data." },
    { title: "Warehouse Pallet Counting from Drone Footage", org: "Swift Logistics Hub", level: 2, status: ProblemStatus.DRAFT, description: "Count and localise pallets in high-bay racks from indoor drone video to automate weekly stock audits." },
    { title: "Invoice OCR for Legacy Scanned Documents", org: "Anchor Accounting Services", level: 1, status: ProblemStatus.ARCHIVED, description: "Extract vendor, date, GST number and line items from low-quality scanned invoices (2008–2015). Archived: solved by the 2025 batch." },
  ];
  const problems: string[] = [];
  for (const [i, p] of problemDefs.entries()) {
    const created = await prisma.industryProblem.create({
      data: { title: p.title, description: p.description, organization: p.org, status: p.status, level_requirement: p.level, created_by: i % 3 === 0 ? admin : mentors[i % mentors.length], created_at: daysAgo(70 - i * 4) },
    });
    problems.push(created.problem_id);
  }

  const stageFields: Record<number, Record<string, string>> = {
    1: { problemRestatement: "Operators miss small defects during long shifts; manual inspection catches only ~70% and causes rework downstream.", targetUsers: "Loom operators and QA inspectors", researchSummary: "Reviewed YOLOv8 and anomaly-detection (PatchCore) approaches for fabric inspection.", documentLink: "https://drive.google.com/file/d/stage1-notes" },
    2: { proposedSolution: "YOLOv8-s detector fine-tuned on the provided dataset, with PatchCore as a fallback for unseen defect types.", techStack: "PyTorch, YOLOv8, TensorRT, FastAPI", architectureNotes: "Camera → Jetson Orin Nano (TensorRT FP16) → alerts to operator tablet; images logged to MinIO for retraining.", documentLink: "https://drive.google.com/file/d/stage2-design" },
    3: { prototypeSummary: "Working detector at 34 FPS on Jetson, mAP@0.5 = 0.91 on validation set.", repoUrl: "https://github.com/ai-scholar/textile-defect-yolo", demoUrl: "https://youtu.be/demo-textile", documentLink: "https://drive.google.com/file/d/stage3-proto" },
    4: { testingApproach: "Held-out 2,000-image test set plus a 2-hour live trial on loom #7.", resultsSummary: "Recall 96.2%, precision 92.8%, 29 ms latency.", documentLink: "https://drive.google.com/file/d/stage4-tests" },
  };

  // [studentEmail, problemIndex, approvedStages, pendingStage?, rejectedStage?]
  const problemProjects: [string, number, number, number | null, number | null][] = [
    ["student@sece.ac.in", 0, 2, 3, null],
    ["arun.kumar@sece.ac.in", 1, 4, null, null],
    ["harish.venkatesh@sece.ac.in", 3, 3, 4, null],
    ["divya.lakshmi@sece.ac.in", 2, 1, null, 2],
    ["nandhini.r@sece.ac.in", 4, 0, 1, null],
    ["vishal.anand@sece.ac.in", 5, 1, 2, null],
  ];
  for (const [email, pi, approved, pending, rejected] of problemProjects) {
    const project = await prisma.problemProject.create({
      data: { problem_id: problems[pi]!, user_id: sid(email), current_stage: Math.max(1, approved), created_at: daysAgo(50) },
    });
    const reviewer = mentors[pi % mentors.length]!;
    for (let stage = 1; stage <= approved; stage++) {
      await prisma.problemMilestone.create({
        data: {
          project_id: project.project_id, target_stage: stage, details: { fields: stageFields[stage] ?? {} }, evidence_url: stageFields[stage]?.documentLink,
          status: ClaimStatus.APPROVED, feedback: "Approved — proceed to the next stage.", reviewed_by: reviewer,
          reviewed_at: daysAgo(45 - stage * 8, 11), created_at: daysAgo(47 - stage * 8, 16),
        },
      });
    }
    if (rejected) {
      await prisma.problemMilestone.create({
        data: {
          project_id: project.project_id, target_stage: rejected, details: { fields: stageFields[rejected] ?? {} }, status: ClaimStatus.REJECTED,
          feedback: "Architecture doesn't address the code-mixed input requirement — please revise and resubmit.", reviewed_by: reviewer, reviewed_at: daysAgo(5), created_at: daysAgo(7),
        },
      });
    }
    if (pending) {
      await prisma.problemMilestone.create({
        data: { project_id: project.project_id, target_stage: pending, details: { fields: stageFields[pending] ?? {} }, evidence_url: stageFields[pending]?.documentLink, status: ClaimStatus.PENDING, created_at: daysAgo(1, 18) },
      });
    }
  }

  // ---- Startups ------------------------------------------------------------

  const startups: { email: string; title: string; approved: number; pending: number | null; gpu: boolean }[] = [
    { email: "student@sece.ac.in", title: "KrishiVision — AI crop advisory for small farmers", approved: 2, pending: 3, gpu: false },
    { email: "harish.venkatesh@sece.ac.in", title: "LoomSense — defect analytics for textile MSMEs", approved: 4, pending: null, gpu: true },
    { email: "vishal.anand@sece.ac.in", title: "LedgerLens — AI bookkeeping for kirana stores", approved: 1, pending: 2, gpu: false },
  ];
  for (const s of startups) {
    const project = await prisma.startupProject.create({
      data: { lead_student_id: sid(s.email), title: s.title, current_stage: Math.max(1, s.approved), gpu_validated: s.gpu, created_at: daysAgo(60) },
    });
    for (let stage = 1; stage <= s.approved; stage++) {
      await prisma.startupMilestone.create({
        data: {
          project_id: project.project_id, target_stage: stage, evidence_url: `https://drive.google.com/file/d/startup-stage-${stage}`,
          details: { fields: { documentLink: `https://drive.google.com/file/d/startup-stage-${stage}` }, documents: [] },
          status: ClaimStatus.APPROVED, feedback: "Approved.", reviewed_by: mentorMeena, reviewed_at: daysAgo(55 - stage * 10), created_at: daysAgo(57 - stage * 10),
        },
      });
    }
    if (s.pending) {
      await prisma.startupMilestone.create({
        data: {
          project_id: project.project_id, target_stage: s.pending, evidence_url: `https://drive.google.com/file/d/startup-stage-${s.pending}`,
          details: { fields: { documentLink: `https://drive.google.com/file/d/startup-stage-${s.pending}` }, documents: [] }, status: ClaimStatus.PENDING, created_at: daysAgo(2),
        },
      });
    }
  }

  // ---- Student GPU requests ------------------------------------------------

  const gpuRequests: { email: string; title: string; purpose: string; justification: string; credits: number; allocated?: number; status: RequestStatus; mentorComment?: string; adminComment?: string; ago: number }[] = [
    { email: "student@sece.ac.in", title: "Fine-tune YOLOv8 on textile defect dataset", purpose: "Industry problem", justification: "12k images at 1280px; training on a laptop GPU takes ~30 h per run. Need A100 time for 5 runs of hyper-parameter search.", credits: 40, allocated: 40, status: RequestStatus.ALLOCATED, mentorComment: "Recommended — good progress on the industry problem.", adminComment: "Allocated 40 credits on DGX node 2.", ago: 20 },
    { email: "student@sece.ac.in", title: "LoRA fine-tuning of Llama-3-8B for Tamil agri Q&A", purpose: "Startup", justification: "KrishiVision needs a Tamil-capable assistant; LoRA on 8B needs ~40 GB VRAM.", credits: 60, status: RequestStatus.SUBMITTED, ago: 1 },
    { email: "arun.kumar@sece.ac.in", title: "Train LSTM-autoencoder on CNC telemetry", purpose: "Industry problem", justification: "6 months × 24 machines of 1 kHz data; needs GPU for feasible training time.", credits: 80, allocated: 80, status: RequestStatus.COMPLETED, mentorComment: "Recommended.", adminComment: "Completed — report received.", ago: 40 },
    { email: "harish.venkatesh@sece.ac.in", title: "Multi-GPU training for LoomSense detector", purpose: "Startup", justification: "Scaling to 4 defect classes and 50k images for the pilot with a partner mill.", credits: 120, allocated: 120, status: RequestStatus.ALLOCATED, mentorComment: "Strongly recommended — pilot is live.", adminComment: "Allocated 120 credits across 2 nodes.", ago: 15 },
    { email: "divya.lakshmi@sece.ac.in", title: "Code-mixed Tamil intent classifier", purpose: "Industry problem", justification: "Fine-tune IndicBERT on 40k labelled utterances.", credits: 30, status: RequestStatus.MENTOR_RECOMMENDED, mentorComment: "Recommended — scope is clear.", ago: 3 },
    { email: "nandhini.r@sece.ac.in", title: "Temporal Fusion Transformer for campus load", purpose: "Industry problem", justification: "Hyper-parameter sweep over 14 buildings.", credits: 20, allocated: 10, status: RequestStatus.APPROVED, mentorComment: "Recommended.", adminComment: "Approved 10 credits — TFT sweep can be reduced.", ago: 6 },
    { email: "keerthana.s@sece.ac.in", title: "Stable Diffusion experiments", purpose: "Personal learning", justification: "Want to try image generation.", credits: 50, status: RequestStatus.REJECTED, mentorComment: "Not linked to a course or project yet.", adminComment: "Rejected — please attach a project plan and reapply.", ago: 9 },
    { email: "vishal.anand@sece.ac.in", title: "OCR + layout model for receipts", purpose: "Startup", justification: "Train a LayoutLMv3 model on 8k receipt images.", credits: 60, allocated: 60, status: RequestStatus.ALLOCATED, mentorComment: "Recommended.", adminComment: "Allocated.", ago: 11 },
    { email: "mohammed.irfan@sece.ac.in", title: "CNN coursework experiments", purpose: "Course", justification: "Practice assignments from Fundamentals of Deep Learning.", credits: 10, status: RequestStatus.DRAFT, ago: 0 },
  ];
  for (const g of gpuRequests) {
    const reviewed = g.status !== RequestStatus.DRAFT && g.status !== RequestStatus.SUBMITTED;
    await prisma.gpuRequest.create({
      data: {
        student_id: sid(g.email), title: g.title, purpose: g.purpose, justification: g.justification, requested_credits: g.credits, allocated_credits: g.allocated,
        status: g.status, mentor_comment: g.mentorComment, admin_comment: g.adminComment,
        reviewed_by: reviewed ? (g.adminComment ? admin : mentorMain) : null, reviewed_at: reviewed ? daysAgo(Math.max(0, g.ago - 1)) : null,
        created_at: daysAgo(g.ago, 12),
      },
    });
  }

  // ---- Industry GPU requests (companies, managed by admin) ----------------

  const industryGpu = [
    { company: "Kovai Weaves Pvt. Ltd.", contact: "R. Senthil Kumar", email: "senthil@kovaiweaves.example.com", phone: "+91 98430 11223", website: "https://kovaiweaves.example.com", sector: "Textiles & Manufacturing", useCase: "Retrain the loom defect-detection model on 3 new fabric types before festival-season production.", gpuType: "NVIDIA A100 80GB", count: 2, hours: 120, duration: "3 weeks", status: "APPROVED", notes: "Slot confirmed on DGX node 1, Oct 5–26. MoU signed.", ago: 12 },
    { company: "MedScan Diagnostics", contact: "Dr. Anitha Rajan", email: "anitha@medscan.example.com", phone: "+91 94421 55678", website: "https://medscan.example.com", sector: "Healthcare", useCase: "Train a chest X-ray triage classifier on 60k de-identified images for a pilot with two district hospitals.", gpuType: "NVIDIA A100 80GB", count: 4, hours: 200, duration: "1 month", status: "UNDER_REVIEW", notes: "Awaiting data-privacy undertaking and ethics committee letter.", ago: 5 },
    { company: "GreenField AgriTech", contact: "Balaji Natarajan", email: "balaji@greenfield.example.com", phone: "+91 90030 44871", website: "https://greenfieldagri.example.com", sector: "Agriculture", useCase: "Satellite-image crop yield estimation for 1,200 villages in western Tamil Nadu.", gpuType: "NVIDIA A100 40GB", count: 1, hours: 60, duration: "2 weeks", status: "NEW", notes: null, ago: 1 },
    { company: "Precision Tooling Works", contact: "Suresh Babu", email: "suresh@ptw.example.com", phone: "+91 98945 22109", website: null, sector: "Manufacturing", useCase: "Benchmark the student-built CNC predictive-maintenance model on the full 3-year telemetry archive.", gpuType: "NVIDIA A100 40GB", count: 1, hours: 40, duration: "1 week", status: "FULFILLED", notes: "Completed Sep 2026. Results shared with the student team; follow-up pilot discussed.", ago: 35 },
    { company: "LinguaBridge AI", contact: "Farhan Ali", email: "farhan@linguabridge.example.com", phone: "+91 73977 66120", website: "https://linguabridge.example.com", sector: "NLP / Language Tech", useCase: "Continued pre-training of a 7B model on Tamil and Malayalam web corpus.", gpuType: "NVIDIA H100", count: 8, hours: 500, duration: "6 weeks", status: "REJECTED", notes: "Requirement exceeds available capacity (no H100s; would block student labs). Suggested a cloud partner.", ago: 20 },
    { company: "Nilgiri Retail Networks", contact: "Kavya Sundaram", email: "kavya@nilgiriretail.example.com", phone: "+91 99442 30017", website: "https://nilgiriretail.example.com", sector: "Retail", useCase: "Evaluate the bilingual support assistant built by SECE students against 10k historical support tickets.", gpuType: "NVIDIA A100 40GB", count: 1, hours: 24, duration: "3 days", status: "NEW", notes: null, ago: 0 },
    { company: "Sakthi Smart Mobility", contact: "Gokul Prasad", email: "gokul@sakthimobility.example.com", phone: "+91 95858 71234", website: null, sector: "Automotive", useCase: "Train a driver-drowsiness detection model for fleet dashcams.", gpuType: "NVIDIA A100 80GB", count: 2, hours: 80, duration: "2 weeks", status: "UNDER_REVIEW", notes: "Asked for dataset consent documentation.", ago: 7 },
  ];
  for (const r of industryGpu) {
    await prisma.industryGpuRequest.create({
      data: {
        company_name: r.company, contact_person: r.contact, contact_email: r.email, contact_phone: r.phone, website: r.website, sector: r.sector,
        use_case: r.useCase, gpu_type: r.gpuType, gpu_count: r.count, hours_needed: r.hours, duration: r.duration, status: r.status,
        admin_notes: r.notes, created_by: admin, created_at: daysAgo(r.ago, 11),
      },
    });
  }

  // ---- Notifications ---------------------------------------------------------

  const notify = (email: string, type: NotificationType, title: string, message: string, ago: number, read = false) =>
    prisma.notification.create({ data: { user_id: sid(email), type, title, message, created_at: daysAgo(ago, 12), read_at: read ? daysAgo(ago, 18) : null } });

  await notify("student@sece.ac.in", NotificationType.SYSTEM, "Welcome to the AI Digital Passport", "Attend CoE classes, complete courses and solve industry problems to level up.", 60, true);
  await notify("student@sece.ac.in", NotificationType.CLAIM_APPROVED, "Course approved", "Machine Learning Specialization approved — +80 points.", 24, true);
  await notify("student@sece.ac.in", NotificationType.CLAIM_REJECTED, "Claim rejected", "Industry Project / Hackathon Win: this is a participation certificate, not a winner certificate.", 12, true);
  await notify("student@sece.ac.in", NotificationType.CLAIM_APPROVED, "Problem solution stage approved", "Visual Defect Detection on Textile Looms — Stage 2 approved.", 13);
  await notify("student@sece.ac.in", NotificationType.CLAIM_REJECTED, "Course submission rejected", "Deep Learning for Computer Vision: certificate name doesn't match your registered name.", 10);
  await notify("student@sece.ac.in", NotificationType.SYSTEM, "GPU Friday Lab is live", "RAPIDS cuDF lab has started in Code Studio — scan the QR to check in.", 0);
  await notify("arun.kumar@sece.ac.in", NotificationType.LEVEL_UP, "Level up!", "You reached AI Builder.", 30, true);
  await notify("harish.venkatesh@sece.ac.in", NotificationType.LEVEL_UP, "Level up!", "You reached AI Innovator.", 35, true);
  await notify("mohammed.irfan@sece.ac.in", NotificationType.CLAIM_REJECTED, "Claim rejected", "Certificate link is private — please make it public and resubmit.", 8);

  await prisma.notification.create({
    data: { user_id: mentorMain, type: NotificationType.MENTOR_REVIEW_REMINDER, title: "Pending reviews", message: "You have course submissions, claims and problem stages awaiting review.", created_at: daysAgo(0, 9) },
  });
  await prisma.notification.create({
    data: { user_id: mentorPriya, type: NotificationType.SYSTEM, title: "Proctoring session locked", message: "Divya Lakshmi's CUDA assessment was locked after 4 violations — grant access if appropriate.", created_at: daysAgo(1, 15) },
  });
}

// total_points = sum of the ledger; level = highest level whose threshold is met.
async function recomputeStudentTotals() {
  const sums = await prisma.pointsTransaction.groupBy({ by: ["user_id"], _sum: { points: true } });
  const byUser = new Map(sums.map((s) => [s.user_id, s._sum.points ?? 0]));
  const students = await prisma.student.findMany({ select: { user_id: true } });
  for (const s of students) {
    const total = byUser.get(s.user_id) ?? 0;
    const eligible = LEVEL_DEFINITIONS.filter((l) => total >= l.minPoints && !l.requiresHighImpact);
    const levelId = eligible.length ? eligible[eligible.length - 1]!.levelId : 1;
    await prisma.student.update({ where: { user_id: s.user_id }, data: { total_points: total, current_level_id: levelId } });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
