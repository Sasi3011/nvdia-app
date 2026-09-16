CREATE TABLE "stored_files" (
    "file_id" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "file_data" BYTEA NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "uploaded_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stored_files_pkey" PRIMARY KEY ("file_id")
);

CREATE INDEX "stored_files_entity_type_entity_id_idx" ON "stored_files"("entity_type", "entity_id");
CREATE INDEX "stored_files_uploaded_by_idx" ON "stored_files"("uploaded_by");

ALTER TABLE "stored_files" ADD CONSTRAINT "stored_files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
