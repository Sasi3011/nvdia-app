import { Injectable } from "@nestjs/common";
import Redis from "ioredis";
import { prisma } from "@ai-digital-passport/database";

@Injectable()
export class HealthService {
  async checkDatabase(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  async checkRedis(): Promise<boolean> {
    const url = process.env.REDIS_URL;
    if (!url) return false;

    const redis = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
    try {
      await redis.connect();
      const pong = await redis.ping();
      return pong === "PONG";
    } catch {
      return false;
    } finally {
      redis.disconnect();
    }
  }
}
