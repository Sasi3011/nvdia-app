import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { StartupController } from "./startup.controller";
import { StartupMentorController } from "./startup-mentor.controller";
import { StartupService } from "./startup.service";

@Module({
  imports: [NotificationsModule],
  controllers: [StartupController, StartupMentorController],
  providers: [StartupService],
})
export class StartupModule {}
