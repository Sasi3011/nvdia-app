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
    year?: string;
    department?: string;
    sessionType?: string;
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
        year: input.year,
        department: input.department,
        session_type: input.sessionType,
        starts_at: input.startsAt,
        ends_at: input.endsAt,
        created_by: actorId,
        // Every event needs at least one check-in session so its QR is
        // available immediately after creation, without a separate
        // "add session" step in the admin UI.
        sessions: {
          create: {
            title: input.title,
            starts_at: input.startsAt,
            ends_at: input.endsAt,
            qr_window_seconds: QR_REFRESH_SECONDS,
            qr_active: true,
            qr_secret: generateQrSecret(),
          },
        },
      },
      include: { sessions: true },
    });
    await this.auditLogService.record({ actorId, action: "EVENT_CREATED", entityType: "event", entityId: event.event_id });
    return event;
  }

  async updateEvent(actorId: string, eventId: string, input: {
    title?: string;
    description?: string;
    location?: string;
    category?: string;
    year?: string;
    department?: string;
    sessionType?: string;
    startsAt?: Date;
    endsAt?: Date;
  }) {
    const existing = await prisma.event.findUnique({ where: { event_id: eventId } });
    if (!existing) throw new NotFoundException({ code: "EVENT_NOT_FOUND" });

    if (input.category) {
      const scoringRule = await prisma.scoringRule.findUnique({ where: { category: input.category } });
      if (!scoringRule) {
        throw new BadRequestException({ code: "UNKNOWN_CATEGORY", message: "No scoring rule for that category." });
      }
    }

    const event = await prisma.event.update({
      where: { event_id: eventId },
      data: {
        title: input.title,
        description: input.description,
        location: input.location,
        category: input.category,
        year: input.year,
        department: input.department,
        session_type: input.sessionType,
        starts_at: input.startsAt,
        ends_at: input.endsAt,
      },
      include: { sessions: { orderBy: { starts_at: "asc" } } },
    });
    
    // Sync the sessions with the new event times since the admin UI 
    // doesn't have a way to edit individual session times yet.
    if (input.startsAt !== undefined || input.endsAt !== undefined) {
      await prisma.eventSession.updateMany({
        where: { event_id: eventId },
        data: {
          starts_at: input.startsAt,
          ends_at: input.endsAt,
        },
      });
      // Update the returned event object's sessions so the caller gets the updated times
      const updatedSessions = await prisma.eventSession.findMany({
        where: { event_id: eventId },
        orderBy: { starts_at: "asc" }
      });
      event.sessions = updatedSessions;
    }

    await this.auditLogService.record({ actorId, action: "EVENT_UPDATED", entityType: "event", entityId: event.event_id });
    return event;
  }

  async listEvents() {
    const events = await prisma.event.findMany({
      orderBy: { starts_at: "desc" },
      include: { sessions: { orderBy: { starts_at: "asc" } }, scoring_rule: true },
    });
    const counts = await prisma.attendance.groupBy({ by: ["session_id"], _count: { _all: true } });
    const bySession = new Map(counts.map((c) => [c.session_id, c._count._all]));
    return events.map((e) => ({
      ...e,
      check_ins: e.sessions.reduce((n, s) => n + (bySession.get(s.session_id) ?? 0), 0),
    }));
  }

  async eventRoster(eventId: string) {
    const rows = await prisma.attendance.findMany({
      where: { session: { event_id: eventId } },
      orderBy: { checked_in_at: "asc" },
      include: {
        user: { select: { user_id: true, full_name: true, student: { select: { register_num: true, department: true } } } },
      },
    });
    return rows.map((r) => ({
      userId: r.user.user_id,
      fullName: r.user.full_name,
      registerNum: r.user.student?.register_num ?? "",
      department: r.user.student?.department ?? "",
      checkedInAt: r.checked_in_at,
    }));
  }

  async totalCheckIns(): Promise<number> {
    return prisma.attendance.count();
  }

  async getEvent(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { event_id: eventId },
      include: { sessions: { orderBy: { starts_at: "asc" } } },
    });
    if (!event) throw new NotFoundException({ code: "EVENT_NOT_FOUND" });
    return event;
  }

  async deleteEvent(actorId: string, eventId: string) {
    const existing = await prisma.event.findUnique({ where: { event_id: eventId } });
    if (!existing) throw new NotFoundException({ code: "EVENT_NOT_FOUND" });

    const sessions = await prisma.eventSession.findMany({ where: { event_id: eventId } });
    const sessionIds = sessions.map((s) => s.session_id);

    await prisma.$transaction([
      prisma.attendance.deleteMany({ where: { session_id: { in: sessionIds } } }),
      prisma.qrToken.deleteMany({ where: { session_id: { in: sessionIds } } }),
      prisma.eventSession.deleteMany({ where: { event_id: eventId } }),
      prisma.event.delete({ where: { event_id: eventId } }),
    ]);

    await this.auditLogService.record({ actorId, action: "EVENT_DELETED", entityType: "event", entityId: eventId });
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
    let session = await prisma.eventSession.findUnique({ where: { session_id: sessionId } });
    if (!session) throw new NotFoundException({ code: "SESSION_NOT_FOUND" });
    // The QR is live only between the session's start and end time.
    this.assertQrWindowOpen(session);
    if (!session.qr_secret) {
      session = await prisma.eventSession.update({
        where: { session_id: sessionId },
        data: { qr_secret: generateQrSecret(), qr_active: true },
      });
    }
    const secret = session.qr_secret as string;

    const { token, windowStart, windowEnd } = currentToken(secret, session.qr_window_seconds);

    // Audit trail only (SEC-09) — not the source of validity, which is
    // stateless TOTP against qr_secret.
    await prisma.qrToken.create({
      data: { session_id: sessionId, token, window_start: windowStart, window_end: windowEnd },
    });

    return { token, windowStart, windowEnd, refreshSeconds: session.qr_window_seconds };
  }

  // QR enables at the start time and disables at the end time automatically.
  private assertQrWindowOpen(session: { starts_at: Date; ends_at: Date }) {
    const now = Date.now();
    if (now < session.starts_at.getTime()) {
      throw new BadRequestException({
        code: "QR_NOT_STARTED",
        message: `QR check-in opens at ${session.starts_at.toISOString()}.`,
      });
    }
    if (now > session.ends_at.getTime()) {
      throw new BadRequestException({ code: "QR_ENDED", message: "This class has ended. QR check-in is closed." });
    }
  }

  async liveAttendanceCount(sessionId: string): Promise<number> {
    return prisma.attendance.count({ where: { session_id: sessionId } });
  }

  // ---- Student: live scan (Page 17) ---------------------------------------

  /**
   * Global scan when session ID is not provided (e.g. manual entry of 6-digit code).
   * Finds the correct active session by verifying the TOTP token against all active sessions.
   */
  async scanGlobal(userId: string, token: string) {
    const now = new Date();
    const activeSessions = await prisma.eventSession.findMany({
      where: {
        starts_at: { lte: now },
        ends_at: { gte: now },
        qr_active: true,
        qr_secret: { not: null }
      }
    });

    let matchedSessionId: string | null = null;
    for (const session of activeSessions) {
      if (verifyToken(token, session.qr_secret as string, session.qr_window_seconds)) {
        if (matchedSessionId) {
          throw new BadRequestException({ 
            code: "QR_COLLISION", 
            message: "Token collision detected. Please use the native camera scanner." 
          });
        }
        matchedSessionId = session.session_id;
      }
    }

    if (!matchedSessionId) {
      throw new BadRequestException({ 
        code: "QR_EXPIRED_OR_INVALID", 
        message: "This QR code has expired or is invalid. Ask the event host to refresh it." 
      });
    }

    return this.scan(matchedSessionId, userId, token);
  }

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
    this.assertQrWindowOpen(session);
    if (!session.qr_secret) {
      throw new BadRequestException({ code: "QR_EXPIRED_OR_INVALID", message: "This QR code has expired. Ask the event host to refresh it." });
    }
    // Points always come from the scoring matrix, never a fixed number.
    const points = session.event.scoring_rule.points;

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
            points_requested: points,
            points_awarded: points,
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
      points,
      reason: `Live event attendance: ${session.title}`,
    });

    return { alreadyRecorded: false, claimId, pointsAwarded: points, ...award };
  }
}
