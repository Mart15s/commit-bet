import { cn, initials } from "@/lib/utils";

const colors = [
  "from-blue-500 to-blue-700",
  "from-cyan-400 to-cyan-700",
  "from-purple-500 to-purple-700",
  "from-emerald-400 to-emerald-700",
];

export function MemberAvatarStack({
  members,
  size = "md",
}: {
  members: ReadonlyArray<{ name: string }>;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex -space-x-2" aria-label={`${members.length} team members`}>
      {members.map((member, index) => (
        <span
          key={member.name}
          title={member.name}
          className={cn(
            "grid place-items-center rounded-full border-2 border-[#101729] bg-gradient-to-br font-black text-white shadow-lg",
            colors[index % colors.length],
            size === "sm" ? "size-8 text-[9px]" : "size-10 text-[10px]",
          )}
        >
          {initials(member.name)}
        </span>
      ))}
    </div>
  );
}
