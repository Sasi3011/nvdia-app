import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@ai-digital-passport/database";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
]);
const MAX_SIZE_BYTES = 15 * 1024 * 1024;

@Injectable()
export class UploadsService {
  validatePdf(params: { mimeType: string; sizeBytes: number }) {
    if (!ALLOWED_MIME_TYPES.has(params.mimeType)) {
      throw new BadRequestException({ code: "UNSUPPORTED_FILE_TYPE", message: "Only PDF, image (PNG/JPG/WEBP), Excel/CSV, PPT/PPTX or DOC/DOCX files are accepted." });
    }
    if (params.sizeBytes <= 0 || params.sizeBytes > MAX_SIZE_BYTES) {
      throw new BadRequestException({ code: "FILE_TOO_LARGE", message: "File must be under 15MB." });
    }
  }

  async savePdf(params: { userId: string; fileName: string; mimeType: string; sizeBytes: number; base64Data: string; entityType?: string; entityId?: string }) {
    this.validatePdf(params);
    const buffer = Buffer.from(params.base64Data, "base64");
    if (buffer.length !== params.sizeBytes) {
      throw new BadRequestException({ code: "FILE_SIZE_MISMATCH", message: "Uploaded file size does not match the declared size." });
    }

    const file = await prisma.storedFile.create({
      data: {
        original_name: params.fileName,
        mime_type: params.mimeType,
        size_bytes: params.sizeBytes,
        file_data: buffer,
        entity_type: params.entityType ?? null,
        entity_id: params.entityId ?? null,
        uploaded_by: params.userId,
      },
    });

    return { fileKey: file.file_id, fileName: file.original_name, mimeType: file.mime_type, sizeBytes: file.size_bytes };
  }

  async getStoredFile(fileKey: string) {
    const file = await prisma.storedFile.findUnique({ where: { file_id: fileKey } });
    if (!file) throw new NotFoundException({ code: "FILE_NOT_FOUND" });
    return file;
  }

  async presignClaimUpload(params: { userId: string; fileName: string; mimeType: string; sizeBytes: number }) {
    this.validatePdf(params);
    return {
      uploadUrl: "",
      fileKey: "",
      expiresInSeconds: 0,
      directUploadRequired: true,
      message: "This app stores PDFs in PostgreSQL. Use POST /uploads/files with base64Data.",
    };
  }

  async presignDownload(fileKey: string) {
    await this.getStoredFile(fileKey);
    return { downloadUrl: `/uploads/files/${fileKey}`, expiresInSeconds: 300 };
  }
}
