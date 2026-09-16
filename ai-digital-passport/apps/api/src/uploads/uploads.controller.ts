import { Body, Controller, Get, Header, Param, Post, Res } from "@nestjs/common";
import type { Response } from "express";
import { z } from "zod";
import { CurrentUser } from "../common/auth/current-user.decorator";
import type { RequestUser } from "../common/auth/types";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { UploadsService } from "./uploads.service";

const UploadFileSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  mimeType: z.string().trim().min(1),
  sizeBytes: z.coerce.number().int().positive(),
  base64Data: z.string().trim().min(1),
  entityType: z.string().trim().max(100).optional(),
  entityId: z.string().trim().max(100).optional(),
});

const PresignUploadSchema = UploadFileSchema.omit({ base64Data: true, entityType: true, entityId: true });

@Controller("uploads")
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post("files")
  async uploadFile(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(UploadFileSchema)) body: z.infer<typeof UploadFileSchema>,
  ) {
    return this.uploadsService.savePdf({ userId: user.userId, ...body });
  }

  @Get("files/:fileKey")
  @Header("Cache-Control", "private, max-age=300")
  async download(@Param("fileKey") fileKey: string, @Res() res: Response) {
    const file = await this.uploadsService.getStoredFile(fileKey);
    res.setHeader("Content-Type", file.mime_type);
    res.setHeader("Content-Length", String(file.size_bytes));
    res.setHeader("Content-Disposition", `inline; filename="${file.original_name.replace(/"/g, "")}"`);
    res.send(Buffer.from(file.file_data));
  }

  @Post("presign")
  async presign(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(PresignUploadSchema)) body: z.infer<typeof PresignUploadSchema>,
  ) {
    return this.uploadsService.presignClaimUpload({ userId: user.userId, ...body });
  }
}
