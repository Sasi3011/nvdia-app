import { Module } from "@nestjs/common";
import { AdminAwardsController, AwardsController } from "./awards.controller";
import { AwardsService } from "./awards.service";

@Module({ controllers: [AwardsController, AdminAwardsController], providers: [AwardsService] })
export class AwardsModule {}
