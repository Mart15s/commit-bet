alter function public.is_team_member(uuid, uuid) set schema private;
alter function public.is_project_member(uuid, uuid) set schema private;
alter function public.is_project_owner(uuid, uuid) set schema private;

revoke all on function private.is_team_member(uuid, uuid) from public, anon;
revoke all on function private.is_project_member(uuid, uuid) from public, anon;
revoke all on function private.is_project_owner(uuid, uuid) from public, anon;

grant execute on function private.is_team_member(uuid, uuid) to authenticated, service_role;
grant execute on function private.is_project_member(uuid, uuid) to authenticated, service_role;
grant execute on function private.is_project_owner(uuid, uuid) to authenticated, service_role;

create or replace function public.review_submitted_task(
  reviewed_task_id uuid,
  review_status text,
  review_comment text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  task_project_id uuid;
  current_status text;
begin
  if review_status not in ('approved', 'needs_changes', 'rejected') then
    raise exception 'Invalid review status';
  end if;
  if review_status <> 'approved' and char_length(trim(review_comment)) = 0 then
    raise exception 'A comment is required';
  end if;

  select project_id, status
  into task_project_id, current_status
  from public.tasks
  where id = reviewed_task_id;

  if current_status <> 'submitted' then
    raise exception 'Task is not submitted';
  end if;
  if not private.is_project_member(task_project_id) then
    raise exception 'Not a project member';
  end if;
  if exists (
    select 1
    from public.task_assignments
    where task_id = reviewed_task_id
      and user_id = auth.uid()
  ) then
    raise exception 'Assignees cannot review their own task';
  end if;

  insert into public.reviews(task_id, reviewer_id, status, comment)
  values (reviewed_task_id, auth.uid(), review_status, review_comment);

  update public.tasks
  set status = review_status,
      approved_at = case when review_status = 'approved' then now() else null end
  where id = reviewed_task_id;
end;
$$;

revoke all on function public.review_submitted_task(uuid, text, text) from public, anon;
grant execute on function public.review_submitted_task(uuid, text, text) to authenticated, service_role;
