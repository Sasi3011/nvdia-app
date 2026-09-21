ALTER TABLE "award_nominations" ADD COLUMN "requested_by" TEXT, ADD COLUMN "reason" TEXT, ADD COLUMN "admin_note" TEXT;
CREATE INDEX "award_nominations_requested_by_idx" ON "award_nominations"("requested_by");
