-- CreateTable
CREATE TABLE "class_teaching_logs" (
    "log_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "mentor_id" TEXT NOT NULL,
    "class_date" TIMESTAMP(3) NOT NULL,
    "topics_covered" TEXT NOT NULL,
    "materials_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_teaching_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateIndex
CREATE INDEX "class_teaching_logs_event_id_idx" ON "class_teaching_logs"("event_id");

-- CreateIndex
CREATE INDEX "class_teaching_logs_mentor_id_idx" ON "class_teaching_logs"("mentor_id");

-- AddForeignKey
ALTER TABLE "class_teaching_logs" ADD CONSTRAINT "class_teaching_logs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("event_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_teaching_logs" ADD CONSTRAINT "class_teaching_logs_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
