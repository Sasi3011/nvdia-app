import { Module } from "@nestjs/common";
import { UploadsModule } from "../uploads/uploads.module";
import { ClaimsController } from "./claims.controller";
import { ClaimsService } from "./claims.service";

@Module({
  imports: [UploadsModule],
  controllers: [ClaimsController],
  providers: [ClaimsService],
})
export class ClaimsModule {}
