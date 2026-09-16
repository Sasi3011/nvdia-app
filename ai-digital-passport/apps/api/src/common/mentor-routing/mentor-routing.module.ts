import { Module } from "@nestjs/common";
import { NotificationsModule } from "../../notifications/notifications.module";
import { MentorRoutingService } from "./mentor-routing.service";

@Module({
  imports: [NotificationsModule],
  providers: [MentorRoutingService],
  exports: [MentorRoutingService],
})
export class MentorRoutingModule {}
