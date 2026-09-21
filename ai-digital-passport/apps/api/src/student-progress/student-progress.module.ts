import { Module } from "@nestjs/common";
import { StudentProgressController } from "./student-progress.controller";
import { StudentProgressService } from "./student-progress.service";

@Module({
  controllers: [StudentProgressController],
  providers: [StudentProgressService],
})
export class StudentProgressModule {}
