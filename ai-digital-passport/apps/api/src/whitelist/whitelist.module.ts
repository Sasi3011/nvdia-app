import { Global, Module } from "@nestjs/common";
import { AdminWhitelistController } from "./admin-whitelist.controller";
import { WhitelistService } from "./whitelist.service";

@Global()
@Module({
  controllers: [AdminWhitelistController],
  providers: [WhitelistService],
  exports: [WhitelistService],
})
export class WhitelistModule {}
