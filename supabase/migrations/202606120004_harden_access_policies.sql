create schema if not exists private;

create or replace function private.shares_team(
  profile_id uuid,
  viewer_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select profile_id = viewer_id or exists (
    select 1
    from public.team_members viewer_membership
    join public.team_members profile_membership
      on profile_membership.team_id = viewer_membership.team_id
    where viewer_membership.user_id = viewer_id
      and profile_membership.user_id = profile_id
  );
$$;

revoke all on function private.shares_team(uuid, uuid) from public, anon;
grant usage on schema private to authenticated, service_role;
grant execute on function private.shares_team(uuid, uuid) to authenticated, service_role;

drop policy if exists "authenticated profiles visible" on public.profiles;
create policy "team profiles visible"
on public.profiles
for select
to authenticated
using ((select private.shares_team(id)));

drop policy if exists "users add own evidence" on public.evidence;
create policy "assignees add own evidence"
on public.evidence
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.task_assignments assignment
    where assignment.task_id = evidence.task_id
      and assignment.user_id = (select auth.uid())
  )
);

create or replace function private.task_matches_log(
  checked_log_id uuid,
  checked_task_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.daily_logs log
    join public.tasks task on task.project_id = log.project_id
    where log.id = checked_log_id
      and task.id = checked_task_id
      and log.user_id = (select auth.uid())
  );
$$;

revoke all on function private.task_matches_log(uuid, uuid) from public, anon;
grant execute on function private.task_matches_log(uuid, uuid) to authenticated, service_role;

drop policy if exists "users manage own log tasks" on public.daily_log_tasks;
create policy "users manage own project log tasks"
on public.daily_log_tasks
for all
to authenticated
using ((select private.task_matches_log(daily_log_id, task_id)))
with check ((select private.task_matches_log(daily_log_id, task_id)));

revoke execute on all functions in schema public from public, anon;
grant execute on function public.create_team(text) to authenticated;
grant execute on function public.join_team(text) to authenticated;
grant execute on function public.review_submitted_task(uuid, text, text) to authenticated;
grant execute on function public.attach_dispute_recommendation(uuid, jsonb) to authenticated;

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'alter function public.rls_auto_enable() set schema private';
    execute 'revoke all on function private.rls_auto_enable() from public, anon, authenticated';
  end if;
end;
$$;
