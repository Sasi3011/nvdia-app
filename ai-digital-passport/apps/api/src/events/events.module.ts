import { Module } from "@nestjs/common";
import { PointsModule } from "../points/points.module";
import { AdminEventsController } from "./admin-events.controller";
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";

@Module({
  imports: [PointsModule],
  controllers: [EventsController, AdminEventsController],
  providers: [EventsService],
})
export class EventsModule {}
