import { Module } from "@nestjs/common";
import { LeaderboardModule } from "../leaderboard/leaderboard.module";
import { LevelsModule } from "../levels/levels.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PointsController } from "./points.controller";
import { PointsService } from "./points.service";

@Module({
  imports: [LevelsModule, NotificationsModule, LeaderboardModule],
  controllers: [PointsController],
  providers: [PointsService],
  exports: [PointsService],
})
export class PointsModule {}
