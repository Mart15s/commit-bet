import { createTeam, joinTeam } from "@/app/(protected)/app/teams/actions";
import { Button, ButtonLink, Card, EmptyState, ErrorMessage, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export default async function TeamsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { supabase } = await requireUser();
  const params = await searchParams;
  const { data: memberships } = await supabase
    .from("team_members")
    .select("role, teams(id, name, invite_code)")
    .order("joined_at");

  return (
    <>
      <PageHeader title="Your teams" description="Small teams, clear commitments, visible proof." />
      <ErrorMessage message={params.error} />
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-xl font-black">Create a team</h2>
          <form action={createTeam} className="mt-4 grid gap-3">
            <label>Team name<input name="name" minLength={2} required placeholder="Weekend builders" /></label>
            <Button type="submit">Create team</Button>
          </form>
        </Card>
        <Card>
          <h2 className="text-xl font-black">Join with a code</h2>
          <form action={joinTeam} className="mt-4 grid gap-3">
            <label>Invite code<input name="code" required placeholder="A1B2C3D4" className="uppercase" /></label>
            <Button type="submit" variant="secondary">Join team</Button>
          </form>
        </Card>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {memberships?.length ? memberships.map((membership) => {
          const team = membership.teams as unknown as { id: string; name: string; invite_code: string };
          return (
            <Card key={team.id}>
              <p className="text-xs font-black uppercase tracking-wider text-primary">{membership.role}</p>
              <h2 className="mt-2 text-xl font-black">{team.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">Invite code: <strong>{team.invite_code}</strong></p>
              <ButtonLink href={`/app/teams/${team.id}`} className="mt-5 w-full" variant="secondary">Open team</ButtonLink>
            </Card>
          );
        }) : <div className="sm:col-span-2 lg:col-span-3"><EmptyState title="No team yet" copy="Create your first team or join a teammate with their invite code." /></div>}
      </div>
    </>
  );
}
