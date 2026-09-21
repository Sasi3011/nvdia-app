ALTER TABLE "external_hackathons" ADD COLUMN "register_points" INTEGER NOT NULL DEFAULT 20;
ALTER TABLE "external_hackathons" ADD COLUMN "locked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "external_hackathons" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "external_hackathon_registrations" (
    "registration_id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "points_awarded" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "external_hackathon_registrations_pkey" PRIMARY KEY ("registration_id")
);

CREATE INDEX "external_hackathon_registrations_user_id_idx" ON "external_hackathon_registrations"("user_id");
CREATE UNIQUE INDEX "external_hackathon_registrations_external_id_user_id_key" ON "external_hackathon_registrations"("external_id", "user_id");
ALTER TABLE "external_hackathon_registrations" ADD CONSTRAINT "external_hackathon_registrations_external_id_fkey" FOREIGN KEY ("external_id") REFERENCES "external_hackathons"("external_id") ON DELETE CASCADE ON UPDATE CASCADE;
