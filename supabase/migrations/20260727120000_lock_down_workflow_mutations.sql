-- Keep security-sensitive workflow writes behind narrow, validated functions.

create or replace function public.start_project(target_project_id pg_catalog.uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id pg_catalog.uuid := auth.uid();
  current_status pg_catalog.text;
  project_team_id pg_catalog.uuid;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  select status, team_id
  into current_status, project_team_id
  from public.projects
  where id = target_project_id
    and created_by = caller_id
  for update;

  if current_status is null then
    raise exception 'Project not found or caller is not the owner';
  end if;
  if current_status <> 'draft' then
    raise exception 'Only draft projects can be started';
  end if;
  if not exists (
    select 1 from public.tasks where project_id = target_project_id
  ) then
    raise exception 'Generate at least one task before starting';
  end if;
  if exists (
    select 1
    from public.projects
    where team_id = project_team_id
      and id <> target_project_id
      and status = 'active'
  ) then
    raise exception 'This beta team already has an active project';
  end if;

  update public.projects
  set status = 'active'
  where id = target_project_id;

  insert into public.audit_logs(project_id, user_id, action, details)
  values (
    target_project_id,
    caller_id,
    'project_started',
    pg_catalog.jsonb_build_object('from_status', current_status, 'to_status', 'active')
  );
end;
$$;

create or replace function public.open_project_dispute(
  target_task_id pg_catalog.uuid,
  dispute_reason pg_catalog.text,
  performer_argument pg_catalog.text,
  rejection_reason pg_catalog.text
)
returns pg_catalog.uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id pg_catalog.uuid := auth.uid();
  task_project_id pg_catalog.uuid;
  task_status pg_catalog.text;
  project_status pg_catalog.text;
  created_dispute_id pg_catalog.uuid;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  dispute_reason := pg_catalog.btrim(coalesce(dispute_reason, ''));
  performer_argument := pg_catalog.btrim(coalesce(performer_argument, ''));
  rejection_reason := pg_catalog.btrim(coalesce(rejection_reason, ''));
  if pg_catalog.char_length(dispute_reason) not between 3 and 4000 then
    raise exception 'Dispute reason must be between 3 and 4000 characters';
  end if;
  if pg_catalog.char_length(performer_argument) not between 3 and 8000 then
    raise exception 'Performer explanation must be between 3 and 8000 characters';
  end if;
  if pg_catalog.char_length(rejection_reason) not between 1 and 8000 then
    raise exception 'A reviewer rejection reason is required';
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
  if task_status <> 'rejected' or project_status <> 'active' then
    raise exception 'Only rejected tasks in active projects can be disputed';
  end if;
  if not exists (
    select 1
    from public.task_assignments
    where task_id = target_task_id
      and user_id = caller_id
  ) then
    raise exception 'Only the task assignee can open a dispute';
  end if;
  if exists (
    select 1 from public.disputes
    where task_id = target_task_id and status = 'open'
  ) then
    raise exception 'This task already has an open dispute';
  end if;

  insert into public.disputes(
    task_id,
    opened_by,
    reason,
    performer_explanation,
    reviewer_rejection_reason
  )
  values (
    target_task_id,
    caller_id,
    dispute_reason,
    performer_argument,
    rejection_reason
  )
  returning id into created_dispute_id;

  insert into public.audit_logs(project_id, user_id, action, details)
  values (
    task_project_id,
    caller_id,
    'dispute_opened',
    pg_catalog.jsonb_build_object(
      'task_id', target_task_id,
      'dispute_id', created_dispute_id
    )
  );

  return created_dispute_id;
end;
$$;

create or replace function public.attach_dispute_recommendation_server(
  target_dispute_id pg_catalog.uuid,
  actor_id pg_catalog.uuid,
  recommendation pg_catalog.jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  disputed_task_id pg_catalog.uuid;
  task_project_id pg_catalog.uuid;
  dispute_status pg_catalog.text;
  dispute_opened_by pg_catalog.uuid;
  task_status pg_catalog.text;
  project_status pg_catalog.text;
begin
  if recommendation is null
    or pg_catalog.jsonb_typeof(recommendation) <> 'object'
    or recommendation->>'recommended_resolution' not in (
      'approve',
      'reject',
      'partial_credit',
      'needs_changes',
      'extend_deadline',
      'manual_review'
    )
    or pg_catalog.jsonb_typeof(recommendation->'missing_information') <> 'array'
    or pg_catalog.jsonb_typeof(recommendation->'arguments_for_approval') <> 'array'
    or pg_catalog.jsonb_typeof(recommendation->'arguments_for_rejection') <> 'array'
  then
    raise exception 'Invalid AI recommendation';
  end if;

  select dispute.task_id, task.project_id, dispute.status, dispute.opened_by,
         task.status, project.status
  into disputed_task_id, task_project_id, dispute_status, dispute_opened_by,
       task_status, project_status
  from public.disputes as dispute
  join public.tasks as task on task.id = dispute.task_id
  join public.projects as project on project.id = task.project_id
  where dispute.id = target_dispute_id
  for update of dispute, task;

  if disputed_task_id is null then
    raise exception 'Dispute not found';
  end if;
  if dispute_status <> 'open' or dispute_opened_by <> actor_id then
    raise exception 'Only the opener can continue an open dispute';
  end if;
  if project_status <> 'active' or task_status <> 'rejected' then
    raise exception 'Only a rejected task in an active project can enter dispute';
  end if;
  if not exists (
    select 1 from public.task_assignments
    where task_id = disputed_task_id and user_id = actor_id
  ) then
    raise exception 'Only the task assignee can continue this dispute';
  end if;

  update public.disputes
  set ai_recommendation = recommendation
  where id = target_dispute_id;

  update public.tasks
  set status = 'disputed',
      approved_at = null
  where id = disputed_task_id;

  insert into public.audit_logs(project_id, user_id, action, details)
  values (
    task_project_id,
    actor_id,
    'task_disputed',
    pg_catalog.jsonb_build_object(
      'task_id', disputed_task_id,
      'dispute_id', target_dispute_id,
      'from_status', task_status,
      'to_status', 'disputed'
    )
  );
end;
$$;

create or replace function public.delete_draft_project(target_project_id pg_catalog.uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id pg_catalog.uuid := auth.uid();
  current_status pg_catalog.text;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  select status into current_status
  from public.projects
  where id = target_project_id and created_by = caller_id
  for update;

  if current_status is null then
    raise exception 'Project not found or caller is not the owner';
  end if;
  if current_status <> 'draft' then
    raise exception 'Only draft projects can be deleted';
  end if;
  if exists (
    select 1
    from public.evidence
    join public.tasks on tasks.id = evidence.task_id
    where tasks.project_id = target_project_id
  ) then
    raise exception 'Projects with evidence cannot be deleted';
  end if;

  delete from public.projects where id = target_project_id;
end;
$$;

drop policy if exists "owner updates projects" on public.projects;
drop policy if exists "owner updates non-final projects" on public.projects;
revoke update, delete on table public.projects from authenticated;

drop policy if exists "other members add reviews" on public.reviews;
revoke insert, update, delete on table public.reviews from authenticated;

drop policy if exists "assignee opens disputes" on public.disputes;
drop policy if exists "owner resolves disputes" on public.disputes;
revoke insert, update, delete on table public.disputes from authenticated;

drop policy if exists "users update own ordinary evidence" on public.evidence;
revoke update on table public.evidence from authenticated;

drop policy if exists "users upload evidence files" on storage.objects;
drop policy if exists "users delete own evidence files" on storage.objects;

drop policy if exists "owner creates ai reports" on public.ai_reports;
revoke insert, update, delete on table public.ai_reports from authenticated;

revoke all on function public.attach_dispute_recommendation(
  pg_catalog.uuid,
  pg_catalog.jsonb
) from public, anon, authenticated;

revoke all on function public.start_project(pg_catalog.uuid)
  from public, anon, authenticated;
grant execute on function public.start_project(pg_catalog.uuid)
  to authenticated;

revoke all on function public.open_project_dispute(
  pg_catalog.uuid,
  pg_catalog.text,
  pg_catalog.text,
  pg_catalog.text
) from public, anon, authenticated;
grant execute on function public.open_project_dispute(
  pg_catalog.uuid,
  pg_catalog.text,
  pg_catalog.text,
  pg_catalog.text
) to authenticated;

revoke all on function public.attach_dispute_recommendation_server(
  pg_catalog.uuid,
  pg_catalog.uuid,
  pg_catalog.jsonb
) from public, anon, authenticated;
grant execute on function public.attach_dispute_recommendation_server(
  pg_catalog.uuid,
  pg_catalog.uuid,
  pg_catalog.jsonb
) to service_role;

revoke all on function public.delete_draft_project(pg_catalog.uuid)
  from public, anon, authenticated;
grant execute on function public.delete_draft_project(pg_catalog.uuid)
  to authenticated;
