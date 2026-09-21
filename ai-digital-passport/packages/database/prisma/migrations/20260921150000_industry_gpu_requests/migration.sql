CREATE TABLE "industry_gpu_requests" (
    "request_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "contact_person" TEXT NOT NULL,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "website" TEXT,
    "sector" TEXT,
    "use_case" TEXT NOT NULL,
    "gpu_type" TEXT,
    "gpu_count" INTEGER,
    "hours_needed" INTEGER,
    "duration" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "admin_notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "industry_gpu_requests_pkey" PRIMARY KEY ("request_id")
);

CREATE INDEX "industry_gpu_requests_status_idx" ON "industry_gpu_requests"("status");
