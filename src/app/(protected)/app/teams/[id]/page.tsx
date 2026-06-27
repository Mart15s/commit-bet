import { ButtonLink, Card, PageHeader } from "@/components/ui";
import { T } from "@/i18n/useTranslation";
import { requireUser } from "@/lib/auth";
import { initials, singleRelation } from "@/lib/utils";
import { notFound } from "next/navigation";

type TeamMemberRow = {
  role: string;
  profiles: { id: string; name: string; email: string };
};

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { data: membership } = await supabase
    .from("team_members")
    .select("role, teams(id, name, invite_code)")
    .eq("team_id", id)
    .eq("user_id", user.id)
    .single();
  const team = membership?.teams as unknown as { id: string; name: string; invite_code: string } | null;
  if (!team) notFound();
  const { data: members } = await supabase
    .from("team_members")
    .select("role, joined_at, profiles(id, name, email)")
    .eq("team_id", team.id)
    .order("joined_at");
  const memberRows = (members ?? [])
    .map((member) => ({
      role: member.role,
      profiles: singleRelation(member.profiles as unknown as TeamMemberRow["profiles"] | TeamMemberRow["profiles"][]),
    }))
    .filter((member): member is TeamMemberRow => Boolean(member.profiles));

  return (
    <>
      <PageHeader
        eyebrow={<T k="teams.teamEyebrow" />}
        title={team.name}
        description={<T k="teams.inviteCodeValue" params={{ code: team.invite_code }} />}
        action={<ButtonLink href={`/app/projects/new?team=${team.id}`}><T k="common.newProject" /></ButtonLink>}
      />
      <Card>
        <h2 className="text-lg font-black"><T k="teams.membersCount" params={{ count: members?.length ?? 0 }} /></h2>
        <div className="mt-4 grid gap-3">
          {memberRows.map((member) => {
            const profile = member.profiles;
            return (
              <div key={profile.id} className="flex items-center gap-3 rounded-xl border border-border bg-secondary p-3">
                <div className="grid size-11 place-items-center rounded-full bg-primary font-black text-primary-foreground">{initials(profile.name)}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black">{profile.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
                </div>
                <span className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-black capitalize">{member.role}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}
