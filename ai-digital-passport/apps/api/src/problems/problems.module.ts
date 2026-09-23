import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { AdminProblemProjectsController } from "./admin-problem-projects.controller";
import { ProblemsController } from "./problems.controller";
import { ProblemsMentorController } from "./problems-mentor.controller";
import { ProblemsService } from "./problems.service";

@Module({
  imports: [NotificationsModule],
  controllers: [ProblemsController, ProblemsMentorController, AdminProblemProjectsController],
  providers: [ProblemsService],
  exports: [ProblemsService],
})
export class ProblemsModule {}
