import { Injectable, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

// Cache only — never the source of truth for points (spec 01 Section 2
// architectural principle). Every read backed by this client must be
// rebuildable from PostgreSQL if Redis is unavailable.
@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;

  constructor() {
    const url = process.env.REDIS_URL ?? "redis://localhost:6379";
    this.client = new Redis(url, { maxRetriesPerRequest: 2, lazyConnect: false });
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
