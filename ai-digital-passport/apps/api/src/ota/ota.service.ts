import { randomUUID } from "node:crypto";
import { BadRequestException, Injectable } from "@nestjs/common";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { OtaPlatform, prisma } from "@ai-digital-passport/database";
import { AuditLogService } from "../common/audit-log/audit-log.service";

/**
 * OTA update server for @capgo/capacitor-updater, self-hosted (Phase 8).
 *
 * The wire contract below (request field names, response shape) is
 * reverse-verified from the plugin's own Android source
 * (CapgoUpdater.java — createInfoObject() / getLatest()), not guessed or
 * taken from marketing docs: the native plugin POSTs a flat JSON body
 * with `platform`, `app_id`, `version_name` (the currently-active bundle
 * version), `channel`/`defaultChannel`, plus device metadata we don't
 * need, and expects back `{ version, url, checksum? }` when a newer
 * bundle exists, or `{ version, message: "No new version available" }`
 * when it's already current.
 */
@Injectable()
export class OtaService {
  private readonly s3 = new S3Client({ region: process.env.AWS_REGION ?? "ap-south-1" });

  constructor(private readonly auditLogService: AuditLogService) {}

  async checkForUpdate(params: {
    appId: string;
    platform: OtaPlatform;
    channel: string;
    currentVersion: string;
  }): Promise<{ version: string; url?: string; checksum?: string; message?: string }> {
    const latest = await prisma.otaBundle.findFirst({
      where: { app_id: params.appId, platform: params.platform, channel: params.channel, active: true },
      orderBy: { created_at: "desc" },
    });

    if (!latest || latest.version === params.currentVersion) {
      return { version: params.currentVersion, message: "No new version available" };
    }

    const bucket = this.requireBucket();
    const url = await getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: bucket, Key: latest.s3_key }),
      { expiresIn: 3600 },
    );

    return { version: latest.version, url, checksum: latest.checksum ?? undefined };
  }

  async listBundles(appId?: string) {
    return prisma.otaBundle.findMany({
      where: appId ? { app_id: appId } : undefined,
      orderBy: { created_at: "desc" },
      take: 100,
    });
  }

  // Step 1 of publishing: presign an S3 PUT for the built bundle zip.
  async presignPublish(params: { appId: string; platform: OtaPlatform; channel: string; version: string; fileName: string }) {
    const bucket = this.requireBucket();
    const s3Key = `ota/${params.appId}/${params.platform.toLowerCase()}/${params.channel}/${params.version}-${randomUUID()}-${params.fileName}`;
    const uploadUrl = await getSignedUrl(
      this.s3,
      new PutObjectCommand({ Bucket: bucket, Key: s3Key, ContentType: "application/zip" }),
      { expiresIn: 300 },
    );
    return { uploadUrl, s3Key, expiresInSeconds: 300 };
  }

  // Step 2 of publishing: register the uploaded bundle as the new active
  // version for this app+platform+channel (deactivating whatever was
  // active before — one active bundle per channel at a time keeps "what
  // will a device get right now" unambiguous).
  async registerBundle(
    actorId: string | null,
    params: {
      appId: string;
      platform: OtaPlatform;
      channel: string;
      version: string;
      s3Key: string;
      sizeBytes: number;
      checksum?: string;
      notes?: string;
    },
  ) {
    const bundle = await prisma.$transaction(async (tx) => {
      await tx.otaBundle.updateMany({
        where: { app_id: params.appId, platform: params.platform, channel: params.channel, active: true },
        data: { active: false },
      });
      return tx.otaBundle.create({
        data: {
          app_id: params.appId,
          platform: params.platform,
          channel: params.channel,
          version: params.version,
          s3_key: params.s3Key,
          size_bytes: params.sizeBytes,
          checksum: params.checksum,
          notes: params.notes,
          active: true,
          created_by: actorId,
        },
      });
    });

    await this.auditLogService.record({
      actorId,
      action: "OTA_BUNDLE_PUBLISHED",
      entityType: "ota_bundle",
      entityId: bundle.bundle_id,
      metadata: { appId: params.appId, platform: params.platform, channel: params.channel, version: params.version },
    });

    return bundle;
  }

  async deactivate(actorId: string | null, bundleId: string) {
    const bundle = await prisma.otaBundle.update({ where: { bundle_id: bundleId }, data: { active: false } });
    await this.auditLogService.record({
      actorId,
      action: "OTA_BUNDLE_DEACTIVATED",
      entityType: "ota_bundle",
      entityId: bundleId,
    });
    return bundle;
  }

  private requireBucket(): string {
    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) {
      throw new BadRequestException({ code: "STORAGE_NOT_CONFIGURED", message: "AWS_S3_BUCKET is not set." });
    }
    return bucket;
  }
}
