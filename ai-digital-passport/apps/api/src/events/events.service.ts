import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ClaimStatus, Prisma, ProofType, prisma } from "@ai-digital-passport/database";
import { QR_REFRESH_SECONDS } from "@ai-digital-passport/shared-types";
import { AuditLogService } from "../common/audit-log/audit-log.service";
import { PointsService } from "../points/points.service";
import { currentToken, generateQrSecret, verifyToken } from "./totp.util";

const UNIQUE_CONSTRAINT_VIOLATION = "P2002";

@Injectable()
export class EventsService {
  constructor(
    private readonly pointsService: PointsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  // ---- Admin: event/session/QR management (Page 25) ----------------------

  async createEvent(actorId: string, input: {
    title: string;
    description?: string;
    location?: string;
    category: string;
    startsAt: Date;
    endsAt: Date;
  }) {
    const scoringRule = await prisma.scoringRule.findUnique({ where: { category: input.category } });
    if (!scoringRule) {
      throw new BadRequestException({ code: "UNKNOWN_CATEGORY", message: "No scoring rule for that category." });
    }
    const event = await prisma.event.create({
      data: {
        title: input.title,
        description: input.description,
        location: input.location,
        category: input.category,
        starts_at: input.startsAt,
        ends_at: input.endsAt,
        created_by: actorId,
      },
    });
    await this.auditLogService.record({ actorId, action: "EVENT_CREATED", entityType: "event", entityId: event.event_id });
    return event;
  }

  async listEvents() {
    return prisma.event.findMany({
      orderBy: { starts_at: "desc" },
      include: { sessions: { orderBy: { starts_at: "asc" } } },
    });
  }

  async getEvent(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { event_id: eventId },
      include: { sessions: { orderBy: { starts_at: "asc" } } },
    });
    if (!event) throw new NotFoundException({ code: "EVENT_NOT_FOUND" });
    return event;
  }

  async createSession(actorId: string, eventId: string, input: { title: string; startsAt: Date; endsAt: Date }) {
    const event = await prisma.event.findUnique({ where: { event_id: eventId } });
    if (!event) throw new NotFoundException({ code: "EVENT_NOT_FOUND" });

    const session = await prisma.eventSession.create({
      data: {
        event_id: eventId,
        title: input.title,
        starts_at: input.startsAt,
        ends_at: input.endsAt,
        qr_window_seconds: QR_REFRESH_SECONDS,
      },
    });
    await this.auditLogService.record({
      actorId,
      action: "EVENT_SESSION_CREATED",
      entityType: "event_session",
      entityId: session.session_id,
    });
    return session;
  }

  async activateSession(actorId: string, sessionId: string) {
    const session = await prisma.eventSession.update({
      where: { session_id: sessionId },
      data: { qr_active: true, qr_secret: generateQrSecret() },
    });
    await this.auditLogService.record({ actorId, action: "QR_SESSION_ACTIVATED", entityType: "event_session", entityId: sessionId });
    return session;
  }

  async deactivateSession(actorId: string, sessionId: string) {
    const session = await prisma.eventSession.update({
      where: { session_id: sessionId },
      data: { qr_active: false },
    });
    await this.auditLogService.record({ actorId, action: "QR_SESSION_DEACTIVATED", entityType: "event_session", entityId: sessionId });
    return session;
  }

  // Meant to be polled by the venue display every ~window (Page 25).
  async currentQr(sessionId: string) {
    const session = await prisma.eventSession.findUnique({ where: { session_id: sessionId } });
    if (!session) throw new NotFoundException({ code: "SESSION_NOT_FOUND" });
    if (!session.qr_active || !session.qr_secret) {
      throw new BadRequestException({ code: "QR_NOT_ACTIVE", message: "This session's QR has not been activated." });
    }

    const { token, windowStart, windowEnd } = currentToken(session.qr_secret, session.qr_window_seconds);

    // Audit trail only (SEC-09) — not the source of validity, which is
    // stateless TOTP against qr_secret.
    await prisma.qrToken.create({
      data: { session_id: sessionId, token, window_start: windowStart, window_end: windowEnd },
    });

    return { token, windowStart, windowEnd, refreshSeconds: session.qr_window_seconds };
  }

  async liveAttendanceCount(sessionId: string): Promise<number> {
    return prisma.attendance.count({ where: { session_id: sessionId } });
  }

  // ---- Student: live scan (Page 17) ---------------------------------------

  /**
   * FR-VERIF-01 / BR-04/BR-05: validates the scanned token against the
   * session's TOTP secret, rejects expired/invalid tokens (SEC-08), never
   * double-credits the same student for the same session (BR-05), and
   * auto-approves straight into the points engine — no mentor step.
   */
  async scan(sessionId: string, userId: string, token: string) {
    const session = await prisma.eventSession.findUnique({
      where: { session_id: sessionId },
      include: { event: { include: { scoring_rule: true } } },
    });
    if (!session) throw new NotFoundException({ code: "SESSION_NOT_FOUND" });
    if (!session.qr_active || !session.qr_secret) {
      throw new BadRequestException({ code: "QR_EXPIRED_OR_INVALID", message: "This QR code has expired. Ask the event host to refresh it." });
    }

    const valid = verifyToken(token, session.qr_secret, session.qr_window_seconds);
    if (!valid) {
      throw new BadRequestException({ code: "QR_EXPIRED_OR_INVALID", message: "This QR code has expired. Ask the event host to refresh it." });
    }

    const existing = await prisma.attendance.findUnique({
      where: { user_id_session_id: { user_id: userId, session_id: sessionId } },
    });
    if (existing) {
      return { alreadyRecorded: true, claimId: null, pointsAwarded: 0 };
    }

    let claimId: string;
    try {
      const result = await prisma.$transaction(async (tx) => {
        const claim = await tx.activityClaim.create({
          data: {
            user_id: userId,
            category: session.event.category,
            proof_type: ProofType.TOTP_QR,
            points_requested: 20,
            points_awarded: 20,
            status: ClaimStatus.APPROVED,
            reviewed_at: new Date(),
          },
        });
        await tx.attendance.create({
          data: { user_id: userId, session_id: sessionId },
        });
        return claim;
      });
      claimId = result.claim_id;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_CONSTRAINT_VIOLATION) {
        // Lost a race to a concurrent scan for the same user+session.
        return { alreadyRecorded: true, claimId: null, pointsAwarded: 0 };
      }
      throw error;
    }

    const award = await this.pointsService.awardForClaim({
      userId,
      claimId,
      points: 20,
      reason: `Live event attendance: ${session.title}`,
    });

    return { alreadyRecorded: false, claimId, pointsAwarded: 20, ...award };
  }
}
