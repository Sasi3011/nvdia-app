import { Module } from "@nestjs/common";
import { MentorRoutingModule } from "../common/mentor-routing/mentor-routing.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PointsModule } from "../points/points.module";
import { UploadsModule } from "../uploads/uploads.module";
import { AdminCoursesController } from "./admin-courses.controller";
import { CoursesController } from "./courses.controller";
import { CoursesService } from "./courses.service";
import { MentorCoursesController } from "./mentor-courses.controller";

@Module({
  imports: [NotificationsModule, MentorRoutingModule, PointsModule, UploadsModule],
  controllers: [CoursesController, AdminCoursesController, MentorCoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
