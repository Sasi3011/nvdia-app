-- CreateTable
CREATE TABLE "external_hackathons" (
    "external_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "source_ref" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL,
    "image_url" TEXT,
    "organizer" TEXT,
    "location" TEXT,
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "prize" TEXT,
    "tags" TEXT[],
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "deadline_at" TIMESTAMP(3),
    "added_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_hackathons_pkey" PRIMARY KEY ("external_id")
);

-- CreateIndex
CREATE INDEX "external_hackathons_ends_at_idx" ON "external_hackathons"("ends_at");

-- CreateIndex
CREATE UNIQUE INDEX "external_hackathons_source_source_ref_key" ON "external_hackathons"("source", "source_ref");
