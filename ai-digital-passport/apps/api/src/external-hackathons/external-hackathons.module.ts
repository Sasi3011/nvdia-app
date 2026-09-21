import { Module } from "@nestjs/common";
import { PointsModule } from "../points/points.module";
import { ExternalHackathonsController } from "./external-hackathons.controller";
import { ExternalHackathonsService } from "./external-hackathons.service";

@Module({ imports: [PointsModule], controllers: [ExternalHackathonsController], providers: [ExternalHackathonsService] })
export class ExternalHackathonsModule {}
