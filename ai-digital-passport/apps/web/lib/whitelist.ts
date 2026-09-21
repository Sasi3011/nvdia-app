"use client";

export interface WhitelistEntry {
  email: string;
  fullName?: string;
  role: "STUDENT" | "MENTOR" | "ADMIN";
  department: string;
  year?: string;
  status: "AUTHORIZED" | "SUSPENDED";
  addedAt: string;
  source: string;
  lastLoginAt?: string;
}

const DEFAULT_WHITELIST: WhitelistEntry[] = [
  {
    email: "admin@sece.ac.in",
    fullName: "Chief Administrator",
    role: "ADMIN",
    department: "NVIDIA Supercomputing Centre",
    status: "AUTHORIZED",
    addedAt: "2026-01-01T00:00:00.000Z",
    source: "System Core Admin",
    lastLoginAt: "2026-09-16T18:00:00.000Z",
  },
  {
    email: "mentor@sece.ac.in",
    fullName: "Faculty AI Mentor",
    role: "MENTOR",
    department: "B.E CSE",
    status: "AUTHORIZED",
    addedAt: "2026-01-01T00:00:00.000Z",
    source: "System Faculty Roster",
    lastLoginAt: "2026-09-15T14:30:00.000Z",
  },
  {
    email: "student@sece.ac.in",
    fullName: "AI Research Scholar",
    role: "STUDENT",
    department: "Computer Science & Engineering",
    status: "AUTHORIZED",
    addedAt: "2026-01-01T00:00:00.000Z",
    source: "System Scholar Roster",
    lastLoginAt: "2026-09-16T10:15:00.000Z",
  },
  {
    email: "aadhithya.v@sece.ac.in",
    fullName: "Aadhithya V.",
    role: "STUDENT",
    department: "AI & Data Science",
    status: "AUTHORIZED",
    addedAt: "2026-02-10T09:00:00.000Z",
    source: "Batch Import - AI_Fellows_2026.csv",
    lastLoginAt: "2026-09-14T11:20:00.000Z",
  },
  {
    email: "sneha.r@sece.ac.in",
    fullName: "Sneha Ramachandran",
    role: "STUDENT",
    department: "Computer Science & Engineering",
    status: "AUTHORIZED",
    addedAt: "2026-02-10T09:00:00.000Z",
    source: "Batch Import - AI_Fellows_2026.csv",
    lastLoginAt: "2026-09-15T16:45:00.000Z",
  },
  {
    email: "vikram.s@sece.ac.in",
    fullName: "Vikram Sundaram",
    role: "STUDENT",
    department: "AI & Machine Learning",
    status: "AUTHORIZED",
    addedAt: "2026-02-10T09:00:00.000Z",
    source: "Batch Import - Robotics_Lab_2026.csv",
    lastLoginAt: "2026-09-13T08:30:00.000Z",
  },
  {
    email: "pooja.d@sece.ac.in",
    fullName: "Pooja Dharshini",
    role: "STUDENT",
    department: "Information Technology",
    status: "AUTHORIZED",
    addedAt: "2026-03-01T10:00:00.000Z",
    source: "Batch Import - Quantum_AI_Cohort.csv",
    lastLoginAt: "2026-09-12T17:10:00.000Z",
  },
  {
    email: "rahul.n@sece.ac.in",
    fullName: "Rahul Nambiar",
    role: "STUDENT",
    department: "Electronics & Communication",
    status: "AUTHORIZED",
    addedAt: "2026-03-01T10:00:00.000Z",
    source: "Batch Import - Edge_TinyML_Cohort.csv",
    lastLoginAt: "2026-09-11T12:05:00.000Z",
  },
];

const STORAGE_KEY = "sece_nvidia_email_whitelist_v1";

export function getWhitelistEntries(): WhitelistEntry[] {
  if (typeof window === "undefined") return DEFAULT_WHITELIST;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_WHITELIST));
      return DEFAULT_WHITELIST;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_WHITELIST;
  } catch {
    return DEFAULT_WHITELIST;
  }
}

export function saveWhitelistEntries(entries: WhitelistEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.error("Failed to save whitelist to localStorage", err);
  }
}

export function isEmailAuthorized(email: string): { authorized: boolean; reason?: string; entry?: WhitelistEntry } {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { authorized: false, reason: "Please enter an email address." };

  const entries = getWhitelistEntries();
  const match = entries.find((e) => e.email.trim().toLowerCase() === normalized);

  if (!match) {
    return {
      authorized: false,
      reason: `Access Denied: The email "${normalized}" is not found in the authorized access whitelist. Please contact the administrator to grant access.`,
    };
  }

  if (match.status === "SUSPENDED") {
    return {
      authorized: false,
      reason: `Access Suspended: Portal privileges for "${normalized}" have been temporarily deactivated by the administrator.`,
      entry: match,
    };
  }

  return { authorized: true, entry: match };
}

export interface RosterRow {
  email: string;
  fullName?: string;
  department?: string;
  year?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q;
    } else if ((c === "," || c === ";" || c === "\t") && !q) {
      out.push(cur.trim());
      cur = "";
    } else cur += c;
  }
  out.push(cur.trim());
  return out;
}

/** Turn a 2D grid (header row + data rows) into roster rows by matching header names. */
export function gridToRosterRows(grid: string[][]): RosterRow[] {
  const norm = (h: string) => h.toLowerCase().replace(/[^a-z]/g, "");
  const head = (grid[0] ?? []).map(norm);
  const find = (...names: string[]) => head.findIndex((h) => names.some((n) => h.includes(n)));
  const iEmail = find("email", "mail");
  const hasHeader = iEmail >= 0;
  const iName = find("name");
  const iDept = find("department", "dept");
  const iYear = find("year", "batch", "cohort");
  const body = hasHeader ? grid.slice(1) : grid;
  const rows: RosterRow[] = [];
  for (const r of body) {
    const raw = hasHeader ? r[iEmail] : r.find((c) => EMAIL_RE.test((c ?? "").trim()));
    const email = (raw ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) continue;
    rows.push({
      email,
      fullName: hasHeader && iName >= 0 ? (r[iName] ?? "").trim() || undefined : undefined,
      department: hasHeader && iDept >= 0 ? (r[iDept] ?? "").trim() || undefined : undefined,
      year: hasHeader && iYear >= 0 ? String(r[iYear] ?? "").trim() || undefined : undefined,
    });
  }
  return rows;
}

function dedupe(rows: RosterRow[]): RosterRow[] {
  const seen = new Map<string, RosterRow>();
  rows.forEach((r) => seen.set(r.email, r));
  return Array.from(seen.values());
}

/** Parse CSV / pasted text. Falls back to plain email extraction when there are no columns. */
export function parseRosterText(text: string): RosterRow[] {
  const grid = text.split(/\r?\n/).filter((l) => l.trim()).map(splitCsvLine);
  const rows = gridToRosterRows(grid);
  return dedupe(rows.length ? rows : parseRawTextOrCsvToEmails(text).map((email) => ({ email })));
}

/** Parse an uploaded .csv/.txt/.xlsx/.xls file into roster rows. */
export async function parseRosterFile(file: File): Promise<RosterRow[]> {
  if (/\.xlsx?$/i.test(file.name)) {
    const XLSX = await import("xlsx");
    const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0] ?? ""];
    if (!sheet) return [];
    const grid = XLSX.utils
      .sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false, defval: "" })
      .map((r) => r.map((c) => String(c ?? "").trim()));
    return dedupe(gridToRosterRows(grid));
  }
  return parseRosterText(await file.text());
}

export function bulkAddRosterToWhitelist(
  rows: RosterRow[],
  options: { role?: "STUDENT" | "MENTOR" | "ADMIN"; department?: string; source?: string } = {},
) {
  const current = getWhitelistEntries();
  const map = new Map(current.map((e) => [e.email.toLowerCase(), e]));
  let addedCount = 0;
  let updatedCount = 0;
  for (const row of rows) {
    const existing = map.get(row.email);
    if (existing) {
      existing.status = "AUTHORIZED";
      if (options.role) existing.role = options.role;
      existing.department = row.department || options.department || existing.department;
      if (row.fullName) existing.fullName = row.fullName;
      if (row.year) existing.year = row.year;
      if (options.source) existing.source = options.source;
      updatedCount++;
    } else {
      const guess = (row.email.split("@")[0] || "User")
        .replace(/[._-]/g, " ")
        .split(" ")
        .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
        .join(" ");
      map.set(row.email, {
        email: row.email,
        fullName: row.fullName || guess,
        role: options.role || "STUDENT",
        department: row.department || options.department || "B.E CSE",
        year: row.year,
        status: "AUTHORIZED",
        addedAt: new Date().toISOString(),
        source: options.source || "Manual Admin Entry",
      });
      addedCount++;
    }
  }
  saveWhitelistEntries(Array.from(map.values()));
  return { addedCount, updatedCount, invalidCount: 0, totalProcessed: rows.length };
}

export function bulkAddEmailsToWhitelist(
  emails: string[],
  options: {
    role?: "STUDENT" | "MENTOR" | "ADMIN";
    department?: string;
    source?: string;
  } = {}
): { addedCount: number; updatedCount: number; invalidCount: number; totalProcessed: number } {
  const current = getWhitelistEntries();
  const currentMap = new Map(current.map((e) => [e.email.toLowerCase(), e]));

  let addedCount = 0;
  let updatedCount = 0;
  let invalidCount = 0;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  emails.forEach((rawEmail) => {
    const cleanEmail = rawEmail.trim().toLowerCase();
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      invalidCount++;
      return;
    }

    if (currentMap.has(cleanEmail)) {
      const existing = currentMap.get(cleanEmail)!;
      existing.status = "AUTHORIZED";
      if (options.role) existing.role = options.role;
      if (options.department) existing.department = options.department;
      if (options.source) existing.source = options.source;
      updatedCount++;
    } else {
      const namePart = (cleanEmail.split("@")[0] || "User").replace(/[._-]/g, " ");
      const formattedName = namePart
        .split(" ")
        .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
        .join(" ");

      const newEntry: WhitelistEntry = {
        email: cleanEmail,
        fullName: formattedName,
        role: options.role || "STUDENT",
        department: options.department || "B.E CSE",
        status: "AUTHORIZED",
        addedAt: new Date().toISOString(),
        source: options.source || "Manual Admin Entry",
      };
      currentMap.set(cleanEmail, newEntry);
      addedCount++;
    }
  });

  saveWhitelistEntries(Array.from(currentMap.values()));

  return {
    addedCount,
    updatedCount,
    invalidCount,
    totalProcessed: emails.length,
  };
}

export function parseRawTextOrCsvToEmails(text: string): string[] {
  // Extract all valid emails from text or CSV content (handles commas, semicolons, newlines, tabs)
  const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((e) => e.toLowerCase())));
}

export function exportWhitelistToCsvString(entries: WhitelistEntry[]): string {
  const headers = ["Email", "Full Name", "Role", "Department", "Year", "Status", "Source", "Date Added", "Last Login"];
  const rows = entries.map((e) => [
    `"${e.email}"`,
    `"${e.fullName || ""}"`,
    `"${e.role}"`,
    `"${e.department}"`,
    `"${e.year || ""}"`,
    `"${e.status}"`,
    `"${e.source}"`,
    `"${e.addedAt}"`,
    `"${e.lastLoginAt || "Never"}"`,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
