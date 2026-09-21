"use client";

// Roster file parsing helpers for the admin User Management page.
// The access list itself lives in the database (see adminWhitelistApi in ./api).

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

export function parseRawTextOrCsvToEmails(text: string): string[] {
  // Extract all valid emails from text or CSV content (handles commas, semicolons, newlines, tabs)
  const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((e) => e.toLowerCase())));
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
