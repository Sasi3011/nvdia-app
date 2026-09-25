import { randomBytes } from "node:crypto";
import { Logger, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { LeaderboardModule } from "../leaderboard/leaderboard.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { GoogleStrategy } from "./google.strategy";
import { SessionService } from "./session.service";

// The session cookie is a JWT signed with this secret; anyone who knows it
// can mint a session for any account (including admins). So a weak or
// published value is never used: a too-short secret stops the server in
// production, and when none is set in development a random one is
// generated per boot (sessions then reset on every API restart).
const MIN_SECRET_LENGTH = 32;
function resolveSessionSecret(): string {
  const configured = process.env.SESSION_SECRET?.trim() ?? "";
  if (configured.length >= MIN_SECRET_LENGTH) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error(`SESSION_SECRET must be set to at least ${MIN_SECRET_LENGTH} random characters in production.`);
  }
  new Logger("AuthModule").warn(
    `SESSION_SECRET is missing or shorter than ${MIN_SECRET_LENGTH} characters — using a random per-boot secret (everyone is logged out when the API restarts).`,
  );
  return randomBytes(48).toString("base64url");
}

@Module({
  imports: [
    PassportModule.register({ session: false }),
    JwtModule.register({
      secret: resolveSessionSecret(),
      signOptions: { expiresIn: "7d" },
    }),
    LeaderboardModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, SessionService],
  exports: [AuthService, SessionService, JwtModule],
})
export class AuthModule {}
