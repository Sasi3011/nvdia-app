import { Injectable } from "@nestjs/common";
import { Prisma, prisma } from "@ai-digital-passport/database";

// Backs the Audit Log Viewer (Page 31, SEC-09): claim approvals/rejections,
// scoring/config changes, role changes, annual audit runs.
@Injectable()
export class AuditLogService {
  async record(params: {
    actorId: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await prisma.auditLog.create({
      data: {
        actor_id: params.actorId,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId ?? null,
        metadata: (params.metadata as Prisma.InputJsonValue | undefined) ?? undefined,
      },
    });
  }
}
