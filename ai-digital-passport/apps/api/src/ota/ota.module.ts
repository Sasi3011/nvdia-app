import { Module } from "@nestjs/common";
import { AdminOtaController } from "./admin-ota.controller";
import { OtaApiKeyGuard } from "./ota-api-key.guard";
import { OtaController } from "./ota.controller";
import { OtaService } from "./ota.service";

@Module({
  controllers: [OtaController, AdminOtaController],
  providers: [OtaService, OtaApiKeyGuard],
})
export class OtaModule {}
