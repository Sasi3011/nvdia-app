import type { ReactNode } from "react";

interface Palette {
  outer: [string, string];
  inner: [string, string];
  ring: string;
  glyph: string;
  ribbon: string;
}

const PALETTES: Palette[] = [
  { outer: ["#2DD4BF", "#0F766E"], inner: ["#134E4A", "#0B302E"], ring: "#99F6E4", glyph: "#CCFBF1", ribbon: "#0F766E" },
  { outer: ["#60A5FA", "#1D4ED8"], inner: ["#1E3A8A", "#172554"], ring: "#BFDBFE", glyph: "#DBEAFE", ribbon: "#1D4ED8" },
  { outer: ["#76B900", "#3F6212"], inner: ["#1A2E05", "#0F1A03"], ring: "#BEF264", glyph: "#ECFCCB", ribbon: "#4D7C0F" },
  { outer: ["#FB923C", "#C2410C"], inner: ["#431407", "#2A0D04"], ring: "#FED7AA", glyph: "#FFEDD5", ribbon: "#C2410C" },
  { outer: ["#A78BFA", "#6D28D9"], inner: ["#2E1065", "#1B0A3D"], ring: "#DDD6FE", glyph: "#EDE9FE", ribbon: "#6D28D9" },
  { outer: ["#FDE047", "#B45309"], inner: ["#3B0764", "#1E0335"], ring: "#FEF08A", glyph: "#FEF9C3", ribbon: "#A16207" },
  { outer: ["#F43F5E", "#BE123C"], inner: ["#4C0519", "#22000A"], ring: "#FECDD3", glyph: "#FFE4E6", ribbon: "#BE123C" },
  { outer: ["#38BDF8", "#0369A1"], inner: ["#082F49", "#041724"], ring: "#BAE6FD", glyph: "#E0F2FE", ribbon: "#0369A1" },
  { outer: ["#F472B6", "#BE185D"], inner: ["#831843", "#4C0519"], ring: "#FBCFE8", glyph: "#FCE7F3", ribbon: "#BE185D" },
  { outer: ["#10B981", "#047857"], inner: ["#064E3B", "#022C22"], ring: "#A7F3D0", glyph: "#D1FAE5", ribbon: "#047857" },
  { outer: ["#8B5CF6", "#5B21B6"], inner: ["#2E1065", "#1B0A3D"], ring: "#DDD6FE", glyph: "#EDE9FE", ribbon: "#5B21B6" },
  { outer: ["#F59E0B", "#B45309"], inner: ["#451A03", "#290F02"], ring: "#FDE68A", glyph: "#FEF3C7", ribbon: "#B45309" },
];

const HEX_OUTER = "60,4 108,31 108,89 60,116 12,89 12,31";
const HEX_MID = "60,12 101,35 101,85 60,108 19,85 19,35";
const HEX_INNER = "60,20 94,39 94,81 60,100 26,81 26,39";

function hashString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getInitials(name: string) {
  if (!name) return "AW";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AW";
  if (parts.length === 1) return (parts[0]?.substring(0, 2) || "AW").toUpperCase();
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

function getShortName(name: string) {
  if (!name) return "AWARD";
  if (name.length <= 12) return name.toUpperCase();
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "AWARD";
  if (words.length === 1) return (words[0]?.substring(0, 10) || "AWARD").toUpperCase() + ".";
  // Just use the first word if it's long
  const first = words[0]?.toUpperCase() || "AWARD";
  if (first.length > 12) return first.substring(0, 10) + ".";
  return first;
}

export interface AwardBadgeProps {
  awardId: string;
  name: string;
  size?: number;
  className?: string;
}

export function AwardBadge({ awardId, name, size = 96, className }: AwardBadgeProps) {
  const hash = hashString(awardId);
  const p = PALETTES[hash % PALETTES.length] as Palette;
  const uid = `ab_${awardId}`;
  
  const initials = getInitials(name);
  const fullName = (name || "AWARD").toUpperCase();

  return (
    <div className={`inline-flex flex-col items-center ${className ?? ""}`} style={{ width: size }}>
      <svg
        viewBox="0 0 120 140"
        width={size}
        height={(size * 140) / 120}
        role="img"
        aria-label="Award Badge"
      >
        <defs>
          <linearGradient id={`${uid}-o`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={p.outer[0]} />
            <stop offset="1" stopColor={p.outer[1]} />
          </linearGradient>
          <linearGradient id={`${uid}-i`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.inner[0]} />
            <stop offset="1" stopColor={p.inner[1]} />
          </linearGradient>
        </defs>
        
        {/* Shield background */}
        <polygon points={HEX_OUTER} fill={`url(#${uid}-o)`} />
        <polygon points={HEX_MID} fill="none" stroke={p.ring} strokeWidth="2" opacity="0.85" />
        <polygon points={HEX_INNER} fill={`url(#${uid}-i)`} />
        
        {/* Initials */}
        <text x="60" y="70" textAnchor="middle" fontSize="32" fontWeight="900" fill={p.glyph} fontFamily="system-ui, sans-serif" letterSpacing="1">
          {initials}
        </text>
        
        {/* Ribbon */}
        <path d="M4 104 L116 104 L110 116 L116 128 L4 128 L10 116 Z" fill={p.ribbon} stroke={p.ring} strokeWidth="1.2" />
        <foreignObject x="12" y="104" width="96" height="24">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', padding: '0 2px' }}>
            <span style={{ 
              color: '#fff', 
              fontSize: fullName.length > 16 ? '5.5px' : '7.5px', 
              fontWeight: 800, 
              fontFamily: 'system-ui, sans-serif', 
              textAlign: 'center',
              lineHeight: 1.1,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {fullName}
            </span>
          </div>
        </foreignObject>
      </svg>
    </div>
  );
}
