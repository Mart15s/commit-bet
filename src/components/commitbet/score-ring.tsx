const colors = {
  blue: "#2F7BFF",
  green: "#34D399",
  purple: "#8B5CF6",
  amber: "#F59E0B",
};

export function ScoreRing({
  score,
  variant = "blue",
  label = "Score",
  size = 148,
}: {
  score: number;
  variant?: keyof typeof colors;
  label?: string;
  size?: number;
}) {
  const safeScore = Math.max(0, Math.min(100, score));
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeScore / 100) * circumference;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg className="-rotate-90" viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={`${label}: ${safeScore} out of 100`}>
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={colors[variant]}
          strokeLinecap="round"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 8px ${colors[variant]}80)` }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-4xl font-black tracking-[-0.06em]">{safeScore}</div>
        <div className="mt-0.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">{label}</div>
      </div>
    </div>
  );
}
