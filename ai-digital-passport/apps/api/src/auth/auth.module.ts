import { Logger, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { LeaderboardModule } from "../leaderboard/leaderboard.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { GoogleStrategy } from "./google.strategy";
import { SessionService } from "./session.service";

if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("SESSION_SECRET must be set in production — it signs the session cookie.");
}
if (!process.env.SESSION_SECRET) {
  new Logger("AuthModule").warn("SESSION_SECRET is not set — using an insecure dev-only fallback.");
}

@Module({
  imports: [
    PassportModule.register({ session: false }),
    JwtModule.register({
      secret: process.env.SESSION_SECRET || "insecure-dev-only-secret-do-not-use-in-production",
      signOptions: { expiresIn: "7d" },
    }),
    LeaderboardModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, SessionService],
  exports: [AuthService, SessionService, JwtModule],
})
export class AuthModule {}
