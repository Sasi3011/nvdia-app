export const DEPARTMENTS = [
  "B.E CSE",
  "B.E AIML(CSE)",
  "B.Tech AIDS",
  "B.E MECH",
  "B.E ECE",
  "B.E EEE",
  "B.E CCE",
  "B.E CSE(CYS)",
  "B.Tech CSBS",
  "B.Tech IT",
] as const;

/** Department list, plus the current value if it is a legacy one not in the list. */
export function departmentOptions(current?: string): string[] {
  const list: string[] = [...DEPARTMENTS];
  return current && !list.includes(current) ? [current, ...list] : list;
}
