import { Module } from "@nestjs/common";
import { AuditLogModule } from "../common/audit-log/audit-log.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PointsModule } from "../points/points.module";
import { ProgramAdminController } from "./program-admin.controller";
import { ProgramController } from "./program.controller";
import { ProgramService } from "./program.service";

@Module({
  imports: [AuditLogModule, NotificationsModule, PointsModule],
  controllers: [ProgramController, ProgramAdminController],
  providers: [ProgramService],
  exports: [ProgramService],
})
export class ProgramModule {}
