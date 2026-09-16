import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { ActivitiesModule } from "./activities/activities.module";
import { AdminModule } from "./admin/admin.module";
import { AuthModule } from "./auth/auth.module";
import { AuditLogModule } from "./common/audit-log/audit-log.module";
import { SessionAuthGuard } from "./common/auth/session-auth.guard";
import { RolesGuard } from "./common/auth/roles.guard";
import { AllExceptionsFilter } from "./common/filters/http-exception.filter";
import { RedisModule } from "./common/redis/redis.module";
import { ClaimsModule } from "./claims/claims.module";
import { CoursesModule } from "./courses/courses.module";
import { EventsModule } from "./events/events.module";
import { HealthModule } from "./health/health.module";
import { LeaderboardModule } from "./leaderboard/leaderboard.module";
import { LevelsModule } from "./levels/levels.module";
import { MentorModule } from "./mentor/mentor.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { OtaModule } from "./ota/ota.module";
import { PointsModule } from "./points/points.module";
import { ProblemsModule } from "./problems/problems.module";
import { ProgramModule } from "./program/program.module";
import { ProctoringModule } from "./proctoring/proctoring.module";
import { StartupModule } from "./startup/startup.module";
import { UploadsModule } from "./uploads/uploads.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // SEC-10: rate limiting applied globally via APP_GUARD below.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    RedisModule,
    AuditLogModule,
    HealthModule,
    AuthModule,
    UsersModule,
    LevelsModule,
    PointsModule,
    ActivitiesModule,
    ClaimsModule,
    MentorModule,
    EventsModule,
    ProblemsModule,
    ProgramModule,
    StartupModule,
    NotificationsModule,
    UploadsModule,
    LeaderboardModule,
    AdminModule,
    OtaModule,
    CoursesModule,
    ProctoringModule,
  ],
  providers: [
    // Order matters: rate limit first, then resolve identity, then check
    // role. Every protected endpoint re-checks auth/role independently of
    // the frontend (SEC-04/05/06, spec 04 Section 12).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: SessionAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
