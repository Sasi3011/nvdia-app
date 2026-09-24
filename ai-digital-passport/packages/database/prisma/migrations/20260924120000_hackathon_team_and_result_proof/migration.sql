-- Hackathon registration now records the team, and after registration is
-- verified the student submits a participation or winner proof, which
-- faculty verify through its own activity claim.
ALTER TABLE "external_hackathon_registrations" ADD COLUMN IF NOT EXISTS "team_name" TEXT;
ALTER TABLE "external_hackathon_registrations" ADD COLUMN IF NOT EXISTS "team_members" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "external_hackathon_registrations" ADD COLUMN IF NOT EXISTS "result_type" TEXT;
ALTER TABLE "external_hackathon_registrations" ADD COLUMN IF NOT EXISTS "result_claim_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "external_hackathon_registrations_result_claim_id_key" ON "external_hackathon_registrations"("result_claim_id");
