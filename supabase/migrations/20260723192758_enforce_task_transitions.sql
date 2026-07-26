-- Task status is a database-owned state machine. Authenticated callers can
-- read tasks through RLS, but every update now goes through a narrowly scoped
-- function that validates identity, membership, assignment, project state,
-- and the previous task state while holding a row lock.

drop policy if exists "owner or assignee updates tasks" on public.tasks;
revoke update on public.tasks from authenticated;

create or replace function public.start_task(target_task_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  task_project_id uuid;
  task_status text;
  project_status text;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  select task.project_id, task.status, project.status
  into task_project_id, task_status, project_status
  from public.tasks as task
  join public.projects as project on project.id = task.project_id
  where task.id = target_task_id
  for update of task;

  if task_project_id is null then
    raise exception 'Task not found';
  end if;
  if not private.is_project_member(task_project_id, caller_id) then
    raise exception 'Not a project member';
  end if;
  if not exists (
    select 1
    from public.task_assignments as assignment
    where assignment.task_id = target_task_id
      and assignment.user_id = caller_id
  ) then
    raise exception 'Only the task assignee can start this task';
  end if;
  if project_status <> 'active' then
    raise exception 'Only tasks in active projects can be started';
  end if;
  if task_status <> 'todo' then
    raise exception 'Task must be todo before it can be started';
  end if;

  update public.tasks
  set status = 'in_progress',
      submitted_at = null,
      approved_at = null
  where id = target_task_id;

  insert into public.audit_logs(project_id, user_id, action, details)
  values (
    task_project_id,
    caller_id,
    'task_started',
    jsonb_build_object('task_id', target_task_id, 'from_status', task_status, 'to_status', 'in_progress')
  );
end;
$$;

create or replace function public.reopen_task_after_changes(target_task_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  task_project_id uuid;
  task_status text;
  project_status text;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  select task.project_id, task.status, project.status
  into task_project_id, task_status, project_status
  from public.tasks as task
  join public.projects as project on project.id = task.project_id
  where task.id = target_task_id
  for update of task;

  if task_project_id is null then
    raise exception 'Task not found';
  end if;
  if not private.is_project_member(task_project_id, caller_id) then
    raise exception 'Not a project member';
  end if;
  if not exists (
    select 1
    from public.task_assignments as assignment
    where assignment.task_id = target_task_id
      and assignment.user_id = caller_id
  ) then
    raise exception 'Only the task assignee can reopen this task';
  end if;
  if project_status <> 'active' then
    raise exception 'Only tasks in active projects can be reopened';
  end if;
  if task_status not in ('needs_changes', 'rejected') then
    raise exception 'Only tasks needing changes or rejected tasks can be reopened';
  end if;

  update public.tasks
  set status = 'in_progress',
      submitted_at = null,
      approved_at = null
  where id = target_task_id;

  insert into public.audit_logs(project_id, user_id, action, details)
  values (
    task_project_id,
    caller_id,
    'task_reopened',
    jsonb_build_object('task_id', target_task_id, 'from_status', task_status, 'to_status', 'in_progress')
  );
end;
$$;

create or replace function public.submit_task(target_task_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  task_project_id uuid;
  task_status text;
  project_status text;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  select task.project_id, task.status, project.status
  into task_project_id, task_status, project_status
  from public.tasks as task
  join public.projects as project on project.id = task.project_id
  where task.id = target_task_id
  for update of task;

  if task_project_id is null then
    raise exception 'Task not found';
  end if;
  if not private.is_project_member(task_project_id, caller_id) then
    raise exception 'Not a project member';
  end if;
  if not exists (
    select 1
    from public.task_assignments as assignment
    where assignment.task_id = target_task_id
      and assignment.user_id = caller_id
  ) then
    raise exception 'Only the task assignee can submit this task';
  end if;
  if project_status <> 'active' then
    raise exception 'Only tasks in active projects can be submitted';
  end if;
  if task_status not in ('in_progress', 'needs_changes') then
    raise exception 'Task must be in progress or need changes before submission';
  end if;
  if not exists (
    select 1
    from public.evidence
    where task_id = target_task_id
  ) then
    raise exception 'Add at least one evidence item before submitting';
  end if;

  update public.tasks
  set status = 'submitted',
      submitted_at = now(),
      approved_at = null
  where id = target_task_id;

  insert into public.audit_logs(project_id, user_id, action, details)
  values (
    task_project_id,
    caller_id,
    'task_submitted',
    jsonb_build_object('task_id', target_task_id, 'from_status', task_status, 'to_status', 'submitted')
  );
end;
$$;

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
  caller_id uuid := auth.uid();
  task_project_id uuid;
  task_status text;
  project_status text;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;
  if review_status is null or review_status not in ('approved', 'needs_changes', 'rejected') then
    raise exception 'Invalid review status';
  end if;
  review_comment := coalesce(review_comment, '');
  if review_status <> 'approved' and char_length(trim(review_comment)) = 0 then
    raise exception 'A comment is required';
  end if;

  select task.project_id, task.status, project.status
  into task_project_id, task_status, project_status
  from public.tasks as task
  join public.projects as project on project.id = task.project_id
  where task.id = reviewed_task_id
  for update of task;

  if task_project_id is null then
    raise exception 'Task not found';
  end if;
  if not private.is_project_member(task_project_id, caller_id) then
    raise exception 'Not a project member';
  end if;
  if exists (
    select 1
    from public.task_assignments as assignment
    where assignment.task_id = reviewed_task_id
      and assignment.user_id = caller_id
  ) then
    raise exception 'Assignees cannot review their own task';
  end if;
  if project_status <> 'active' then
    raise exception 'Only tasks in active projects can be reviewed';
  end if;
  if task_status <> 'submitted' then
    raise exception 'Task is not submitted';
  end if;

  insert into public.reviews(task_id, reviewer_id, status, comment)
  values (reviewed_task_id, caller_id, review_status, review_comment);

  update public.tasks
  set status = review_status,
      approved_at = case when review_status = 'approved' then now() else null end
  where id = reviewed_task_id;

  insert into public.audit_logs(project_id, user_id, action, details)
  values (
    task_project_id,
    caller_id,
    'task_' || review_status,
    jsonb_build_object(
      'task_id', reviewed_task_id,
      'comment', review_comment,
      'from_status', task_status,
      'to_status', review_status
    )
  );
end;
$$;

create or replace function public.update_draft_task(
  draft_project_id uuid,
  draft_task_id uuid,
  draft_title text,
  draft_due_date date,
  draft_priority text,
  draft_assigned_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  task_project_id uuid;
  task_status text;
  project_status text;
  project_start_date date;
  project_end_date date;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;
  if draft_title is null or char_length(trim(draft_title)) not between 2 and 120 then
    raise exception 'Task title must be between 2 and 120 characters';
  end if;
  if draft_priority is null or draft_priority not in ('low', 'medium', 'high', 'critical') then
    raise exception 'Invalid task priority';
  end if;

  select task.project_id, task.status, project.status, project.start_date, project.end_date
  into task_project_id, task_status, project_status, project_start_date, project_end_date
  from public.tasks as task
  join public.projects as project on project.id = task.project_id
  where task.id = draft_task_id
    and task.project_id = draft_project_id
  for update of task;

  if task_project_id is null then
    raise exception 'Draft task not found in this project';
  end if;
  if not private.is_project_member(draft_project_id, caller_id) then
    raise exception 'Not a project member';
  end if;
  if not private.is_project_owner(draft_project_id, caller_id) then
    raise exception 'Only the project owner can edit draft tasks';
  end if;
  if project_status <> 'draft' or task_status <> 'todo' then
    raise exception 'Only todo tasks in draft projects can be edited';
  end if;
  if draft_due_date is null or draft_due_date < project_start_date or draft_due_date > project_end_date then
    raise exception 'Task due date must be within the project dates';
  end if;
  if not exists (
    select 1
    from public.project_member_profiles as member
    where member.project_id = draft_project_id
      and member.user_id = draft_assigned_user_id
  ) then
    raise exception 'Assignee must be a project member';
  end if;

  update public.tasks
  set title = trim(draft_title),
      due_date = draft_due_date,
      priority = draft_priority
  where id = draft_task_id;

  insert into public.task_assignments(task_id, user_id, assigned_reason)
  values (draft_task_id, draft_assigned_user_id, 'Assigned during draft plan review')
  on conflict (task_id) do update
  set user_id = excluded.user_id;

  insert into public.audit_logs(project_id, user_id, action, details)
  values (
    draft_project_id,
    caller_id,
    'draft_task_updated',
    jsonb_build_object('task_id', draft_task_id, 'assigned_user_id', draft_assigned_user_id)
  );
end;
$$;

create or replace function public.attach_dispute_recommendation(
  dispute_id uuid,
  recommendation jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  disputed_task_id uuid;
  task_project_id uuid;
  dispute_status text;
  dispute_opened_by uuid;
  task_status text;
  project_status text;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;
  if recommendation is null or jsonb_typeof(recommendation) <> 'object' then
    raise exception 'Recommendation must be a JSON object';
  end if;

  select dispute.task_id, task.project_id, dispute.status, dispute.opened_by, task.status, project.status
  into disputed_task_id, task_project_id, dispute_status, dispute_opened_by, task_status, project_status
  from public.disputes as dispute
  join public.tasks as task on task.id = dispute.task_id
  join public.projects as project on project.id = task.project_id
  where dispute.id = $1
  for update of dispute, task;

  if disputed_task_id is null then
    raise exception 'Dispute not found';
  end if;
  if dispute_status <> 'open' or dispute_opened_by <> caller_id then
    raise exception 'Only the opener can attach a recommendation to an open dispute';
  end if;
  if not private.is_project_member(task_project_id, caller_id) then
    raise exception 'Not a project member';
  end if;
  if not exists (
    select 1
    from public.task_assignments as assignment
    where assignment.task_id = disputed_task_id
      and assignment.user_id = caller_id
  ) then
    raise exception 'Only the task assignee can continue this dispute';
  end if;
  if project_status <> 'active' then
    raise exception 'Only disputes in active projects can be continued';
  end if;
  if task_status not in ('rejected', 'disputed') then
    raise exception 'Only rejected tasks can enter dispute';
  end if;

  update public.disputes
  set ai_recommendation = $2
  where id = $1;

  if task_status = 'rejected' then
    update public.tasks
    set status = 'disputed',
        approved_at = null
    where id = disputed_task_id;

    insert into public.audit_logs(project_id, user_id, action, details)
    values (
      task_project_id,
      caller_id,
      'task_disputed',
      jsonb_build_object(
        'task_id', disputed_task_id,
        'dispute_id', $1,
        'from_status', task_status,
        'to_status', 'disputed'
      )
    );
  end if;
end;
$$;

create or replace function public.resolve_project_dispute(
  dispute_id uuid,
  resolution text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  disputed_task_id uuid;
  task_project_id uuid;
  dispute_status text;
  task_status text;
  project_status text;
  next_task_status text;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;
  if resolution is null or resolution not in ('approve', 'needs_changes', 'reject') then
    raise exception 'Invalid dispute resolution';
  end if;

  next_task_status := case resolution
    when 'approve' then 'approved'
    when 'reject' then 'rejected'
    else 'needs_changes'
  end;

  select dispute.task_id, task.project_id, dispute.status, task.status, project.status
  into disputed_task_id, task_project_id, dispute_status, task_status, project_status
  from public.disputes as dispute
  join public.tasks as task on task.id = dispute.task_id
  join public.projects as project on project.id = task.project_id
  where dispute.id = $1
  for update of dispute, task;

  if disputed_task_id is null then
    raise exception 'Dispute not found';
  end if;
  if not private.is_project_member(task_project_id, caller_id) then
    raise exception 'Not a project member';
  end if;
  if not private.is_project_owner(task_project_id, caller_id) then
    raise exception 'Only the project owner can resolve this dispute';
  end if;
  if project_status <> 'active' then
    raise exception 'Only disputes in active projects can be resolved';
  end if;
  if dispute_status <> 'open' or task_status not in ('rejected', 'disputed') then
    raise exception 'Dispute and task are not in a resolvable state';
  end if;

  update public.disputes
  set status = 'resolved',
      final_resolution = resolution
  where id = $1;

  update public.tasks
  set status = next_task_status,
      approved_at = case when next_task_status = 'approved' then now() else null end
  where id = disputed_task_id;

  insert into public.audit_logs(project_id, user_id, action, details)
  values (
    task_project_id,
    caller_id,
    'dispute_resolved',
    jsonb_build_object(
      'task_id', disputed_task_id,
      'dispute_id', $1,
      'resolution', resolution,
      'from_status', task_status,
      'to_status', next_task_status
    )
  );

  return disputed_task_id;
end;
$$;

revoke all on function public.start_task(uuid) from public, anon, authenticated;
revoke all on function public.reopen_task_after_changes(uuid) from public, anon, authenticated;
revoke all on function public.submit_task(uuid) from public, anon, authenticated;
revoke all on function public.review_submitted_task(uuid, text, text) from public, anon, authenticated;
revoke all on function public.update_draft_task(uuid, uuid, text, date, text, uuid) from public, anon, authenticated;
revoke all on function public.attach_dispute_recommendation(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.resolve_project_dispute(uuid, text) from public, anon, authenticated;

grant execute on function public.start_task(uuid) to authenticated, service_role;
grant execute on function public.reopen_task_after_changes(uuid) to authenticated, service_role;
grant execute on function public.submit_task(uuid) to authenticated, service_role;
grant execute on function public.review_submitted_task(uuid, text, text) to authenticated, service_role;
grant execute on function public.update_draft_task(uuid, uuid, text, date, text, uuid) to authenticated, service_role;
grant execute on function public.attach_dispute_recommendation(uuid, jsonb) to authenticated, service_role;
grant execute on function public.resolve_project_dispute(uuid, text) to authenticated, service_role;
