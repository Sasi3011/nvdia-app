-- CreateEnum
CREATE TYPE "OtaPlatform" AS ENUM ('ANDROID', 'IOS');

-- CreateTable
CREATE TABLE "ota_bundles" (
    "bundle_id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "platform" "OtaPlatform" NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'production',
    "version" TEXT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "checksum" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ota_bundles_pkey" PRIMARY KEY ("bundle_id")
);

-- CreateIndex
CREATE INDEX "ota_bundles_app_id_platform_channel_active_idx" ON "ota_bundles"("app_id", "platform", "channel", "active");

-- CreateIndex
CREATE UNIQUE INDEX "ota_bundles_app_id_platform_channel_version_key" ON "ota_bundles"("app_id", "platform", "channel", "version");

-- AddForeignKey
ALTER TABLE "ota_bundles" ADD CONSTRAINT "ota_bundles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
