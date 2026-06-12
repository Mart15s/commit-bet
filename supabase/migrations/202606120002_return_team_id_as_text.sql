drop function if exists public.create_team(text);

create or replace function public.create_team(team_name text)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  new_team_id uuid;
begin
  insert into public.teams(name, owner_id, invite_code)
  values (
    team_name,
    auth.uid(),
    upper(substr(replace(extensions.gen_random_uuid()::text, '-', ''), 1, 8))
  )
  returning id into new_team_id;

  insert into public.team_members(team_id, user_id, role)
  values (new_team_id, auth.uid(), 'owner');

  return new_team_id::text;
end;
$$;

grant execute on function public.create_team(text) to authenticated;

