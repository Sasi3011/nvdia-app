CREATE TABLE "access_whitelist" (
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "department" TEXT NOT NULL DEFAULT '',
    "year" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AUTHORIZED',
    "source" TEXT NOT NULL DEFAULT 'Manual Admin Entry',
    "added_by" TEXT,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_whitelist_pkey" PRIMARY KEY ("email")
);

CREATE INDEX "access_whitelist_role_idx" ON "access_whitelist"("role");
CREATE INDEX "access_whitelist_status_idx" ON "access_whitelist"("status");

-- Existing accounts keep working: everyone already in users is authorized with their current highest role.
INSERT INTO "access_whitelist" ("email", "full_name", "role", "department", "year", "status", "source")
SELECT
    lower(u."email"),
    u."full_name",
    CASE
        WHEN EXISTS (SELECT 1 FROM "user_roles" ur JOIN "roles" r ON r."role_id" = ur."role_id" WHERE ur."user_id" = u."user_id" AND r."name"::text = 'ADMIN') THEN 'ADMIN'
        WHEN EXISTS (SELECT 1 FROM "user_roles" ur JOIN "roles" r ON r."role_id" = ur."role_id" WHERE ur."user_id" = u."user_id" AND r."name"::text = 'MENTOR') THEN 'MENTOR'
        ELSE 'STUDENT'
    END,
    u."department",
    u."cohort_year"::text,
    'AUTHORIZED',
    'Existing account'
FROM "users" u
ON CONFLICT ("email") DO NOTHING;

-- Quick-select login accounts shown on the sign-in card.
INSERT INTO "access_whitelist" ("email", "full_name", "role", "department", "status", "source") VALUES
    ('admin@sece.ac.in', 'Chief Administrator', 'ADMIN', 'NVIDIA Supercomputing Centre', 'AUTHORIZED', 'System account'),
    ('mentor@sece.ac.in', 'Faculty AI Mentor', 'MENTOR', 'B.E CSE', 'AUTHORIZED', 'System account'),
    ('student@sece.ac.in', 'AI Research Scholar', 'STUDENT', 'Computer Science & Engineering', 'AUTHORIZED', 'System account')
ON CONFLICT ("email") DO NOTHING;
