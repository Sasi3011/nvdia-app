import type { ReactNode } from "react";

export const LEVEL_BADGE_NAMES: Record<number, string> = {
  1: "AI Explorer",
  2: "AI Practitioner",
  3: "AI Builder",
  4: "AI Innovator",
  5: "AI Researcher",
  6: "AI Champion",
};

interface Palette {
  outer: [string, string];
  inner: [string, string];
  ring: string;
  glyph: string;
  ribbon: string;
}

const PALETTES: Record<number, Palette> = {
  1: { outer: ["#2DD4BF", "#0F766E"], inner: ["#134E4A", "#0B302E"], ring: "#99F6E4", glyph: "#CCFBF1", ribbon: "#0F766E" },
  2: { outer: ["#60A5FA", "#1D4ED8"], inner: ["#1E3A8A", "#172554"], ring: "#BFDBFE", glyph: "#DBEAFE", ribbon: "#1D4ED8" },
  3: { outer: ["#76B900", "#3F6212"], inner: ["#1A2E05", "#0F1A03"], ring: "#BEF264", glyph: "#ECFCCB", ribbon: "#4D7C0F" },
  4: { outer: ["#FB923C", "#C2410C"], inner: ["#431407", "#2A0D04"], ring: "#FED7AA", glyph: "#FFEDD5", ribbon: "#C2410C" },
  5: { outer: ["#A78BFA", "#6D28D9"], inner: ["#2E1065", "#1B0A3D"], ring: "#DDD6FE", glyph: "#EDE9FE", ribbon: "#6D28D9" },
  6: { outer: ["#FDE047", "#B45309"], inner: ["#3B0764", "#1E0335"], ring: "#FEF08A", glyph: "#FEF9C3", ribbon: "#A16207" },
};

const HEX_OUTER = "60,4 108,31 108,89 60,116 12,89 12,31";
const HEX_MID = "60,12 101,35 101,85 60,108 19,85 19,35";
const HEX_INNER = "60,20 94,39 94,81 60,100 26,81 26,39";

// Each glyph is drawn in a 40x40 box centred at (60,60).
function Glyph({ levelId, color }: { levelId: number; color: string }): ReactNode {
  const common = { fill: "none", stroke: color, strokeWidth: 3.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (levelId) {
    case 1: // compass
      return (
        <g transform="translate(40 40)">
          <circle cx="20" cy="20" r="15" {...common} />
          <polygon points="20,8 25,20 20,32 15,20" fill={color} stroke="none" />
          <circle cx="20" cy="20" r="2.4" fill="#0B302E" stroke="none" />
        </g>
      );
    case 2: // chip
      return (
        <g transform="translate(40 40)">
          <rect x="9" y="9" width="22" height="22" rx="3" {...common} />
          <rect x="15" y="15" width="10" height="10" rx="1.5" fill={color} stroke="none" />
          {[14, 20, 26].map((p) => (
            <g key={p}>
              <line x1={p} y1="3" x2={p} y2="9" {...common} strokeWidth={2.5} />
              <line x1={p} y1="31" x2={p} y2="37" {...common} strokeWidth={2.5} />
              <line x1="3" y1={p} x2="9" y2={p} {...common} strokeWidth={2.5} />
              <line x1="31" y1={p} x2="37" y2={p} {...common} strokeWidth={2.5} />
            </g>
          ))}
        </g>
      );
    case 3: // stacked layers
      return (
        <g transform="translate(40 40)">
          <polygon points="20,6 36,14 20,22 4,14" fill={color} stroke="none" />
          <polyline points="4,21 20,29 36,21" {...common} />
          <polyline points="4,28 20,36 36,28" {...common} />
        </g>
      );
    case 4: // lightbulb
      return (
        <g transform="translate(40 40)">
          <path d="M20 4 C11 4 6 11 6 17 C6 22 9 25 12 28 L12 31 L28 31 L28 28 C31 25 34 22 34 17 C34 11 29 4 20 4 Z" fill={color} stroke="none" />
          <line x1="14" y1="35" x2="26" y2="35" {...common} strokeWidth={3} />
          <line x1="17" y1="39" x2="23" y2="39" {...common} strokeWidth={2.5} />
        </g>
      );
    case 5: // atom
      return (
        <g transform="translate(40 40)">
          <ellipse cx="20" cy="20" rx="17" ry="7" {...common} strokeWidth={3} />
          <ellipse cx="20" cy="20" rx="17" ry="7" transform="rotate(60 20 20)" {...common} strokeWidth={3} />
          <ellipse cx="20" cy="20" rx="17" ry="7" transform="rotate(120 20 20)" {...common} strokeWidth={3} />
          <circle cx="20" cy="20" r="3.6" fill={color} stroke="none" />
        </g>
      );
    default: // crown
      return (
        <g transform="translate(40 40)">
          <path d="M4 30 L7 11 L14 20 L20 7 L26 20 L33 11 L36 30 Z" fill={color} stroke="none" />
          <rect x="4" y="32" width="32" height="5" rx="2" fill={color} stroke="none" />
        </g>
      );
  }
}

export interface LevelBadgeProps {
  levelId: number;
  size?: number;
  locked?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function LevelBadge({ levelId, size = 96, locked = false, showLabel = false, className }: LevelBadgeProps) {
  const id = Math.min(6, Math.max(1, Math.round(levelId)));
  const p = PALETTES[id] as Palette;
  const name = LEVEL_BADGE_NAMES[id] as string;
  const uid = `lb${id}${locked ? "l" : "u"}`;

  const lockedPalette: Palette = {
    outer: ["#CBD5E1", "#94A3B8"],
    inner: ["#64748B", "#475569"],
    ring: "#E2E8F0",
    glyph: "#E2E8F0",
    ribbon: "#94A3B8",
  };
  const c = locked ? lockedPalette : p;

  return (
    <div className={`inline-flex flex-col items-center ${className ?? ""}`} style={{ width: size }}>
      <svg
        viewBox="0 0 120 140"
        width={size}
        height={(size * 140) / 120}
        role="img"
        aria-label={`${name} badge${locked ? " (locked)" : ""}`}
      >
        <defs>
          <linearGradient id={`${uid}-o`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={c.outer[0]} />
            <stop offset="1" stopColor={c.outer[1]} />
          </linearGradient>
          <linearGradient id={`${uid}-i`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c.inner[0]} />
            <stop offset="1" stopColor={c.inner[1]} />
          </linearGradient>
        </defs>
        <polygon points={HEX_OUTER} fill={`url(#${uid}-o)`} />
        <polygon points={HEX_MID} fill="none" stroke={c.ring} strokeWidth="2" opacity="0.85" />
        <polygon points={HEX_INNER} fill={`url(#${uid}-i)`} />
        <Glyph levelId={id} color={c.glyph} />
        {/* Tier number */}
        <circle cx="60" cy="14" r="9" fill={c.ribbon} stroke={c.ring} strokeWidth="1.5" />
        <text x="60" y="18" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff" fontFamily="system-ui, sans-serif">
          {id}
        </text>
        {/* Ribbon */}
        <path d="M14 104 L106 104 L100 116 L106 128 L14 128 L20 116 Z" fill={c.ribbon} stroke={c.ring} strokeWidth="1.2" />
        <text x="60" y="120" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#fff" fontFamily="system-ui, sans-serif" letterSpacing="0.3">
          {name.toUpperCase()}
        </text>
        {locked && (
          <g transform="translate(46 44)">
            <rect x="0" y="14" width="28" height="22" rx="4" fill="#0F172A" opacity="0.7" />
            <path d="M6 14 V9 a8 8 0 0 1 16 0 V14" fill="none" stroke="#0F172A" strokeOpacity="0.7" strokeWidth="4" />
          </g>
        )}
      </svg>
      {showLabel && <span className="mt-1 text-center text-[11px] font-bold text-slate-700">{name}</span>}
    </div>
  );
}
