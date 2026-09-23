-- Split role-specific fields out of "users" into per-role profile tables
-- (students, faculty, admins). "users" keeps only the shared login identity,
-- so every existing foreign key to users.user_id is unchanged.

-- CreateTable
CREATE TABLE "students" (
    "student_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "register_num" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "cohort_year" INTEGER NOT NULL,
    "current_level_id" INTEGER NOT NULL DEFAULT 1,
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "gpu_credit_balance" INTEGER NOT NULL DEFAULT 0,
    "high_impact_flag" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("student_id")
);

-- CreateTable
CREATE TABLE "faculty" (
    "faculty_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "employee_id" TEXT,
    "department" TEXT NOT NULL,
    "designation" TEXT,
    "mentor_department" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faculty_pkey" PRIMARY KEY ("faculty_id")
);

-- CreateTable
CREATE TABLE "admins" (
    "admin_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "employee_id" TEXT,
    "designation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("admin_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");
CREATE UNIQUE INDEX "students_register_num_key" ON "students"("register_num");
CREATE INDEX "students_current_level_id_idx" ON "students"("current_level_id");
CREATE INDEX "students_department_idx" ON "students"("department");
CREATE UNIQUE INDEX "faculty_user_id_key" ON "faculty"("user_id");
CREATE UNIQUE INDEX "faculty_employee_id_key" ON "faculty"("employee_id");
CREATE INDEX "faculty_mentor_department_idx" ON "faculty"("mentor_department");
CREATE UNIQUE INDEX "admins_user_id_key" ON "admins"("user_id");
CREATE UNIQUE INDEX "admins_employee_id_key" ON "admins"("employee_id");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "students" ADD CONSTRAINT "students_current_level_id_fkey" FOREIGN KEY ("current_level_id") REFERENCES "levels"("level_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "faculty" ADD CONSTRAINT "faculty_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "admins" ADD CONSTRAINT "admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Copy existing data into the profile tables, based on each user's roles.
-- The register number entered at onboarding becomes the employee ID for
-- faculty and admins.
INSERT INTO "students" ("student_id", "user_id", "register_num", "department", "cohort_year",
    "current_level_id", "total_points", "gpu_credit_balance", "high_impact_flag", "created_at", "updated_at")
SELECT gen_random_uuid()::text, u."user_id", u."register_num", u."department", u."cohort_year",
    u."current_level_id", u."total_points", u."gpu_credit_balance", u."high_impact_flag", u."created_at", u."updated_at"
FROM "users" u
WHERE EXISTS (SELECT 1 FROM "user_roles" ur JOIN "roles" r ON r."role_id" = ur."role_id"
              WHERE ur."user_id" = u."user_id" AND r."name" = 'STUDENT');

INSERT INTO "faculty" ("faculty_id", "user_id", "employee_id", "department", "mentor_department", "created_at", "updated_at")
SELECT gen_random_uuid()::text, u."user_id", u."register_num", u."department", u."mentor_department", u."created_at", u."updated_at"
FROM "users" u
WHERE EXISTS (SELECT 1 FROM "user_roles" ur JOIN "roles" r ON r."role_id" = ur."role_id"
              WHERE ur."user_id" = u."user_id" AND r."name" = 'MENTOR');

INSERT INTO "admins" ("admin_id", "user_id", "employee_id", "created_at", "updated_at")
SELECT gen_random_uuid()::text, u."user_id", u."register_num", u."created_at", u."updated_at"
FROM "users" u
WHERE EXISTS (SELECT 1 FROM "user_roles" ur JOIN "roles" r ON r."role_id" = ur."role_id"
              WHERE ur."user_id" = u."user_id" AND r."name" = 'ADMIN');

-- Drop the moved columns from "users".
ALTER TABLE "users" DROP CONSTRAINT "users_current_level_id_fkey";
DROP INDEX "users_current_level_id_idx";
DROP INDEX "users_mentor_department_idx";
DROP INDEX "users_register_num_key";
ALTER TABLE "users" DROP COLUMN "cohort_year",
DROP COLUMN "current_level_id",
DROP COLUMN "department",
DROP COLUMN "gpu_credit_balance",
DROP COLUMN "high_impact_flag",
DROP COLUMN "mentor_department",
DROP COLUMN "register_num",
DROP COLUMN "total_points";
