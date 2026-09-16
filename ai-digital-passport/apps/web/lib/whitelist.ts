"use client";

export interface WhitelistEntry {
  email: string;
  fullName?: string;
  role: "STUDENT" | "MENTOR" | "ADMIN";
  department: string;
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
    department: "Artificial Intelligence & Data Science",
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
        department: options.department || "Artificial Intelligence & Data Science",
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
  const headers = ["Email", "Full Name", "Role", "Department", "Status", "Source", "Date Added", "Last Login"];
  const rows = entries.map((e) => [
    `"${e.email}"`,
    `"${e.fullName || ""}"`,
    `"${e.role}"`,
    `"${e.department}"`,
    `"${e.status}"`,
    `"${e.source}"`,
    `"${e.addedAt}"`,
    `"${e.lastLoginAt || "Never"}"`,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
