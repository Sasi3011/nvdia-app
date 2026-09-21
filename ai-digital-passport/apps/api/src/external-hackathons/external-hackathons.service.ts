import { Injectable, Logger, NotFoundException, OnModuleInit } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { prisma, Prisma } from "@ai-digital-passport/database";
import { PointsService } from "../points/points.service";

interface Candidate {
  source: "DEVPOST" | "UNSTOP" | "DEVFOLIO";
  sourceRef: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string | null;
  organizer?: string | null;
  location?: string | null;
  isOnline: boolean;
  prize?: string | null;
  tags: string[];
  startsAt?: Date | null;
  endsAt?: Date | null;
  deadlineAt?: Date | null;
}

const AI_KEYWORDS =
  /\b(ai|llm|llms|gen ?ai|genai|generative|gpt|chatgpt|openai|gemini|claude|agentic|agents?|machine learning|deep learning|nlp|rag|neural|langchain|copilot|prompt|nvidia|artificial intelligence|computer vision)\b/i;
const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 20_000;

export function isAiRelated(...texts: Array<string | null | undefined>): boolean {
  return AI_KEYWORDS.test(texts.filter(Boolean).join(" "));
}

const stripHtml = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

const toDate = (v: unknown): Date | null => {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
};

async function fetchJson(url: string, init?: RequestInit): Promise<any> {
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { Accept: "application/json", "User-Agent": "SECE-NVIDIA-Portal/1.0", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).host}`);
  return res.json();
}

/** Devpost gives text like "Sep 19 - 20, 2026" or "Sep 30 - Oct 2, 2026"; take the end date. */
function parseDevpostEnd(text?: string): Date | null {
  if (!text) return null;
  const year = text.match(/(\d{4})\s*$/)?.[1];
  if (!year) return null;
  const tail = (text.split("-").pop() ?? "").trim().replace(/,?\s*\d{4}$/, "");
  const startMonth = text.match(/^([A-Za-z]{3})/)?.[1];
  const withMonth = /^[A-Za-z]/.test(tail) ? tail : `${startMonth} ${tail}`;
  return toDate(`${withMonth}, ${year} 23:59:00 UTC`);
}

@Injectable()
export class ExternalHackathonsService implements OnModuleInit {
  private readonly logger = new Logger(ExternalHackathonsService.name);

  constructor(private readonly points: PointsService) {}

  onModuleInit() {
    if (process.env.DISABLE_HACKATHON_SYNC === "true") return;
    // First sync shortly after boot, then every few hours.
    setTimeout(() => void this.sync().catch(() => undefined), 15_000).unref();
    setInterval(() => void this.sync().catch(() => undefined), SYNC_INTERVAL_MS).unref();
  }

  async list(userId: string) {
    // Hide events that finished more than a day ago.
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const rows = await prisma.externalHackathon.findMany({
      where: { hidden: false, OR: [{ ends_at: null }, { ends_at: { gte: cutoff } }] },
      orderBy: [{ deadline_at: { sort: "asc", nulls: "last" } }, { created_at: "desc" }],
      include: { registrations: { where: { user_id: userId }, select: { registration_id: true } } },
    });
    return rows.map(({ registrations, ...h }) => ({ ...h, registered: registrations.length > 0 }));
  }

  /** Student says they registered on the external site: record it once and award the points. */
  async register(userId: string, id: string) {
    const h = await prisma.externalHackathon.findUnique({ where: { external_id: id } });
    if (!h || h.hidden) throw new NotFoundException({ code: "HACKATHON_NOT_FOUND" });
    try {
      await prisma.externalHackathonRegistration.create({
        data: { external_id: id, user_id: userId, points_awarded: h.register_points },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return { alreadyRegistered: true, pointsAwarded: 0 };
      }
      throw err;
    }
    if (h.register_points > 0) {
      await this.points.awardGeneric({ userId, points: h.register_points, reason: `Registered for hackathon: ${h.title}` });
    }
    return { alreadyRegistered: false, pointsAwarded: h.register_points };
  }

  async update(
    id: string,
    input: {
      title?: string; url?: string; description?: string; organizer?: string; location?: string; isOnline?: boolean;
      prize?: string; tags?: string[]; deadlineAt?: string; registerPoints?: number;
    },
  ) {
    const row = await prisma.externalHackathon.findUnique({ where: { external_id: id } });
    if (!row) throw new NotFoundException({ code: "HACKATHON_NOT_FOUND" });
    const deadline = input.deadlineAt !== undefined ? toDate(input.deadlineAt) : undefined;
    return prisma.externalHackathon.update({
      where: { external_id: id },
      data: {
        title: input.title,
        url: input.url,
        description: input.description,
        organizer: input.organizer,
        location: input.location,
        is_online: input.isOnline,
        prize: input.prize,
        tags: input.tags,
        register_points: input.registerPoints,
        ...(deadline !== undefined ? { deadline_at: deadline, ends_at: deadline } : {}),
        locked: true, // keep staff edits safe from the next automatic sync
      },
    });
  }

  addManual(
    userId: string,
    input: {
      title: string;
      url: string;
      description?: string;
      organizer?: string;
      location?: string;
      isOnline?: boolean;
      prize?: string;
      tags?: string[];
      imageUrl?: string;
      startsAt?: string;
      endsAt?: string;
      deadlineAt?: string;
    },
  ) {
    return prisma.externalHackathon.create({
      data: {
        source: "MANUAL",
        source_ref: randomUUID(),
        title: input.title,
        url: input.url,
        description: input.description ?? "",
        organizer: input.organizer,
        location: input.location,
        is_online: input.isOnline ?? false,
        prize: input.prize,
        tags: input.tags ?? [],
        image_url: input.imageUrl,
        starts_at: toDate(input.startsAt),
        ends_at: toDate(input.endsAt),
        deadline_at: toDate(input.deadlineAt),
        added_by: userId,
      },
    });
  }

  async remove(id: string) {
    const row = await prisma.externalHackathon.findUnique({ where: { external_id: id } });
    if (!row) throw new NotFoundException({ code: "HACKATHON_NOT_FOUND" });
    if (row.source === "MANUAL") {
      await prisma.externalHackathon.delete({ where: { external_id: id } });
    } else {
      // Fetched entries are hidden, not deleted, so the next sync does not bring them back.
      await prisma.externalHackathon.update({ where: { external_id: id }, data: { hidden: true, locked: true } });
    }
  }

  /** Pull AI/LLM hackathons from every source; one source failing doesn't stop the others. */
  async sync(): Promise<{ fetched: number; saved: number; errors: string[] }> {
    const errors: string[] = [];
    const all: Candidate[] = [];
    const sources: Array<[string, () => Promise<Candidate[]>]> = [
      ["Devpost", () => this.fromDevpost()],
      ["Unstop", () => this.fromUnstop()],
      ["Devfolio", () => this.fromDevfolio()],
    ];
    for (const [name, fn] of sources) {
      try {
        all.push(...(await fn()));
      } catch (err) {
        const msg = `${name}: ${(err as Error).message}`;
        this.logger.warn(msg);
        errors.push(msg);
      }
    }

    let saved = 0;
    for (const c of all) {
      const data = {
        title: c.title,
        description: c.description.slice(0, 4000),
        url: c.url,
        image_url: c.imageUrl ?? null,
        organizer: c.organizer ?? null,
        location: c.location ?? null,
        is_online: c.isOnline,
        prize: c.prize ?? null,
        tags: c.tags,
        starts_at: c.startsAt ?? null,
        ends_at: c.endsAt ?? null,
        deadline_at: c.deadlineAt ?? null,
      };
      try {
        const existing = await prisma.externalHackathon.findUnique({
          where: { source_source_ref: { source: c.source, source_ref: c.sourceRef } },
          select: { locked: true },
        });
        if (existing?.locked) continue;
        await prisma.externalHackathon.upsert({
          where: { source_source_ref: { source: c.source, source_ref: c.sourceRef } },
          create: { source: c.source, source_ref: c.sourceRef, ...data },
          update: data,
        });
        saved++;
      } catch (err) {
        this.logger.warn(`upsert ${c.source}/${c.sourceRef}: ${(err as Error).message}`);
      }
    }
    this.logger.log(`Hackathon sync: ${all.length} AI-related found, ${saved} saved, ${errors.length} source error(s)`);
    return { fetched: all.length, saved, errors };
  }

  private async fromDevpost(): Promise<Candidate[]> {
    const out: Candidate[] = [];
    for (const term of ["AI", "LLM"]) {
      const json = await fetchJson(
        `https://devpost.com/api/hackathons?search=${term}&status[]=open&status[]=upcoming&order_by=deadline&per_page=30`,
      );
      for (const h of json.hackathons ?? []) {
        const themes: string[] = (h.themes ?? []).map((t: any) => t.name);
        if (!isAiRelated(h.title, themes.join(" "))) continue;
        const end = parseDevpostEnd(h.submission_period_dates);
        out.push({
          source: "DEVPOST",
          sourceRef: String(h.id),
          title: h.title,
          description: `${h.title} - ${themes.join(", ")}`,
          url: h.url,
          imageUrl: h.thumbnail_url ? `https:${h.thumbnail_url}` : null,
          organizer: h.organization_name ?? null,
          location: h.displayed_location?.location ?? null,
          isOnline: /online/i.test(h.displayed_location?.location ?? ""),
          prize: h.prize_amount ? stripHtml(h.prize_amount) : null,
          tags: themes,
          endsAt: end,
          deadlineAt: end,
        });
      }
    }
    return out;
  }

  private async fromUnstop(): Promise<Candidate[]> {
    const out: Candidate[] = [];
    for (const term of ["AI", "LLM", "Generative AI"]) {
      const json = await fetchJson(
        `https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&per_page=30&oppstatus=open&searchTerm=${encodeURIComponent(term)}`,
      );
      for (const h of json?.data?.data ?? []) {
        const skills: string[] = (h.required_skills ?? []).map((s: any) => s.skill).filter(Boolean);
        const details = stripHtml(h.details ?? "");
        if (!isAiRelated(h.title, skills.join(" "), details.slice(0, 600))) continue;
        const cash = (h.prizes ?? []).reduce((n: number, p: any) => n + (Number(p.cash) || 0), 0);
        out.push({
          source: "UNSTOP",
          sourceRef: String(h.id),
          title: h.title,
          description: details,
          url: h.seo_url ?? `https://unstop.com/${h.public_url}`,
          imageUrl: h.logoUrl2 ?? null,
          organizer: h.organisation?.name ?? null,
          location: h.region === "online" ? "Online" : (h.region ?? null),
          isOnline: h.region === "online",
          prize: cash ? `INR ${cash.toLocaleString("en-IN")}` : null,
          tags: skills.slice(0, 8),
          startsAt: toDate(h.regnRequirements?.start_regn_dt),
          endsAt: toDate(h.end_date),
          deadlineAt: toDate(h.regnRequirements?.end_regn_dt) ?? toDate(h.end_date),
        });
      }
    }
    return out;
  }

  private async fromDevfolio(): Promise<Candidate[]> {
    const out: Candidate[] = [];
    for (const query of ["AI", "LLM"]) {
      const json = await fetchJson("https://api.devfolio.co/api/search/hackathons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "application_open", from: 0, size: 30, query }),
      });
      for (const hit of json?.hits?.hits ?? []) {
        const h = hit._source;
        if (!h || h.private) continue;
        const themes: string[] = (h.themes ?? []).map((t: any) => (typeof t === "string" ? t : t?.name)).filter(Boolean);
        if (!isAiRelated(h.name, h.tagline, h.desc?.slice(0, 600), themes.join(" "))) continue;
        out.push({
          source: "DEVFOLIO",
          sourceRef: String(h.uuid),
          title: h.name,
          description: stripHtml(h.desc ?? h.tagline ?? ""),
          url: `https://${h.slug}.devfolio.co`,
          imageUrl: h.cover_img ?? null,
          organizer: h.hosted_by ?? null,
          location: h.is_online ? "Online" : [h.city, h.state, h.country].filter(Boolean).join(", ") || null,
          isOnline: !!h.is_online,
          prize: null,
          tags: themes,
          startsAt: toDate(h.starts_at),
          endsAt: toDate(h.ends_at),
          deadlineAt: toDate(h.hackathon_setting?.reg_ends_at) ?? toDate(h.ends_at),
        });
      }
    }
    return out;
  }
}
