import { Module } from "@nestjs/common";
import { LevelsModule } from "../levels/levels.module";
import { AdminAuditController } from "./admin-audit.controller";
import { AdminDashboardController } from "./admin-dashboard.controller";
import { AdminProblemsController } from "./admin-problems.controller";
import { AdminReportsController } from "./admin-reports.controller";
import { AdminScoringController } from "./admin-scoring.controller";
import { AdminUsersController } from "./admin-users.controller";

@Module({
  imports: [LevelsModule],
  controllers: [
    AdminDashboardController,
    AdminScoringController,
    AdminProblemsController,
    AdminUsersController,
    AdminReportsController,
    AdminAuditController,
  ],
})
export class AdminModule {}
