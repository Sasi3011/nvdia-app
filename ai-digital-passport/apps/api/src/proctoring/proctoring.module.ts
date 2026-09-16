import { Module } from "@nestjs/common";
import { MentorRoutingModule } from "../common/mentor-routing/mentor-routing.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { MentorProctoringController } from "./mentor-proctoring.controller";
import { ProctoringController } from "./proctoring.controller";
import { ProctoringService } from "./proctoring.service";

@Module({
  imports: [NotificationsModule, MentorRoutingModule],
  controllers: [ProctoringController, MentorProctoringController],
  providers: [ProctoringService],
})
export class ProctoringModule {}
