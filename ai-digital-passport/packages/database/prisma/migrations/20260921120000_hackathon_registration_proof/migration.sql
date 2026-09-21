ALTER TABLE "external_hackathon_registrations" ADD COLUMN "claim_id" TEXT;
CREATE UNIQUE INDEX "external_hackathon_registrations_claim_id_key" ON "external_hackathon_registrations"("claim_id");
