import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { PointsModule } from "../points/points.module";
import { MentorController } from "./mentor.controller";
import { MentorService } from "./mentor.service";

@Module({
  imports: [PointsModule, NotificationsModule],
  controllers: [MentorController],
  providers: [MentorService],
})
export class MentorModule {}
