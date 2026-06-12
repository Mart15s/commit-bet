import { ProjectWizard } from "@/components/project-wizard";
import { EmptyState, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { supabase } = await requireUser();
  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id, teams(id, name), profiles(id, name, email)");
  const teamRows = new Map<string, { id: string; name: string; members: Array<{ id: string; name: string; email: string }> }>();

  for (const membership of memberships ?? []) {
    const team = membership.teams as unknown as { id: string; name: string };
    if (!teamRows.has(team.id)) {
      const { data: members } = await supabase
        .from("team_members")
        .select("profiles(id, name, email)")
        .eq("team_id", team.id);
      teamRows.set(team.id, {
        ...team,
        members: (members ?? []).map((member) => member.profiles as unknown as { id: string; name: string; email: string }),
      });
    }
  }
  const teams = [...teamRows.values()];

  return (
    <>
      <PageHeader title="Create a commitment sprint" description="Define the agreement first. AI will help turn it into an executable plan." />
      {teams.length ? <ProjectWizard teams={teams} initialTeam={params.team} error={params.error} /> : <EmptyState title="Create a team first" copy="Projects belong to a small team. Create one or join with an invite code." />}
    </>
  );
}

