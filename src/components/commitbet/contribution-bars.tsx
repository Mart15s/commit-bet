const fills = [
  "from-blue-500 to-cyan-400",
  "from-cyan-500 to-emerald-400",
  "from-purple-500 to-blue-400",
];

export function ContributionBars({
  members,
}: {
  members: ReadonlyArray<{ name: string; score: number }>;
}) {
  return (
    <div className="space-y-4">
      {members.map((member, index) => (
        <div key={member.name}>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-bold text-slate-200">{member.name}</span>
            <span className="font-black text-white">{member.score}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-black/30">
            <div className={`h-full rounded-full bg-gradient-to-r ${fills[index % fills.length]}`} style={{ width: `${member.score}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
