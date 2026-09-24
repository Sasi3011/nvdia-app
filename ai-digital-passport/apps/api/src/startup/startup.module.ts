import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { PointsModule } from "../points/points.module";
import { AdminStartupsController } from "./admin-startups.controller";
import { StartupController } from "./startup.controller";
import { StartupMentorController } from "./startup-mentor.controller";
import { StartupService } from "./startup.service";

@Module({
  imports: [NotificationsModule, PointsModule],
  controllers: [StartupController, StartupMentorController, AdminStartupsController],
  providers: [StartupService],
})
export class StartupModule {}
