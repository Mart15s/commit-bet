-- Refuse to hide legacy partial finalizations. These rows require an explicit
-- data correction before the all-or-nothing invariant can be enabled.
do $migration_precondition$
begin
  if exists (
    select 1
    from public.final_decisions as decision
    join public.projects as project on project.id = decision.project_id
    where project.status <> 'completed'
  ) then
    raise exception using
      message = 'Atomic finalization migration blocked: a final decision exists for a project that is not completed',
      hint = 'Correct the project and pledge state explicitly before retrying this migration.';
  end if;

  if exists (
    select 1
    from public.projects as project
    where project.status = 'completed'
      and not exists (
        select 1
        from public.final_decisions as decision
        where decision.project_id = project.id
      )
  ) then
    raise exception using
      message = 'Atomic finalization migration blocked: a completed project has no final decision',
      hint = 'Correct the project state explicitly before retrying this migration.';
  end if;

  if exists (
    select 1
    from public.final_decisions as decision
    where (
      select pg_catalog.count(*)
      from public.project_member_profiles as member
      where member.project_id = decision.project_id
    ) = 0
    or (
      select pg_catalog.count(*)
      from public.pledges as pledge
      where pledge.project_id = decision.project_id
        and pledge.status = 'confirmed'
    ) <> (
      select pg_catalog.count(*)
      from public.project_member_profiles as member
      where member.project_id = decision.project_id
    )
    or exists (
      select 1
      from public.pledges as pledge
      where pledge.project_id = decision.project_id
        and not exists (
          select 1
          from public.project_member_profiles as member
          where member.project_id = pledge.project_id
            and member.user_id = pledge.user_id
        )
    )
  ) then
    raise exception using
      message = 'Atomic finalization migration blocked: a legacy final decision has missing, foreign, or unresolved pledges',
      hint = 'Correct pledge coverage and status explicitly; this migration never invents pledge outcomes.';
  end if;
end;
$migration_precondition$;

alter table public.final_decisions
  add column final_report_id pg_catalog.uuid
    references public.ai_reports(id) on delete restrict,
  add column confirmation_note pg_catalog.text;

alter table public.final_decisions
  add constraint final_decisions_confirmation_note_length
  check (
    confirmation_note is null
    or pg_catalog.char_length(confirmation_note) <= 2000
  );

create index final_decisions_final_report_idx
  on public.final_decisions(final_report_id)
  where final_report_id is not null;

create table private.project_finalization_requests (
  project_id pg_catalog.uuid not null
    references public.projects(id) on delete cascade,
  idempotency_key pg_catalog.uuid not null,
  created_by pg_catalog.uuid not null references public.profiles(id),
  final_report_id pg_catalog.uuid not null
    references public.ai_reports(id) on delete restrict,
  payload_fingerprint pg_catalog.text not null
    check (payload_fingerprint ~ '^[0-9a-f]{64}$'),
  final_decision_id pg_catalog.uuid not null unique
    references public.final_decisions(id) on delete cascade,
  result pg_catalog.jsonb not null,
  created_at pg_catalog.timestamptz not null default pg_catalog.now(),
  primary key (project_id, idempotency_key),
  unique (project_id)
);

alter table private.project_finalization_requests enable row level security;
revoke all on table private.project_finalization_requests
  from public, anon, authenticated;
grant select on table private.project_finalization_requests to service_role;

-- Dispute creation and finalization take conflicting locks on the project row.
-- Whichever starts second must re-check the committed lifecycle/dispute state,
-- preventing a new open dispute from racing a successful finalization.
create or replace function private.lock_active_project_for_dispute()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  dispute_project_status pg_catalog.text;
begin
  select project.status
  into dispute_project_status
  from public.tasks as task
  join public.projects as project on project.id = task.project_id
  where task.id = new.task_id
  for share of project;

  if not found then
    raise exception 'Dispute task not found';
  end if;
  if dispute_project_status <> 'active' then
    raise exception 'Disputes can only be opened for active projects';
  end if;
  return new;
end;
$$;

revoke all on function private.lock_active_project_for_dispute()
  from public, anon, authenticated;

create trigger lock_active_project_before_dispute
before insert on public.disputes
for each row execute function private.lock_active_project_for_dispute();

create or replace function private.lock_active_project_for_final_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  report_project_status pg_catalog.text;
begin
  if new.type <> 'final' then
    return new;
  end if;

  select project.status
  into report_project_status
  from public.projects as project
  where project.id = new.project_id
  for share;

  if not found then
    raise exception 'Final report project not found';
  end if;
  if report_project_status <> 'active' then
    raise exception 'Final reports can only be saved for active projects';
  end if;
  return new;
end;
$$;

revoke all on function private.lock_active_project_for_final_report()
  from public, anon, authenticated;

create trigger lock_active_project_before_final_report
before insert on public.ai_reports
for each row execute function private.lock_active_project_for_final_report();

-- This SECURITY DEFINER function is the only write path for final decisions,
-- final pledge status, the completed project transition, and its success audit.
-- Every privileged write follows authenticated owner, lifecycle, report,
-- member, pledge, dispute, and idempotency validation. Empty search_path
-- prevents caller-controlled object resolution.
create or replace function public.finalize_project(
  p_project_id pg_catalog.uuid,
  p_final_report_id pg_catalog.uuid,
  p_idempotency_key pg_catalog.uuid,
  p_final_action pg_catalog.jsonb,
  p_confirmation_note pg_catalog.text default null
)
returns pg_catalog.jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id pg_catalog.uuid := auth.uid();
  project_owner_id pg_catalog.uuid;
  project_status pg_catalog.text;
  action_item pg_catalog.jsonb;
  action_user_id pg_catalog.uuid;
  action_user_id_text pg_catalog.text;
  action_return_percentage pg_catalog.numeric;
  action_key_count pg_catalog.int8;
  action_user_ids pg_catalog.uuid[] := '{}'::pg_catalog.uuid[];
  normalized_final_action pg_catalog.jsonb := '[]'::pg_catalog.jsonb;
  normalized_confirmation_note pg_catalog.text;
  project_member_ids pg_catalog.uuid[];
  project_member_count pg_catalog.int4;
  pledge_user_ids pg_catalog.uuid[];
  pledge_count pg_catalog.int4;
  report_output pg_catalog.jsonb;
  report_recommendation pg_catalog.jsonb;
  report_user_id pg_catalog.uuid;
  report_user_id_text pg_catalog.text;
  report_return_percentage pg_catalog.numeric;
  report_user_ids pg_catalog.uuid[] := '{}'::pg_catalog.uuid[];
  normalized_report_recommendations pg_catalog.jsonb := '[]'::pg_catalog.jsonb;
  final_action_record pg_catalog.jsonb;
  differs_from_ai pg_catalog.bool;
  payload_fingerprint pg_catalog.text;
  existing_created_by pg_catalog.uuid;
  existing_final_report_id pg_catalog.uuid;
  existing_payload_fingerprint pg_catalog.text;
  existing_final_decision_id pg_catalog.uuid;
  existing_result pg_catalog.jsonb;
  final_decision_id pg_catalog.uuid;
  final_decision_confirmed_at pg_catalog.timestamptz;
  affected_rows pg_catalog.int4;
  result_payload pg_catalog.jsonb;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;
  if p_project_id is null then
    raise exception 'Project ID is required';
  end if;
  if p_final_report_id is null then
    raise exception 'Final report ID is required';
  end if;
  if p_idempotency_key is null then
    raise exception 'Idempotency key is required';
  end if;

  normalized_confirmation_note := nullif(
    pg_catalog.btrim(coalesce(p_confirmation_note, '')),
    ''
  );
  if normalized_confirmation_note is not null
    and pg_catalog.char_length(normalized_confirmation_note) > 2000
  then
    raise exception 'Confirmation note must not exceed 2000 characters';
  end if;

  if p_final_action is null
    or pg_catalog.jsonb_typeof(p_final_action) <> 'array'
    or pg_catalog.jsonb_array_length(p_final_action) = 0
    or pg_catalog.jsonb_array_length(p_final_action) > 5
  then
    raise exception 'Final action must contain between 1 and 5 project members';
  end if;

  for action_item in
    select item.value
    from pg_catalog.jsonb_array_elements(p_final_action) as item(value)
  loop
    if pg_catalog.jsonb_typeof(action_item) <> 'object' then
      raise exception 'Every final action entry must be an object';
    end if;

    select pg_catalog.count(*)
    into action_key_count
    from pg_catalog.jsonb_object_keys(action_item) as item(key);
    if action_key_count <> 2
      or not (action_item ? 'user_id')
      or not (action_item ? 'return_percentage')
      or exists (
        select 1
        from pg_catalog.jsonb_object_keys(action_item) as item(key)
        where item.key not in ('user_id', 'return_percentage')
      )
    then
      raise exception 'Final action entries have missing or unsupported fields';
    end if;

    if pg_catalog.jsonb_typeof(
      pg_catalog.jsonb_extract_path(action_item, 'user_id')
    ) <> 'string' then
      raise exception 'Final action user ID must be a UUID string';
    end if;
    action_user_id_text := pg_catalog.jsonb_extract_path_text(
      action_item,
      'user_id'
    );
    begin
      action_user_id := action_user_id_text::pg_catalog.uuid;
    exception
      when invalid_text_representation then
        raise exception 'Final action user ID must be a valid UUID';
    end;

    if action_user_id = any(action_user_ids) then
      raise exception 'Final action contains a duplicate project member';
    end if;
    action_user_ids := pg_catalog.array_append(
      action_user_ids,
      action_user_id
    );

    if pg_catalog.jsonb_typeof(
      pg_catalog.jsonb_extract_path(action_item, 'return_percentage')
    ) <> 'number' then
      raise exception 'Pledge return percentage must be numeric';
    end if;
    action_return_percentage := pg_catalog.jsonb_extract_path_text(
      action_item,
      'return_percentage'
    )::pg_catalog.numeric;
    if action_return_percentage < 0 or action_return_percentage > 100 then
      raise exception 'Pledge return percentage must be between 0 and 100';
    end if;

    normalized_final_action := normalized_final_action
      OPERATOR(pg_catalog.||)
      pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object(
          'user_id',
          action_user_id,
          'return_percentage',
          action_return_percentage
        )
      );
  end loop;

  select coalesce(
    pg_catalog.jsonb_agg(
      item.value
      order by pg_catalog.jsonb_extract_path_text(item.value, 'user_id')
    ),
    '[]'::pg_catalog.jsonb
  )
  into normalized_final_action
  from pg_catalog.jsonb_array_elements(normalized_final_action) as item(value);

  payload_fingerprint := pg_catalog.encode(
    extensions.digest(
      pg_catalog.jsonb_build_object(
        'project_id',
        p_project_id,
        'final_report_id',
        p_final_report_id,
        'final_action',
        normalized_final_action,
        'confirmation_note',
        normalized_confirmation_note
      )::pg_catalog.text,
      'sha256'
    ),
    'hex'
  );

  -- Serializes all finalization requests for one project and stabilizes the
  -- lifecycle while the transaction validates and writes its outcome.
  select project.created_by, project.status
  into project_owner_id, project_status
  from public.projects as project
  where project.id = p_project_id
  for update;

  if not found then
    raise exception 'Project not found';
  end if;
  if project_owner_id <> caller_id then
    raise exception 'Only the project owner can finalize this project';
  end if;

  -- This check intentionally precedes lifecycle rejection: an exact retry must
  -- replay after the first transaction has moved the project to completed.
  select
    request.created_by,
    request.final_report_id,
    request.payload_fingerprint,
    request.final_decision_id,
    request.result
  into
    existing_created_by,
    existing_final_report_id,
    existing_payload_fingerprint,
    existing_final_decision_id,
    existing_result
  from private.project_finalization_requests as request
  where request.project_id = p_project_id
    and request.idempotency_key = p_idempotency_key;

  if existing_final_decision_id is not null then
    if existing_created_by <> caller_id
      or existing_final_report_id <> p_final_report_id
      or existing_payload_fingerprint <> payload_fingerprint
    then
      raise exception 'Idempotency key was already used with different finalization data';
    end if;
    if project_status <> 'completed'
      or not exists (
        select 1
        from public.final_decisions as decision
        where decision.id = existing_final_decision_id
          and decision.project_id = p_project_id
          and decision.final_report_id = p_final_report_id
          and decision.confirmed_by = caller_id
      )
      or exists (
        select 1
        from public.pledges as pledge
        where pledge.project_id = p_project_id
          and pledge.status <> 'confirmed'
      )
      or (
        select pg_catalog.count(*)
        from public.pledges as pledge
        where pledge.project_id = p_project_id
      ) <> (
        existing_result ->> 'pledge_count'
      )::pg_catalog.int4
      or (
        select pg_catalog.count(*)
        from public.project_member_profiles as member
        where member.project_id = p_project_id
      ) <> (
        existing_result ->> 'pledge_count'
      )::pg_catalog.int4
      or (
        select pg_catalog.count(*)
        from public.audit_logs as audit
        where audit.project_id = p_project_id
          and audit.action = 'final_decision_confirmed'
          and audit.details ->> 'final_decision_id' =
            existing_final_decision_id::pg_catalog.text
      ) <> 1
    then
      raise exception 'Stored finalization result is inconsistent';
    end if;

    return existing_result
      OPERATOR(pg_catalog.||)
      pg_catalog.jsonb_build_object('replayed', true);
  end if;

  if project_status <> 'active' then
    if project_status = 'completed' then
      raise exception 'Project is already finalized';
    end if;
    raise exception 'Only active projects can be finalized';
  end if;
  if exists (
    select 1
    from public.final_decisions as decision
    where decision.project_id = p_project_id
  ) then
    raise exception 'Project already has a final decision';
  end if;
  if exists (
    select 1
    from public.disputes as dispute
    join public.tasks as task on task.id = dispute.task_id
    where task.project_id = p_project_id
      and dispute.status <> 'resolved'
  ) then
    raise exception 'Resolve every project dispute before finalization';
  end if;

  select report.output
  into report_output
  from public.ai_reports as report
  where report.id = p_final_report_id
    and report.project_id = p_project_id
    and report.type = 'final'
  for share;

  if not found then
    raise exception 'A saved final report for this project is required';
  end if;
  if pg_catalog.jsonb_typeof(report_output) <> 'object'
    or pg_catalog.jsonb_extract_path(report_output, 'human_confirmation_required')
      <> 'true'::pg_catalog.jsonb
    or pg_catalog.jsonb_typeof(
      pg_catalog.jsonb_extract_path(report_output, 'pledge_recommendation')
    ) <> 'array'
  then
    raise exception 'Saved final report output is invalid';
  end if;

  -- Lock every project pledge. No pledge is created or financially modified.
  perform pledge.id
  from public.pledges as pledge
  where pledge.project_id = p_project_id
  order by pledge.id
  for update;

  select
    coalesce(
      pg_catalog.array_agg(member.user_id order by member.user_id),
      '{}'::pg_catalog.uuid[]
    ),
    pg_catalog.count(*)::pg_catalog.int4
  into project_member_ids, project_member_count
  from public.project_member_profiles as member
  where member.project_id = p_project_id;

  select
    coalesce(
      pg_catalog.array_agg(pledge.user_id order by pledge.user_id),
      '{}'::pg_catalog.uuid[]
    ),
    pg_catalog.count(*)::pg_catalog.int4
  into pledge_user_ids, pledge_count
  from public.pledges as pledge
  where pledge.project_id = p_project_id;

  select coalesce(
    pg_catalog.array_agg(item.user_id order by item.user_id),
    '{}'::pg_catalog.uuid[]
  )
  into action_user_ids
  from pg_catalog.unnest(action_user_ids) as item(user_id);

  if project_member_count = 0 then
    raise exception 'Project has no finalizable members';
  end if;
  if pledge_count <> project_member_count
    or pledge_user_ids <> project_member_ids
  then
    raise exception 'Every project member must have exactly one project pledge';
  end if;
  if exists (
    select 1
    from public.pledges as pledge
    where pledge.project_id = p_project_id
      and pledge.status <> 'declared'
  ) then
    raise exception 'Every project pledge must be declared before finalization';
  end if;
  if action_user_ids <> project_member_ids then
    raise exception 'Final action must cover every project member exactly once';
  end if;

  for report_recommendation in
    select item.value
    from pg_catalog.jsonb_array_elements(
      pg_catalog.jsonb_extract_path(report_output, 'pledge_recommendation')
    ) as item(value)
  loop
    if pg_catalog.jsonb_typeof(report_recommendation) <> 'object'
      or pg_catalog.jsonb_typeof(
        pg_catalog.jsonb_extract_path(report_recommendation, 'user_id')
      ) <> 'string'
      or pg_catalog.jsonb_typeof(
        pg_catalog.jsonb_extract_path(
          report_recommendation,
          'pledge_return_percentage'
        )
      ) <> 'number'
      or pg_catalog.jsonb_typeof(
        pg_catalog.jsonb_extract_path(report_recommendation, 'reason')
      ) <> 'string'
    then
      raise exception 'Saved final report pledge recommendation is invalid';
    end if;

    report_user_id_text := pg_catalog.jsonb_extract_path_text(
      report_recommendation,
      'user_id'
    );
    begin
      report_user_id := report_user_id_text::pg_catalog.uuid;
    exception
      when invalid_text_representation then
        raise exception 'Saved final report contains an invalid member ID';
    end;

    if report_user_id = any(report_user_ids) then
      raise exception 'Saved final report contains a duplicate project member';
    end if;
    report_user_ids := pg_catalog.array_append(
      report_user_ids,
      report_user_id
    );

    report_return_percentage := pg_catalog.jsonb_extract_path_text(
      report_recommendation,
      'pledge_return_percentage'
    )::pg_catalog.numeric;
    if report_return_percentage < 0 or report_return_percentage > 100 then
      raise exception 'Saved final report pledge percentage is invalid';
    end if;

    normalized_report_recommendations :=
      normalized_report_recommendations
      OPERATOR(pg_catalog.||)
      pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object(
          'user_id',
          report_user_id,
          'return_percentage',
          report_return_percentage
        )
      );
  end loop;

  select coalesce(
    pg_catalog.array_agg(item.user_id order by item.user_id),
    '{}'::pg_catalog.uuid[]
  )
  into report_user_ids
  from pg_catalog.unnest(report_user_ids) as item(user_id);

  if report_user_ids <> project_member_ids then
    raise exception 'Saved final report must cover every project member exactly once';
  end if;

  select pg_catalog.jsonb_object_agg(
    pg_catalog.jsonb_extract_path_text(item.value, 'user_id'),
    pg_catalog.jsonb_build_object(
      'name',
      profile.name,
      'return_percentage',
      pg_catalog.jsonb_extract_path_text(
        item.value,
        'return_percentage'
      )::pg_catalog.numeric
    )
    order by pg_catalog.jsonb_extract_path_text(item.value, 'user_id')
  )
  into final_action_record
  from pg_catalog.jsonb_array_elements(normalized_final_action) as item(value)
  join public.profiles as profile
    on profile.id = pg_catalog.jsonb_extract_path_text(
      item.value,
      'user_id'
    )::pg_catalog.uuid;

  select exists (
    select 1
    from pg_catalog.jsonb_array_elements(normalized_final_action) as human(value)
    join pg_catalog.jsonb_array_elements(
      normalized_report_recommendations
    ) as ai(value)
      on pg_catalog.jsonb_extract_path_text(human.value, 'user_id')
        = pg_catalog.jsonb_extract_path_text(ai.value, 'user_id')
    where pg_catalog.jsonb_extract_path_text(
      human.value,
      'return_percentage'
    )::pg_catalog.numeric
      <> pg_catalog.jsonb_extract_path_text(
        ai.value,
        'return_percentage'
      )::pg_catalog.numeric
  )
  into differs_from_ai;

  insert into public.final_decisions (
    project_id,
    final_report_id,
    ai_recommendation,
    confirmed_by,
    final_action,
    confirmation_note
  )
  values (
    p_project_id,
    p_final_report_id,
    report_output,
    caller_id,
    final_action_record,
    normalized_confirmation_note
  )
  returning id, confirmed_at
  into final_decision_id, final_decision_confirmed_at;

  update public.pledges
  set status = 'confirmed'
  where project_id = p_project_id
    and status = 'declared';
  get diagnostics affected_rows = row_count;
  if affected_rows <> pledge_count then
    raise exception 'Not every project pledge was finalized';
  end if;

  update public.projects
  set status = 'completed'
  where id = p_project_id
    and status = 'active';
  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'Project lifecycle changed during finalization';
  end if;

  insert into public.audit_logs (
    project_id,
    user_id,
    action,
    details
  )
  values (
    p_project_id,
    caller_id,
    'final_decision_confirmed',
    pg_catalog.jsonb_build_object(
      'final_decision_id',
      final_decision_id,
      'final_report_id',
      p_final_report_id,
      'idempotency_key',
      p_idempotency_key,
      'pledge_count',
      pledge_count,
      'final_action',
      final_action_record,
      'differs_from_ai_recommendation',
      differs_from_ai,
      'confirmation_note',
      normalized_confirmation_note
    )
  );

  result_payload := pg_catalog.jsonb_build_object(
    'project_id',
    p_project_id,
    'final_report_id',
    p_final_report_id,
    'final_decision_id',
    final_decision_id,
    'confirmed_by',
    caller_id,
    'confirmed_at',
    final_decision_confirmed_at,
    'pledge_count',
    pledge_count,
    'project_status',
    'completed',
    'replayed',
    false
  );

  -- Written last so an injected failure here proves that all public writes
  -- roll back with the idempotency record.
  insert into private.project_finalization_requests (
    project_id,
    idempotency_key,
    created_by,
    final_report_id,
    payload_fingerprint,
    final_decision_id,
    result
  )
  values (
    p_project_id,
    p_idempotency_key,
    caller_id,
    p_final_report_id,
    payload_fingerprint,
    final_decision_id,
    result_payload
  );

  return result_payload;
end;
$$;

comment on function public.finalize_project(
  pg_catalog.uuid,
  pg_catalog.uuid,
  pg_catalog.uuid,
  pg_catalog.jsonb,
  pg_catalog.text
) is
  'Atomically confirms one saved final report, resolves every project pledge, completes the project, records one human decision and audit event, and stores an idempotent result.';

-- Finalization-owned writes are RPC-only.
drop policy if exists "owner confirms decisions" on public.final_decisions;
revoke insert, update, delete on table public.final_decisions
  from authenticated;
grant select on table public.final_decisions to authenticated;

drop policy if exists "owner manages pledges" on public.pledges;
revoke insert, update, delete on table public.pledges from authenticated;

-- Existing dispute resolution RPCs remain the only authenticated update path.
-- This also makes the finalization dispute precondition stable after its check.
drop policy if exists "owner resolves disputes" on public.disputes;
revoke update on table public.disputes from authenticated;

-- Owners may still perform ordinary draft/active/cancelled project edits, but
-- cannot enter or leave completed outside finalize_project.
drop policy if exists "owner updates projects" on public.projects;
create policy "owner updates non-final projects"
on public.projects
for update
to authenticated
using (
  created_by = (select auth.uid())
  and status <> 'completed'
)
with check (
  created_by = (select auth.uid())
  and status in ('draft', 'active', 'cancelled')
);

-- Authenticated callers may write unrelated audit events, but cannot forge the
-- single success event owned by this RPC.
drop policy if exists "members add non-generated audit" on public.audit_logs;
create policy "members add non-generated audit"
on public.audit_logs
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and action not in (
    'project_created',
    'ai_plan_generated',
    'daily_log_submitted',
    'final_decision_confirmed'
  )
  and (
    project_id is null
    or (select private.is_project_member(project_id))
  )
);

revoke all on function public.finalize_project(
  pg_catalog.uuid,
  pg_catalog.uuid,
  pg_catalog.uuid,
  pg_catalog.jsonb,
  pg_catalog.text
) from public, anon, authenticated;

grant execute on function public.finalize_project(
  pg_catalog.uuid,
  pg_catalog.uuid,
  pg_catalog.uuid,
  pg_catalog.jsonb,
  pg_catalog.text
) to authenticated;
