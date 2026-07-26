alter table public.evidence
  add column daily_log_id pg_catalog.uuid;

-- Adopt proof rows created by the legacy daily-log action only when the
-- metadata points at a real same-user log/task relationship. Invalid legacy
-- metadata remains ordinary task evidence. Legacy retries could have created
-- identical proof rows, so only the oldest row in each log/task/URL group is
-- adopted into the new unique relationship. The RPC removes any remaining
-- metadata-only duplicates on the first subsequent save.
with legacy_daily_proof as (
  select
    evidence.id,
    log_task.daily_log_id,
    pg_catalog.row_number() over (
      partition by log_task.daily_log_id, evidence.task_id, evidence.url
      order by evidence.created_at, evidence.id
    ) as duplicate_rank
  from public.evidence as evidence
  join public.daily_log_tasks as log_task
    on log_task.task_id = evidence.task_id
   and log_task.daily_log_id = case
     when pg_catalog.pg_input_is_valid(
       evidence.metadata ->> 'daily_log_id',
       'pg_catalog.uuid'
     )
       then (evidence.metadata ->> 'daily_log_id')::pg_catalog.uuid
     else null
   end
  join public.daily_logs as daily_log
    on daily_log.id = log_task.daily_log_id
   and daily_log.user_id = evidence.user_id
  where evidence.daily_log_id is null
    and evidence.metadata ? 'daily_log_id'
    and evidence.url is not null
)
update public.evidence as evidence
set daily_log_id = legacy_daily_proof.daily_log_id
from legacy_daily_proof
where evidence.id = legacy_daily_proof.id
  and legacy_daily_proof.duplicate_rank = 1;

alter table public.evidence
  add constraint evidence_daily_log_task_fkey
  foreign key (daily_log_id, task_id)
  references public.daily_log_tasks(daily_log_id, task_id)
  on delete cascade,
  add constraint evidence_daily_log_url_required
  check (daily_log_id is null or url is not null);

create unique index evidence_daily_log_task_url_unique
  on public.evidence(daily_log_id, task_id, url)
  where daily_log_id is not null;

create table private.daily_log_save_requests (
  user_id pg_catalog.uuid not null
    references public.profiles(id) on delete cascade,
  idempotency_key pg_catalog.uuid not null,
  project_id pg_catalog.uuid not null
    references public.projects(id) on delete cascade,
  payload_hash pg_catalog.text not null
    check (payload_hash ~ '^[0-9a-f]{64}$'),
  request_fingerprint pg_catalog.text not null
    check (request_fingerprint ~ '^[0-9a-f]{64}$'),
  daily_log_id pg_catalog.uuid
    references public.daily_logs(id) on delete cascade,
  result pg_catalog.jsonb,
  created_at pg_catalog.timestamptz not null default pg_catalog.now(),
  primary key (user_id, idempotency_key),
  check (
    (daily_log_id is null and result is null)
    or (daily_log_id is not null and result is not null)
  )
);

alter table private.daily_log_save_requests enable row level security;
revoke all on table private.daily_log_save_requests
  from public, anon, authenticated;
grant select on table private.daily_log_save_requests to service_role;

-- This is deliberately SECURITY DEFINER. Authenticated callers cannot write
-- daily logs or their task links directly, and daily-log proof/audit rows are
-- reserved for this function. Every privileged write follows identity,
-- project membership, state, payload and task-scope checks. The empty
-- search_path prevents caller-controlled object resolution.
create or replace function public.save_daily_log_with_tasks(
  p_idempotency_key pg_catalog.uuid,
  p_payload pg_catalog.jsonb,
  p_payload_hash pg_catalog.text
)
returns pg_catalog.jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id pg_catalog.uuid := auth.uid();
  target_project_id pg_catalog.uuid;
  project_id_text pg_catalog.text;
  project_team_id pg_catalog.uuid;
  project_status pg_catalog.text;
  project_start_date pg_catalog.date;
  project_end_date pg_catalog.date;
  target_log_date pg_catalog.date;
  log_date_text pg_catalog.text;
  normalized_summary pg_catalog.text;
  normalized_blockers pg_catalog.text;
  normalized_next_steps pg_catalog.text;
  normalized_time_spent_minutes pg_catalog.int4;
  task_ids pg_catalog.uuid[] := '{}'::pg_catalog.uuid[];
  proof_links pg_catalog.text[] := '{}'::pg_catalog.text[];
  task_count pg_catalog.int4 := 0;
  proof_link_count pg_catalog.int4 := 0;
  evidence_count pg_catalog.int4 := 0;
  allowed_key_count pg_catalog.int8;
  calculated_request_fingerprint pg_catalog.text;
  inserted_request_key pg_catalog.uuid;
  existing_project_id pg_catalog.uuid;
  existing_payload_hash pg_catalog.text;
  existing_request_fingerprint pg_catalog.text;
  existing_result pg_catalog.jsonb;
  saved_daily_log_id pg_catalog.uuid;
  result_payload pg_catalog.jsonb;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;
  if p_idempotency_key is null then
    raise exception 'Idempotency key is required';
  end if;

  p_payload_hash := pg_catalog.lower(
    pg_catalog.btrim(coalesce(p_payload_hash, ''))
  );
  if p_payload_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Payload hash must be a SHA-256 hex digest';
  end if;
  if p_payload is null
    or pg_catalog.jsonb_typeof(p_payload) <> 'object'
    or pg_catalog.octet_length(p_payload::pg_catalog.text) > 65536
  then
    raise exception 'Daily log payload is invalid or too large';
  end if;

  select pg_catalog.count(*)
  into allowed_key_count
  from pg_catalog.jsonb_object_keys(p_payload) as item(key)
  where item.key in (
    'project_id',
    'log_date',
    'summary',
    'time_spent_minutes',
    'blockers',
    'next_steps',
    'task_ids',
    'proof_links'
  );
  if allowed_key_count <> 8
    or (
      select pg_catalog.count(*)
      from pg_catalog.jsonb_object_keys(p_payload)
    ) <> 8
  then
    raise exception 'Daily log payload has missing or unsupported fields';
  end if;

  if pg_catalog.jsonb_typeof(p_payload -> 'project_id') <> 'string'
    or not pg_catalog.pg_input_is_valid(
      p_payload ->> 'project_id',
      'pg_catalog.uuid'
    )
  then
    raise exception 'Project ID must be a valid UUID';
  end if;
  project_id_text := p_payload ->> 'project_id';
  target_project_id := project_id_text::pg_catalog.uuid;

  if pg_catalog.jsonb_typeof(p_payload -> 'log_date') <> 'string'
    or (p_payload ->> 'log_date') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    or not pg_catalog.pg_input_is_valid(
      p_payload ->> 'log_date',
      'pg_catalog.date'
    )
  then
    raise exception 'Log date must be a valid ISO date';
  end if;
  log_date_text := p_payload ->> 'log_date';
  target_log_date := log_date_text::pg_catalog.date;

  if pg_catalog.jsonb_typeof(p_payload -> 'summary') <> 'string'
    or pg_catalog.char_length(
      pg_catalog.btrim(p_payload ->> 'summary')
    ) not between 1 and 4000
  then
    raise exception 'Summary must be between 1 and 4000 characters';
  end if;
  normalized_summary := pg_catalog.btrim(p_payload ->> 'summary');

  if pg_catalog.jsonb_typeof(p_payload -> 'blockers') <> 'string'
    or pg_catalog.char_length(p_payload ->> 'blockers') > 4000
  then
    raise exception 'Blockers must not exceed 4000 characters';
  end if;
  normalized_blockers := pg_catalog.btrim(p_payload ->> 'blockers');

  if pg_catalog.jsonb_typeof(p_payload -> 'next_steps') <> 'string'
    or pg_catalog.char_length(
      pg_catalog.btrim(p_payload ->> 'next_steps')
    ) not between 1 and 4000
  then
    raise exception 'Next steps must be between 1 and 4000 characters';
  end if;
  normalized_next_steps := pg_catalog.btrim(p_payload ->> 'next_steps');

  if pg_catalog.jsonb_typeof(
    p_payload -> 'time_spent_minutes'
  ) <> 'number'
    or (p_payload ->> 'time_spent_minutes') !~ '^[0-9]+$'
    or (p_payload ->> 'time_spent_minutes')::pg_catalog.int4
      not between 0 and 1440
  then
    raise exception 'Time spent must be between 0 and 1440 minutes';
  end if;
  normalized_time_spent_minutes :=
    (p_payload ->> 'time_spent_minutes')::pg_catalog.int4;

  if pg_catalog.jsonb_typeof(p_payload -> 'task_ids') <> 'array'
    or pg_catalog.jsonb_array_length(p_payload -> 'task_ids') > 50
    or exists (
      select 1
      from pg_catalog.jsonb_array_elements(
        p_payload -> 'task_ids'
      ) as item(value)
      where pg_catalog.jsonb_typeof(item.value) <> 'string'
    )
    or exists (
      select 1
      from pg_catalog.jsonb_array_elements_text(
        p_payload -> 'task_ids'
      ) as item(value)
      where not pg_catalog.pg_input_is_valid(
        item.value,
        'pg_catalog.uuid'
      )
    )
  then
    raise exception 'Task IDs must be an array of at most 50 UUIDs';
  end if;

  if (
    select pg_catalog.count(*)
    from pg_catalog.jsonb_array_elements_text(
      p_payload -> 'task_ids'
    ) as item(value)
  ) <> (
    select pg_catalog.count(distinct item.value)
    from pg_catalog.jsonb_array_elements_text(
      p_payload -> 'task_ids'
    ) as item(value)
  ) then
    raise exception 'Task IDs must be unique';
  end if;

  select coalesce(
    pg_catalog.array_agg(
      item.value::pg_catalog.uuid
      order by item.value::pg_catalog.uuid
    ),
    '{}'::pg_catalog.uuid[]
  )
  into task_ids
  from pg_catalog.jsonb_array_elements_text(
    p_payload -> 'task_ids'
  ) as item(value);
  task_count := pg_catalog.cardinality(task_ids);

  if pg_catalog.jsonb_typeof(p_payload -> 'proof_links') <> 'array'
    or pg_catalog.jsonb_array_length(p_payload -> 'proof_links') > 20
    or exists (
      select 1
      from pg_catalog.jsonb_array_elements(
        p_payload -> 'proof_links'
      ) as item(value)
      where pg_catalog.jsonb_typeof(item.value) <> 'string'
    )
    or exists (
      select 1
      from pg_catalog.jsonb_array_elements_text(
        p_payload -> 'proof_links'
      ) as item(value)
      where pg_catalog.char_length(pg_catalog.btrim(item.value))
        not between 10 and 2048
        or pg_catalog.btrim(item.value)
          !~ '^https?://[^[:space:]/?#]+(?:[/?#][^[:space:]]*)?$'
        or pg_catalog.btrim(item.value) ~ '[[:cntrl:]]'
    )
  then
    raise exception 'Proof links must be valid HTTP or HTTPS URLs';
  end if;

  if (
    select pg_catalog.count(*)
    from pg_catalog.jsonb_array_elements_text(
      p_payload -> 'proof_links'
    ) as item(value)
  ) <> (
    select pg_catalog.count(distinct pg_catalog.btrim(item.value))
    from pg_catalog.jsonb_array_elements_text(
      p_payload -> 'proof_links'
    ) as item(value)
  ) then
    raise exception 'Proof links must be unique';
  end if;

  select coalesce(
    pg_catalog.array_agg(
      pg_catalog.btrim(item.value)
      order by pg_catalog.btrim(item.value)
    ),
    '{}'::pg_catalog.text[]
  )
  into proof_links
  from pg_catalog.jsonb_array_elements_text(
    p_payload -> 'proof_links'
  ) as item(value);
  proof_link_count := pg_catalog.cardinality(proof_links);

  if proof_link_count > 0 and task_count = 0 then
    raise exception 'Choose at least one task before adding proof links';
  end if;

  calculated_request_fingerprint := pg_catalog.encode(
    extensions.digest(
      pg_catalog.jsonb_build_object(
        'project_id',
        target_project_id,
        'log_date',
        target_log_date,
        'summary',
        normalized_summary,
        'time_spent_minutes',
        normalized_time_spent_minutes,
        'blockers',
        normalized_blockers,
        'next_steps',
        normalized_next_steps,
        'task_ids',
        pg_catalog.to_jsonb(task_ids),
        'proof_links',
        pg_catalog.to_jsonb(proof_links)
      )::pg_catalog.text,
      'sha256'
    ),
    'hex'
  );

  -- The project lock stabilizes status and dates until this statement commits.
  select
    project.team_id,
    project.status,
    project.start_date,
    project.end_date
  into
    project_team_id,
    project_status,
    project_start_date,
    project_end_date
  from public.projects as project
  where project.id = target_project_id
  for share;

  if not found then
    raise exception 'Project not found';
  end if;
  if not exists (
    select 1
    from public.team_members as membership
    where membership.team_id = project_team_id
      and membership.user_id = caller_id
      and membership.role in ('owner', 'member')
  ) or not exists (
    select 1
    from public.project_member_profiles as profile
    where profile.project_id = target_project_id
      and profile.user_id = caller_id
  ) then
    raise exception 'Not a member of this project';
  end if;
  if project_status <> 'active' then
    raise exception 'Daily logs are only allowed for active projects';
  end if;
  if target_log_date < project_start_date
    or target_log_date > project_end_date
    or target_log_date > current_date
  then
    raise exception 'Log date must be within the active project and not in the future';
  end if;
  if (
    select pg_catalog.count(*)::pg_catalog.int4
    from public.tasks as task
    where task.id = any(task_ids)
      and task.project_id = target_project_id
      and task.status <> 'approved'
  ) <> task_count
  then
    raise exception 'Every task must belong to this project and be open';
  end if;

  -- The reservation is the first write. A concurrent exact retry blocks on
  -- the primary key, then replays the committed result. Any later exception
  -- rolls the reservation back with all other changes.
  insert into private.daily_log_save_requests (
    user_id,
    idempotency_key,
    project_id,
    payload_hash,
    request_fingerprint
  )
  values (
    caller_id,
    p_idempotency_key,
    target_project_id,
    p_payload_hash,
    calculated_request_fingerprint
  )
  on conflict (user_id, idempotency_key) do nothing
  returning idempotency_key into inserted_request_key;

  if inserted_request_key is null then
    select
      request.project_id,
      request.payload_hash,
      request.request_fingerprint,
      request.result
    into
      existing_project_id,
      existing_payload_hash,
      existing_request_fingerprint,
      existing_result
    from private.daily_log_save_requests as request
    where request.user_id = caller_id
      and request.idempotency_key = p_idempotency_key;

    if existing_project_id = target_project_id
      and existing_payload_hash = p_payload_hash
      and existing_request_fingerprint = calculated_request_fingerprint
      and existing_result is not null
    then
      return existing_result
        OPERATOR(pg_catalog.||)
        pg_catalog.jsonb_build_object('replayed', true);
    end if;
    raise exception 'Idempotency key was already used with different daily log data';
  end if;

  -- The unique (project_id, user_id, log_date) constraint serializes
  -- concurrent saves for the same logical log and prevents duplicate rows.
  insert into public.daily_logs (
    project_id,
    user_id,
    log_date,
    summary,
    time_spent_minutes,
    blockers,
    next_steps
  )
  values (
    target_project_id,
    caller_id,
    target_log_date,
    normalized_summary,
    normalized_time_spent_minutes,
    normalized_blockers,
    normalized_next_steps
  )
  on conflict (project_id, user_id, log_date) do update
  set summary = excluded.summary,
      time_spent_minutes = excluded.time_spent_minutes,
      blockers = excluded.blockers,
      next_steps = excluded.next_steps
  returning id into saved_daily_log_id;

  delete from public.evidence
  where evidence.daily_log_id = saved_daily_log_id
    or (
      evidence.daily_log_id is null
      and evidence.user_id = caller_id
      and evidence.metadata ->> 'daily_log_id' =
        saved_daily_log_id::pg_catalog.text
    );

  delete from public.daily_log_tasks
  where daily_log_tasks.daily_log_id = saved_daily_log_id;

  insert into public.daily_log_tasks (daily_log_id, task_id)
  select saved_daily_log_id, item.task_id
  from pg_catalog.unnest(task_ids) as item(task_id);

  insert into public.evidence (
    daily_log_id,
    task_id,
    user_id,
    type,
    url,
    description,
    metadata
  )
  select
    saved_daily_log_id,
    task_item.task_id,
    caller_id,
    case
      when pg_catalog.lower(link_item.url) like '%://github.com/%'
        then 'github'
      when pg_catalog.lower(link_item.url) ~
        '^https?://([^/]*\.)?(youtube\.com|youtu\.be|loom\.com)(/|$)'
        then 'video'
      else 'link'
    end,
    link_item.url,
    pg_catalog.format(
      'Daily proof from %s: %s',
      target_log_date,
      pg_catalog.left(normalized_summary, 220)
    ),
    pg_catalog.jsonb_build_object(
      'daily_log_id',
      saved_daily_log_id,
      'log_date',
      target_log_date
    )
  from pg_catalog.unnest(task_ids) as task_item(task_id)
  cross join pg_catalog.unnest(proof_links) as link_item(url);
  get diagnostics evidence_count = row_count;

  insert into public.audit_logs (
    project_id,
    user_id,
    action,
    details
  )
  values (
    target_project_id,
    caller_id,
    'daily_log_submitted',
    pg_catalog.jsonb_build_object(
      'daily_log_id',
      saved_daily_log_id,
      'idempotency_key',
      p_idempotency_key,
      'log_date',
      target_log_date,
      'task_count',
      task_count,
      'proof_link_count',
      proof_link_count
    )
  );

  result_payload := pg_catalog.jsonb_build_object(
    'daily_log_id',
    saved_daily_log_id,
    'project_id',
    target_project_id,
    'log_date',
    target_log_date,
    'task_count',
    task_count,
    'proof_link_count',
    proof_link_count,
    'evidence_count',
    evidence_count,
    'replayed',
    false
  );

  update private.daily_log_save_requests
  set daily_log_id = saved_daily_log_id,
      result = result_payload
  where user_id = caller_id
    and idempotency_key = p_idempotency_key;

  return result_payload;
end;
$$;

comment on function public.save_daily_log_with_tasks(
  pg_catalog.uuid,
  pg_catalog.jsonb,
  pg_catalog.text
) is
  'Atomically validates and saves one project member daily log with task links, proof, audit and idempotency.';

-- Daily-log writes are RPC-only. Select remains governed by the existing RLS
-- policies so project members can still read the shared progress history.
revoke insert, update, delete on table public.daily_logs from authenticated;
revoke insert, update, delete on table public.daily_log_tasks
  from authenticated;

drop policy if exists "users create own logs" on public.daily_logs;
drop policy if exists "users update own logs" on public.daily_logs;
drop policy if exists "users manage own project log tasks"
  on public.daily_log_tasks;

-- Ordinary task evidence remains writable for the existing task flow, but a
-- caller cannot forge or mutate a daily-log association outside the RPC.
drop policy if exists "assignees add own evidence" on public.evidence;
create policy "assignees add ordinary evidence"
on public.evidence
for insert
to authenticated
with check (
  daily_log_id is null
  and not (metadata ? 'daily_log_id')
  and user_id = (select auth.uid())
  and exists (
    select 1
    from public.task_assignments as assignment
    where assignment.task_id = evidence.task_id
      and assignment.user_id = (select auth.uid())
  )
);

drop policy if exists "users manage own evidence" on public.evidence;
create policy "users update own ordinary evidence"
on public.evidence
for update
to authenticated
using (
  daily_log_id is null
  and not (metadata ? 'daily_log_id')
  and user_id = (select auth.uid())
)
with check (
  daily_log_id is null
  and not (metadata ? 'daily_log_id')
  and user_id = (select auth.uid())
);

drop policy if exists "users delete own evidence" on public.evidence;
create policy "users delete own ordinary evidence"
on public.evidence
for delete
to authenticated
using (
  daily_log_id is null
  and not (metadata ? 'daily_log_id')
  and user_id = (select auth.uid())
);

-- Authenticated callers may still write unrelated audit events, but cannot
-- forge the single success audit owned by this RPC.
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
    'daily_log_submitted'
  )
  and (
    project_id is null
    or (select private.is_project_member(project_id))
  )
);

revoke all on function public.save_daily_log_with_tasks(
  pg_catalog.uuid,
  pg_catalog.jsonb,
  pg_catalog.text
) from public, anon, authenticated;

grant execute on function public.save_daily_log_with_tasks(
  pg_catalog.uuid,
  pg_catalog.jsonb,
  pg_catalog.text
) to authenticated;
