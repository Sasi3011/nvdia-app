/*
  Warnings:

  - Added the required column `category` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "events" ADD COLUMN     "category" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "events_category_idx" ON "events"("category");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_category_fkey" FOREIGN KEY ("category") REFERENCES "scoring_rules"("category") ON DELETE RESTRICT ON UPDATE CASCADE;
