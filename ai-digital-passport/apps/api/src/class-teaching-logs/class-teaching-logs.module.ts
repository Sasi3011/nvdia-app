import { Module } from "@nestjs/common";
import { AdminClassTeachingLogsController } from "./admin-class-teaching-logs.controller";
import { MentorClassTeachingLogsController } from "./mentor-class-teaching-logs.controller";
import { ClassTeachingLogsService } from "./class-teaching-logs.service";

@Module({
  controllers: [MentorClassTeachingLogsController, AdminClassTeachingLogsController],
  providers: [ClassTeachingLogsService],
})
export class ClassTeachingLogsModule {}
