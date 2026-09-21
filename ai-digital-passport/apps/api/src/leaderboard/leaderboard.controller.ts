import { Controller, Get, Query } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { LeaderboardService } from "./leaderboard.service";

const TopQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(100).default(20) });

// GET /leaderboard — cohort ranking (Page 13), all authenticated roles.
@Controller("leaderboard")
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get("summary")
  async summary() {
    return this.leaderboardService.summary();
  }

  @Get()
  async top(@Query(new ZodValidationPipe(TopQuerySchema)) query: z.infer<typeof TopQuerySchema>) {
    return this.leaderboardService.top(query.limit);
  }
}
