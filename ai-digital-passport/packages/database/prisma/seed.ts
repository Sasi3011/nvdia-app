/**
 * Seeds configurable domain data: the six levels and the scoring matrix.
 * The values themselves live in packages/shared-types (single source of
 * truth for both apps and this seed) — see that package's src/enums.ts
 * for the spec references and the Level 6 "High Impact" open-decision
 * note.
 */
import { PrismaClient } from "@prisma/client";
import { LEVEL_DEFINITIONS, SCORING_MATRIX, UserRole } from "@ai-digital-passport/shared-types";

const prisma = new PrismaClient();

async function main() {
  for (const role of Object.values(UserRole)) {
    await prisma.role.upsert({
      where: { name: role },
      update: {},
      create: { name: role },
    });
  }

  for (const level of LEVEL_DEFINITIONS) {
    await prisma.level.upsert({
      where: { level_id: level.levelId },
      update: {
        level_name: level.levelName,
        min_points: level.minPoints,
        unlocked_privilege: level.unlockedPrivilege,
        requires_high_impact: level.requiresHighImpact,
      },
      create: {
        level_id: level.levelId,
        level_name: level.levelName,
        min_points: level.minPoints,
        unlocked_privilege: level.unlockedPrivilege,
        requires_high_impact: level.requiresHighImpact,
      },
    });
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

  await seedDemoAccounts();
  await seedDemoCoeClasses();
}

// Demo accounts for local testing/demos — sign in with these emails via the
// login page's "Quick Select" role pills (or type the email directly), the
// same dev-login flow the built-in student@/mentor@/admin@sece.ac.in
// accounts use. Password is DEV_LOGIN_PASSWORD (defaults to "password123").
// Fully onboarded (User + Student/Faculty + role granted) so no manual
// onboarding step is needed after first login.
async function seedDemoAccounts() {
  const roleRows = await prisma.role.findMany();
  const roleIdByName = new Map(roleRows.map((r) => [r.name, r.role_id]));

  function levelForPoints(points: number): number {
    const eligible = LEVEL_DEFINITIONS.filter((l) => points >= l.minPoints);
    return eligible.length ? eligible[eligible.length - 1]!.levelId : 1;
  }

  const currentYear = new Date().getFullYear();

  const demoStudents = [
    { email: "student.year1@sece.ac.in", fullName: "Demo Student — Year 1", department: "B.E CSE", year: "1st Year", cohortYear: currentYear, totalPoints: 350 },
    { email: "student.year2@sece.ac.in", fullName: "Demo Student — Year 2", department: "B.E AIML(CSE)", year: "2nd Year", cohortYear: currentYear - 1, totalPoints: 900 },
    { email: "student.year3@sece.ac.in", fullName: "Demo Student — Year 3", department: "B.E ECE", year: "3rd Year", cohortYear: currentYear - 2, totalPoints: 2200 },
    { email: "student.year4@sece.ac.in", fullName: "Demo Student — Year 4", department: "B.Tech AIDS", year: "4th Year", cohortYear: currentYear - 3, totalPoints: 5200 },
  ];

  const demoMentors = [
    { email: "mentor.cse@sece.ac.in", fullName: "Demo Mentor — CSE", department: "B.E CSE" },
    { email: "mentor.aiml@sece.ac.in", fullName: "Demo Mentor — AIML", department: "B.E AIML(CSE)" },
    { email: "mentor.ece@sece.ac.in", fullName: "Demo Mentor — ECE", department: "B.E ECE" },
    { email: "mentor.mech@sece.ac.in", fullName: "Demo Mentor — MECH", department: "B.E MECH" },
    { email: "mentor.it@sece.ac.in", fullName: "Demo Mentor — IT", department: "B.Tech IT" },
  ];

  for (const s of demoStudents) {
    await prisma.accessWhitelist.upsert({
      where: { email: s.email },
      update: { full_name: s.fullName, role: "STUDENT", department: s.department, year: s.year, status: "AUTHORIZED" },
      create: {
        email: s.email, full_name: s.fullName, role: "STUDENT", department: s.department, year: s.year,
        status: "AUTHORIZED", source: "Demo seed",
      },
    });

    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: { full_name: s.fullName },
      create: { email: s.email, full_name: s.fullName },
    });

    const levelId = levelForPoints(s.totalPoints);
    await prisma.student.upsert({
      where: { user_id: user.user_id },
      update: { department: s.department, cohort_year: s.cohortYear, total_points: s.totalPoints, current_level_id: levelId },
      create: {
        user_id: user.user_id, register_num: s.email.split("@")[0]!.toUpperCase(), department: s.department,
        cohort_year: s.cohortYear, total_points: s.totalPoints, current_level_id: levelId,
      },
    });

    const roleId = roleIdByName.get(UserRole.STUDENT);
    if (roleId) {
      await prisma.userRole.upsert({
        where: { user_id_role_id: { user_id: user.user_id, role_id: roleId } },
        update: {},
        create: { user_id: user.user_id, role_id: roleId },
      });
    }
  }

  for (const m of demoMentors) {
    await prisma.accessWhitelist.upsert({
      where: { email: m.email },
      update: { full_name: m.fullName, role: "MENTOR", department: m.department, status: "AUTHORIZED" },
      create: {
        email: m.email, full_name: m.fullName, role: "MENTOR", department: m.department,
        status: "AUTHORIZED", source: "Demo seed",
      },
    });

    const user = await prisma.user.upsert({
      where: { email: m.email },
      update: { full_name: m.fullName },
      create: { email: m.email, full_name: m.fullName },
    });

    await prisma.faculty.upsert({
      where: { user_id: user.user_id },
      update: { department: m.department, mentor_department: m.department },
      create: {
        user_id: user.user_id, employee_id: m.email.split("@")[0]!.toUpperCase(), department: m.department,
        mentor_department: m.department,
      },
    });

    const roleId = roleIdByName.get(UserRole.MENTOR);
    if (roleId) {
      await prisma.userRole.upsert({
        where: { user_id_role_id: { user_id: user.user_id, role_id: roleId } },
        update: {},
        create: { user_id: user.user_id, role_id: roleId },
      });
    }
  }
}

// Demo CoE Class schedule — one class per year, showing on the student CoE
// Classes page. Year is display metadata only (no department filter
// anywhere in the app — see events.service.ts), so each is visible to
// every student regardless of department, exactly like admin-created
// classes. Idempotent: skipped if a class with the same title already
// exists, so re-running seed never duplicates them.
async function seedDemoCoeClasses() {
  const creator = await prisma.user.findUnique({ where: { email: "admin@sece.ac.in" } });
  const now = Date.now();
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;

  const demoClasses = [
    {
      title: "AI Foundations Tech Eve",
      description: "Kickoff Tech Eve session covering the AI Digital Passport program, levels, and how to start earning points.",
      category: "tech_eve_masterclass",
      year: "1st Year",
      location: "IT Centre",
      sessionType: "Forenoon",
      startsAt: new Date(now + DAY),
      endsAt: new Date(now + DAY + 1.5 * HOUR),
    },
    {
      title: "GPU Friday Lab — CUDA Basics",
      description: "Hands-on CUDA programming lab on the DGX cluster: kernels, memory hierarchy, and a simple parallel reduction.",
      category: "gpu_friday_lab",
      year: "2nd Year",
      location: "Code Studio",
      sessionType: "Afternoon",
      // Live right now, so the demo schedule shows a "Live Now" class with a scannable QR.
      startsAt: new Date(now - 30 * 60 * 1000),
      endsAt: new Date(now + 90 * 60 * 1000),
    },
    {
      title: "NPTEL Course Completion Review",
      description: "Review session for students submitting NPTEL/Coursera completion certificates this cycle.",
      category: "course_completion",
      year: "3rd Year",
      location: "Collab Space",
      sessionType: "Forenoon",
      startsAt: new Date(now - DAY - 2 * HOUR),
      endsAt: new Date(now - DAY),
    },
    {
      title: "Capstone Hackathon Prep",
      description: "Prep session for final-year capstone teams entering the industry hackathon track.",
      category: "certification_project_hackathon",
      year: "4th Year",
      location: "Full Stack Lab",
      sessionType: "Afternoon",
      startsAt: new Date(now + 7 * DAY),
      endsAt: new Date(now + 7 * DAY + 2 * HOUR),
    },
  ];

  for (const c of demoClasses) {
    const existing = await prisma.event.findFirst({ where: { title: c.title } });
    if (existing) continue;

    await prisma.event.create({
      data: {
        title: c.title,
        description: c.description,
        location: c.location,
        category: c.category,
        year: c.year,
        session_type: c.sessionType,
        starts_at: c.startsAt,
        ends_at: c.endsAt,
        created_by: creator?.user_id,
        sessions: {
          create: {
            title: c.title,
            starts_at: c.startsAt,
            ends_at: c.endsAt,
          },
        },
      },
    });
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
