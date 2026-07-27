alter table public.ai_reports
  add column if not exists provider pg_catalog.text not null default 'legacy';

alter table public.ai_reports
  add column if not exists created_by pg_catalog.uuid
    references public.profiles(id);

alter table public.ai_reports
  add constraint ai_reports_provider_format
  check (
    pg_catalog.char_length(provider) between 1 and 64
    and provider ~ '^[a-z0-9][a-z0-9._-]*$'
  );

create table private.ai_plan_replacement_requests (
  project_id pg_catalog.uuid not null
    references public.projects(id) on delete cascade,
  idempotency_key pg_catalog.uuid not null,
  created_by pg_catalog.uuid not null references public.profiles(id),
  payload_hash pg_catalog.text not null
    check (payload_hash ~ '^[0-9a-f]{64}$'),
  request_fingerprint pg_catalog.text not null
    check (request_fingerprint ~ '^[0-9a-f]{64}$'),
  ai_report_id pg_catalog.uuid not null unique
    references public.ai_reports(id),
  result pg_catalog.jsonb not null,
  created_at pg_catalog.timestamptz not null default pg_catalog.now(),
  primary key (project_id, idempotency_key)
);

alter table private.ai_plan_replacement_requests enable row level security;
revoke all on table private.ai_plan_replacement_requests
  from public, anon, authenticated;
grant select on table private.ai_plan_replacement_requests to service_role;

create or replace function private.is_bounded_ai_plan_text_array(
  input_value pg_catalog.jsonb,
  minimum_items pg_catalog.int4,
  maximum_items pg_catalog.int4,
  maximum_value_length pg_catalog.int4
)
returns pg_catalog.bool
language plpgsql
immutable
set search_path = ''
as $$
declare
  item_count pg_catalog.int4;
begin
  if input_value is null
    or pg_catalog.jsonb_typeof(input_value) <> 'array'
  then
    return false;
  end if;

  item_count := pg_catalog.jsonb_array_length(input_value);
  if item_count < minimum_items or item_count > maximum_items then
    return false;
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(input_value) as item(value)
    where pg_catalog.jsonb_typeof(item.value) <> 'string'
  ) then
    return false;
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_array_elements_text(input_value) as item(value)
    where pg_catalog.char_length(pg_catalog.btrim(item.value)) = 0
      or pg_catalog.char_length(pg_catalog.btrim(item.value))
        > maximum_value_length
  ) then
    return false;
  end if;

  return true;
end;
$$;

revoke all on function private.is_bounded_ai_plan_text_array(
  pg_catalog.jsonb,
  pg_catalog.int4,
  pg_catalog.int4,
  pg_catalog.int4
) from public, anon, authenticated;

-- This is deliberately SECURITY DEFINER: authenticated callers are not allowed
-- to write generated plans directly. Every privileged write is preceded by
-- auth.uid(), ownership, project membership, state and payload checks. An empty
-- search_path prevents caller-controlled object resolution.
create or replace function public.replace_ai_project_plan(
  p_project_id pg_catalog.uuid,
  p_idempotency_key pg_catalog.uuid,
  p_plan pg_catalog.jsonb,
  p_ai_provider pg_catalog.text,
  p_ai_model pg_catalog.text,
  p_input_snapshot pg_catalog.jsonb,
  p_payload_hash pg_catalog.text
)
returns pg_catalog.jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id pg_catalog.uuid := auth.uid();
  project_team_id pg_catalog.uuid;
  project_owner_id pg_catalog.uuid;
  project_status pg_catalog.text;
  project_start_date pg_catalog.date;
  project_end_date pg_catalog.date;
  plan_task pg_catalog.jsonb;
  plan_phase pg_catalog.jsonb;
  task_id pg_catalog.uuid;
  task_assignee_id pg_catalog.uuid;
  task_assignee_text pg_catalog.text;
  task_due_date pg_catalog.date;
  task_count pg_catalog.int4;
  task_key_count pg_catalog.int8;
  phase_key_count pg_catalog.int8;
  normalized_title pg_catalog.text;
  normalized_titles pg_catalog.text[] := '{}'::pg_catalog.text[];
  evidence_types pg_catalog.text[];
  new_task_ids pg_catalog.uuid[] := '{}'::pg_catalog.uuid[];
  report_id pg_catalog.uuid;
  request_fingerprint pg_catalog.text;
  existing_created_by pg_catalog.uuid;
  existing_payload_hash pg_catalog.text;
  existing_request_fingerprint pg_catalog.text;
  existing_result pg_catalog.jsonb;
  result_payload pg_catalog.jsonb;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;
  if p_project_id is null then
    raise exception 'Project ID is required';
  end if;
  if p_idempotency_key is null then
    raise exception 'Idempotency key is required';
  end if;

  p_ai_provider := pg_catalog.lower(
    pg_catalog.btrim(coalesce(p_ai_provider, ''))
  );
  p_ai_model := pg_catalog.btrim(coalesce(p_ai_model, ''));
  p_payload_hash := pg_catalog.lower(
    pg_catalog.btrim(coalesce(p_payload_hash, ''))
  );

  if p_ai_provider !~ '^[a-z0-9][a-z0-9._-]{0,63}$' then
    raise exception 'AI provider metadata is invalid';
  end if;
  if pg_catalog.char_length(p_ai_model) not between 1 and 200 then
    raise exception 'AI model metadata is invalid';
  end if;
  if p_payload_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Payload hash must be a SHA-256 hex digest';
  end if;
  if p_input_snapshot is null
    or pg_catalog.jsonb_typeof(p_input_snapshot) <> 'object'
    or pg_catalog.octet_length(p_input_snapshot::pg_catalog.text) > 262144
  then
    raise exception 'AI input snapshot is invalid or too large';
  end if;
  if p_plan is null
    or pg_catalog.jsonb_typeof(p_plan) <> 'object'
    or pg_catalog.octet_length(p_plan::pg_catalog.text) > 262144
  then
    raise exception 'AI plan payload is invalid or too large';
  end if;

  select pg_catalog.count(*)
  into task_key_count
  from pg_catalog.jsonb_object_keys(p_plan) as item(key)
  where item.key in (
    'phases',
    'deliverables',
    'tasks',
    'risks',
    'minimum_success_version',
    'ambitious_success_version'
  );
  if task_key_count <> 6 or (
    select pg_catalog.count(*)
    from pg_catalog.jsonb_object_keys(p_plan) as item(key)
  ) <> 6 then
    raise exception 'AI plan has missing or unsupported fields';
  end if;

  if not private.is_bounded_ai_plan_text_array(
    p_plan -> 'deliverables',
    0,
    50,
    500
  ) or not private.is_bounded_ai_plan_text_array(
    p_plan -> 'risks',
    0,
    50,
    1000
  ) then
    raise exception 'AI plan deliverables or risks are malformed';
  end if;

  if pg_catalog.jsonb_typeof(p_plan -> 'minimum_success_version') <> 'string'
    or pg_catalog.char_length(
      pg_catalog.btrim(p_plan ->> 'minimum_success_version')
    ) not between 1 and 4000
    or pg_catalog.jsonb_typeof(p_plan -> 'ambitious_success_version') <> 'string'
    or pg_catalog.char_length(
      pg_catalog.btrim(p_plan ->> 'ambitious_success_version')
    ) not between 1 and 4000
  then
    raise exception 'AI plan success versions are malformed';
  end if;

  if p_plan -> 'phases' is null
    or pg_catalog.jsonb_typeof(p_plan -> 'phases') <> 'array'
    or pg_catalog.jsonb_array_length(p_plan -> 'phases') > 20
  then
    raise exception 'AI plan phases are malformed';
  end if;

  for plan_phase in
    select item.value
    from pg_catalog.jsonb_array_elements(p_plan -> 'phases') as item(value)
  loop
    if pg_catalog.jsonb_typeof(plan_phase) <> 'object' then
      raise exception 'Every AI plan phase must be an object';
    end if;
    select pg_catalog.count(*)
    into phase_key_count
    from pg_catalog.jsonb_object_keys(plan_phase) as item(key)
    where item.key in ('name', 'description');
    if phase_key_count <> 2 or (
      select pg_catalog.count(*)
      from pg_catalog.jsonb_object_keys(plan_phase) as item(key)
    ) <> 2
      or pg_catalog.jsonb_typeof(plan_phase -> 'name') <> 'string'
      or pg_catalog.char_length(
        pg_catalog.btrim(plan_phase ->> 'name')
      ) not between 1 and 120
      or pg_catalog.jsonb_typeof(plan_phase -> 'description') <> 'string'
      or pg_catalog.char_length(
        pg_catalog.btrim(plan_phase ->> 'description')
      ) not between 1 and 2000
    then
      raise exception 'Every AI plan phase must have a valid name and description';
    end if;
  end loop;

  if p_plan -> 'tasks' is null
    or pg_catalog.jsonb_typeof(p_plan -> 'tasks') <> 'array'
  then
    raise exception 'AI plan tasks must be an array';
  end if;
  task_count := pg_catalog.jsonb_array_length(p_plan -> 'tasks');
  if task_count not between 1 and 50 then
    raise exception 'AI plan must contain between 1 and 50 tasks';
  end if;

  -- Validate every model-controlled field before acquiring the project lock or
  -- changing any persisted plan data.
  for plan_task in
    select item.value
    from pg_catalog.jsonb_array_elements(p_plan -> 'tasks') as item(value)
  loop
    if pg_catalog.jsonb_typeof(plan_task) <> 'object' then
      raise exception 'Every AI task must be an object';
    end if;
    select pg_catalog.count(*)
    into task_key_count
    from pg_catalog.jsonb_object_keys(plan_task) as item(key)
    where item.key in (
      'title',
      'description',
      'assigned_user_id',
      'assigned_reason',
      'priority',
      'due_date',
      'acceptance_criteria',
      'expected_evidence_types'
    );
    if task_key_count <> 8 or (
      select pg_catalog.count(*)
      from pg_catalog.jsonb_object_keys(plan_task) as item(key)
    ) <> 8 then
      raise exception 'AI task has missing or unsupported fields';
    end if;

    if pg_catalog.jsonb_typeof(plan_task -> 'title') <> 'string'
      or pg_catalog.char_length(
        pg_catalog.btrim(plan_task ->> 'title')
      ) not between 2 and 120
      or pg_catalog.jsonb_typeof(plan_task -> 'description') <> 'string'
      or pg_catalog.char_length(
        pg_catalog.btrim(plan_task ->> 'description')
      ) not between 1 and 4000
      or pg_catalog.jsonb_typeof(plan_task -> 'assigned_reason') <> 'string'
      or pg_catalog.char_length(
        pg_catalog.btrim(plan_task ->> 'assigned_reason')
      ) not between 1 and 2000
    then
      raise exception 'AI task text fields are malformed';
    end if;

    normalized_title := pg_catalog.lower(
      pg_catalog.btrim(plan_task ->> 'title')
    );
    if pg_catalog.array_position(normalized_titles, normalized_title)
      is not null
    then
      raise exception 'AI task titles must be unique';
    end if;
    normalized_titles := pg_catalog.array_append(
      normalized_titles,
      normalized_title
    );

    if pg_catalog.jsonb_typeof(plan_task -> 'priority') <> 'string'
      or plan_task ->> 'priority'
        not in ('low', 'medium', 'high', 'critical')
    then
      raise exception 'AI task priority is invalid';
    end if;

    if pg_catalog.jsonb_typeof(plan_task -> 'assigned_user_id') <> 'string'
    then
      raise exception 'AI task assignee must be a UUID string';
    end if;
    task_assignee_text := plan_task ->> 'assigned_user_id';
    if not pg_catalog.pg_input_is_valid(
      task_assignee_text,
      'pg_catalog.uuid'
    ) then
      raise exception 'AI task assignee must be a valid UUID';
    end if;

    if pg_catalog.jsonb_typeof(plan_task -> 'due_date') <> 'string'
      or not pg_catalog.pg_input_is_valid(
        plan_task ->> 'due_date',
        'pg_catalog.date'
      )
    then
      raise exception 'AI task due date is invalid';
    end if;

    if not private.is_bounded_ai_plan_text_array(
      plan_task -> 'acceptance_criteria',
      1,
      20,
      500
    ) or not private.is_bounded_ai_plan_text_array(
      plan_task -> 'expected_evidence_types',
      1,
      20,
      120
    ) then
      raise exception 'AI task criteria or evidence types are malformed';
    end if;
  end loop;

  request_fingerprint := pg_catalog.encode(
    extensions.digest(
      pg_catalog.jsonb_build_object(
        'project_id',
        p_project_id,
        'plan',
        p_plan,
        'provider',
        p_ai_provider,
        'model',
        p_ai_model,
        'input_snapshot',
        p_input_snapshot
      )::pg_catalog.text,
      'sha256'
    ),
    'hex'
  );

  -- All replacements for one project serialize on this row. The lock is held
  -- until the surrounding PostgREST transaction commits or rolls back.
  select
    project.team_id,
    project.created_by,
    project.status,
    project.start_date,
    project.end_date
  into
    project_team_id,
    project_owner_id,
    project_status,
    project_start_date,
    project_end_date
  from public.projects as project
  where project.id = p_project_id
  for update;

  if not found then
    raise exception 'Project not found';
  end if;
  if project_owner_id <> caller_id then
    raise exception 'Only the project owner can replace the AI plan';
  end if;
  if not exists (
    select 1
    from public.team_members as membership
    where membership.team_id = project_team_id
      and membership.user_id = caller_id
      and membership.role in ('owner', 'member')
  ) then
    raise exception 'Project does not belong to the caller team';
  end if;
  if not exists (
    select 1
    from public.project_member_profiles as profile
    where profile.project_id = p_project_id
      and profile.user_id = caller_id
  ) then
    raise exception 'Project owner is not a project member';
  end if;

  select
    request.created_by,
    request.payload_hash,
    request.request_fingerprint,
    request.result
  into
    existing_created_by,
    existing_payload_hash,
    existing_request_fingerprint,
    existing_result
  from private.ai_plan_replacement_requests as request
  where request.project_id = p_project_id
    and request.idempotency_key = p_idempotency_key;

  if existing_result is not null then
    if existing_created_by = caller_id
      and existing_payload_hash = p_payload_hash
      and existing_request_fingerprint = request_fingerprint
    then
      return existing_result
        OPERATOR(pg_catalog.||)
        pg_catalog.jsonb_build_object('replayed', true);
    end if;
    raise exception 'Idempotency key was already used with different plan data';
  end if;

  if project_status <> 'draft' then
    raise exception 'Only draft projects can replace the AI plan';
  end if;

  for plan_task in
    select item.value
    from pg_catalog.jsonb_array_elements(p_plan -> 'tasks') as item(value)
  loop
    task_assignee_id := (plan_task ->> 'assigned_user_id')::pg_catalog.uuid;
    if not exists (
      select 1
      from public.project_member_profiles as profile
      where profile.project_id = p_project_id
        and profile.user_id = task_assignee_id
    ) then
      raise exception 'Every AI task assignee must belong to this project';
    end if;

    task_due_date := (plan_task ->> 'due_date')::pg_catalog.date;
    if task_due_date < project_start_date
      or task_due_date > project_end_date
    then
      raise exception 'Every AI task due date must fall within project dates';
    end if;
  end loop;

  -- Draft-only replacement still refuses to cascade-delete any generated task
  -- that has acquired workflow history through a direct or legacy write.
  if exists (
    select 1
    from public.tasks as old_task
    where old_task.project_id = p_project_id
      and old_task.ai_generated
      and (
        old_task.status <> 'todo'
        or exists (
          select 1
          from public.evidence as evidence
          where evidence.task_id = old_task.id
        )
        or exists (
          select 1
          from public.reviews as review
          where review.task_id = old_task.id
        )
        or exists (
          select 1
          from public.disputes as dispute
          where dispute.task_id = old_task.id
        )
        or exists (
          select 1
          from public.daily_log_tasks as log_task
          where log_task.task_id = old_task.id
        )
      )
  ) then
    raise exception 'AI plan cannot be replaced after generated task activity exists';
  end if;

  insert into public.ai_reports (
    project_id,
    type,
    input_snapshot,
    output,
    provider,
    model,
    created_by
  )
  values (
    p_project_id,
    'plan',
    p_input_snapshot,
    p_plan,
    p_ai_provider,
    p_ai_model,
    caller_id
  )
  returning id into report_id;

  for plan_task in
    select item.value
    from pg_catalog.jsonb_array_elements(p_plan -> 'tasks') as item(value)
  loop
    select pg_catalog.array_agg(item.value order by item.ordinality)
    into evidence_types
    from pg_catalog.jsonb_array_elements_text(
      plan_task -> 'expected_evidence_types'
    ) with ordinality as item(value, ordinality);

    insert into public.tasks (
      project_id,
      title,
      description,
      acceptance_criteria,
      expected_evidence_types,
      priority,
      due_date,
      status,
      ai_generated
    )
    values (
      p_project_id,
      pg_catalog.btrim(plan_task ->> 'title'),
      pg_catalog.btrim(plan_task ->> 'description'),
      plan_task -> 'acceptance_criteria',
      evidence_types,
      plan_task ->> 'priority',
      (plan_task ->> 'due_date')::pg_catalog.date,
      'todo',
      true
    )
    returning id into task_id;

    new_task_ids := pg_catalog.array_append(new_task_ids, task_id);

    insert into public.task_assignments (
      task_id,
      user_id,
      assigned_reason
    )
    values (
      task_id,
      (plan_task ->> 'assigned_user_id')::pg_catalog.uuid,
      pg_catalog.btrim(plan_task ->> 'assigned_reason')
    );
  end loop;

  insert into public.audit_logs (
    project_id,
    user_id,
    action,
    details
  )
  values (
    p_project_id,
    caller_id,
    'ai_plan_generated',
    pg_catalog.jsonb_build_object(
      'idempotency_key',
      p_idempotency_key,
      'report_id',
      report_id,
      'task_count',
      task_count,
      'provider',
      p_ai_provider,
      'model',
      p_ai_model
    )
  );

  -- New report, tasks, assignments and audit are all valid at this point.
  -- Removing the old generated tasks last makes the replacement semantics
  -- explicit; any later failure still rolls the complete statement back.
  delete from public.tasks as old_task
  where old_task.project_id = p_project_id
    and old_task.ai_generated
    and not (old_task.id = any(new_task_ids));

  result_payload := pg_catalog.jsonb_build_object(
    'project_id',
    p_project_id,
    'idempotency_key',
    p_idempotency_key,
    'ai_report_id',
    report_id,
    'task_ids',
    pg_catalog.to_jsonb(new_task_ids),
    'task_count',
    task_count,
    'replayed',
    false
  );

  insert into private.ai_plan_replacement_requests (
    project_id,
    idempotency_key,
    created_by,
    payload_hash,
    request_fingerprint,
    ai_report_id,
    result
  )
  values (
    p_project_id,
    p_idempotency_key,
    caller_id,
    p_payload_hash,
    request_fingerprint,
    report_id,
    result_payload
  );

  return result_payload;
end;
$$;

comment on function public.replace_ai_project_plan(
  pg_catalog.uuid,
  pg_catalog.uuid,
  pg_catalog.jsonb,
  pg_catalog.text,
  pg_catalog.text,
  pg_catalog.jsonb,
  pg_catalog.text
) is
  'Atomically validates and replaces a draft project AI plan for its owner.';

drop policy if exists "owner creates tasks" on public.tasks;
create policy "owner creates manual draft tasks"
on public.tasks
for insert
to authenticated
with check (
  not ai_generated
  and (select private.is_project_owner(project_id))
  and exists (
    select 1
    from public.projects as project
    where project.id = tasks.project_id
      and project.status = 'draft'
  )
);

drop policy if exists "owner deletes draft tasks" on public.tasks;
create policy "owner deletes manual draft tasks"
on public.tasks
for delete
to authenticated
using (
  not ai_generated
  and (select private.is_project_owner(project_id))
  and exists (
    select 1
    from public.projects as project
    where project.id = tasks.project_id
      and project.status = 'draft'
  )
);

drop policy if exists "owner manages assignments" on public.task_assignments;
create policy "owner inserts manual draft assignments"
on public.task_assignments
for insert
to authenticated
with check (
  exists (
    select 1
    from public.tasks as task
    join public.projects as project on project.id = task.project_id
    join public.project_member_profiles as profile
      on profile.project_id = task.project_id
     and profile.user_id = task_assignments.user_id
    where task.id = task_assignments.task_id
      and not task.ai_generated
      and project.status = 'draft'
      and project.created_by = (select auth.uid())
  )
);

create policy "owner updates manual draft assignments"
on public.task_assignments
for update
to authenticated
using (
  exists (
    select 1
    from public.tasks as task
    join public.projects as project on project.id = task.project_id
    where task.id = task_assignments.task_id
      and not task.ai_generated
      and project.status = 'draft'
      and project.created_by = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.tasks as task
    join public.projects as project on project.id = task.project_id
    join public.project_member_profiles as profile
      on profile.project_id = task.project_id
     and profile.user_id = task_assignments.user_id
    where task.id = task_assignments.task_id
      and not task.ai_generated
      and project.status = 'draft'
      and project.created_by = (select auth.uid())
  )
);

create policy "owner deletes manual draft assignments"
on public.task_assignments
for delete
to authenticated
using (
  exists (
    select 1
    from public.tasks as task
    join public.projects as project on project.id = task.project_id
    where task.id = task_assignments.task_id
      and not task.ai_generated
      and project.status = 'draft'
      and project.created_by = (select auth.uid())
  )
);

drop policy if exists "owner creates ai reports" on public.ai_reports;
create policy "owner creates non-plan ai reports"
on public.ai_reports
for insert
to authenticated
with check (
  type <> 'plan'
  and (select private.is_project_owner(project_id))
);

drop policy if exists "members add non-creation audit" on public.audit_logs;
create policy "members add non-generated audit"
on public.audit_logs
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and action not in ('project_created', 'ai_plan_generated')
  and (
    project_id is null
    or (select private.is_project_member(project_id))
  )
);

revoke all on function public.replace_ai_project_plan(
  pg_catalog.uuid,
  pg_catalog.uuid,
  pg_catalog.jsonb,
  pg_catalog.text,
  pg_catalog.text,
  pg_catalog.jsonb,
  pg_catalog.text
) from public, anon, authenticated;

grant execute on function public.replace_ai_project_plan(
  pg_catalog.uuid,
  pg_catalog.uuid,
  pg_catalog.jsonb,
  pg_catalog.text,
  pg_catalog.text,
  pg_catalog.jsonb,
  pg_catalog.text
) to authenticated;
