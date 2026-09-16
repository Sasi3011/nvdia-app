import { Controller, Get, HttpStatus, Res } from "@nestjs/common";
import type { Response } from "express";
import { HealthCheckResponseSchema } from "@ai-digital-passport/shared-types";
import { Public } from "../common/auth/public.decorator";
import { HealthService } from "./health.service";

// GET /health — satisfies the NFR health-check requirement (spec 04):
// verifies DB and Redis connectivity so infra/load balancers can probe it.
@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  async check(@Res() res: Response) {
    const [database, redis] = await Promise.all([
      this.healthService.checkDatabase(),
      this.healthService.checkRedis(),
    ]);
    const allHealthy = database && redis;

    const body = HealthCheckResponseSchema.parse({
      status: allHealthy ? "ok" : "degraded",
      checks: { database, redis },
      timestamp: new Date().toISOString(),
    });

    res.status(allHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json(body);
  }
}
