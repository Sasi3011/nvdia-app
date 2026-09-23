import { Module } from "@nestjs/common";
import { MyProgressController, StudentProgressController } from "./student-progress.controller";
import { StudentProgressService } from "./student-progress.service";

@Module({
  controllers: [StudentProgressController, MyProgressController],
  providers: [StudentProgressService],
})
export class StudentProgressModule {}
