// Compact progress ring for AI level status.
export function LevelBadge({
  levelId,
  levelName,
  totalPoints,
  currentThreshold,
  nextThreshold,
}: {
  levelId: number;
  levelName: string;
  totalPoints: number;
  currentThreshold: number;
  nextThreshold: number | null;
}) {
  const progress = nextThreshold
    ? Math.min(1, Math.max(0, (totalPoints - currentThreshold) / (nextThreshold - currentThreshold)))
    : 1;
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="flex items-center gap-4">
      <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0" role="img" aria-label={`Level ${levelId} progress ring`}>
        <circle cx="32" cy="32" r={radius} fill="none" stroke="#C8D2DC" strokeWidth="4" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="#76B900"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 32 32)"
        />
        <text x="32" y="37" textAnchor="middle" className="fill-ink font-mono text-[18px] font-medium">
          {levelId}
        </text>
      </svg>
      <div>
        <div className="text-h2 text-ink">{levelName}</div>
        <div className="font-mono text-caption text-text-muted">
          {totalPoints.toLocaleString()} pts
          {nextThreshold ? ` · ${(nextThreshold - totalPoints).toLocaleString()} to next level` : " · max level"}
        </div>
      </div>
    </div>
  );
}
