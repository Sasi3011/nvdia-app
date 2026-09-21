import { Module } from "@nestjs/common";
import { LevelsModule } from "../levels/levels.module";
import { AdminAuditController } from "./admin-audit.controller";
import { AdminIndustryGpuController } from "./admin-industry-gpu.controller";
import { AdminDashboardController } from "./admin-dashboard.controller";
import { AdminProblemsController } from "./admin-problems.controller";
import { AdminReportsController } from "./admin-reports.controller";
import { AdminReportsService } from "./admin-reports.service";
import { AdminScoringController } from "./admin-scoring.controller";
import { AdminUsersController } from "./admin-users.controller";

@Module({
  imports: [LevelsModule],
  controllers: [
    AdminDashboardController,
    AdminScoringController,
    AdminProblemsController,
    AdminIndustryGpuController,
    AdminUsersController,
    AdminReportsController,
    AdminAuditController,
  ],
  providers: [AdminReportsService],
})
export class AdminModule {}
