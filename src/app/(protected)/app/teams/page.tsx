import { createTeam, joinTeam } from "@/app/(protected)/app/teams/actions";
import { T } from "@/components/i18n-text";
import { TranslatedInput } from "@/components/translated-form";
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
      <PageHeader title={<T k="teams.title" />} description={<T k="teams.description" />} />
      <ErrorMessage message={params.error} />
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-xl font-black"><T k="teams.createTitle" /></h2>
          <form action={createTeam} className="mt-4 grid gap-3">
            <label><T k="teams.teamName" /><TranslatedInput name="name" minLength={2} required placeholderKey="teams.teamNamePlaceholder" /></label>
            <Button type="submit"><T k="teams.createButton" /></Button>
          </form>
        </Card>
        <Card>
          <h2 className="text-xl font-black"><T k="teams.joinTitle" /></h2>
          <form action={joinTeam} className="mt-4 grid gap-3">
            <label><T k="teams.inviteCode" /><input name="code" required placeholder="A1B2C3D4" className="uppercase" /></label>
            <Button type="submit" variant="secondary"><T k="teams.joinButton" /></Button>
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
              <p className="mt-2 text-sm text-muted-foreground"><T k="teams.inviteCodeLabel" /> <strong>{team.invite_code}</strong></p>
              <ButtonLink href={`/app/teams/${team.id}`} className="mt-5 w-full" variant="secondary"><T k="teams.openTeam" /></ButtonLink>
            </Card>
          );
        }) : (
          <div className="sm:col-span-2 lg:col-span-3">
            <EmptyState
              title={<T k="teams.emptyTitle" />}
              copy={<T k="teams.emptyCopy" />}
              tip={<T k="teams.emptyTip" />}
            />
          </div>
        )}
      </div>
    </>
  );
}
