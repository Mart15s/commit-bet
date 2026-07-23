create table private.project_creation_requests (
  request_id uuid primary key,
  project_id uuid not null unique references public.projects(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  payload_hash text not null check (char_length(payload_hash) = 64),
  created_at timestamptz not null default now()
);

alter table private.project_creation_requests enable row level security;
revoke all on table private.project_creation_requests from public, anon, authenticated;
grant all on table private.project_creation_requests to service_role;

create or replace function private.is_valid_project_setup_text_array(
  input_value pg_catalog.jsonb,
  maximum_items pg_catalog.int4,
  maximum_value_length pg_catalog.int4
)
returns pg_catalog.bool
language plpgsql
immutable
set search_path = ''
as $$
begin
  if input_value is null or pg_catalog.jsonb_typeof(input_value) <> 'array' then
    return false;
  end if;

  if pg_catalog.jsonb_array_length(input_value) > maximum_items then
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
      or pg_catalog.char_length(pg_catalog.btrim(item.value)) > maximum_value_length
  ) then
    return false;
  end if;

  return (
    select pg_catalog.count(*) = pg_catalog.count(distinct pg_catalog.lower(pg_catalog.btrim(item.value)))
    from pg_catalog.jsonb_array_elements_text(input_value) as item(value)
  );
end;
$$;

revoke all on function private.is_valid_project_setup_text_array(
  pg_catalog.jsonb,
  pg_catalog.int4,
  pg_catalog.int4
) from public, anon, authenticated;

create or replace function public.create_project_with_members(
  p_request_id pg_catalog.uuid,
  p_team_id pg_catalog.uuid,
  p_project_type pg_catalog.text,
  p_title pg_catalog.text,
  p_description pg_catalog.text,
  p_goal pg_catalog.text,
  p_selected_success_criteria pg_catalog.text[],
  p_custom_success_criteria pg_catalog.text[],
  p_start_date pg_catalog.date,
  p_end_date pg_catalog.date,
  p_pledge_amount pg_catalog.numeric,
  p_pledge_amount_is_custom pg_catalog.bool,
  p_members pg_catalog.jsonb
)
returns pg_catalog.uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id pg_catalog.uuid := auth.uid();
  member_item pg_catalog.jsonb;
  normalized_member pg_catalog.jsonb;
  normalized_members pg_catalog.jsonb := '[]'::pg_catalog.jsonb;
  pledge_item pg_catalog.jsonb;
  member_id_text pg_catalog.text;
  member_id pg_catalog.uuid;
  member_ids pg_catalog.uuid[] := '{}'::pg_catalog.uuid[];
  member_count pg_catalog.int4;
  member_pledge_amount pg_catalog.numeric;
  member_pledge_currency pg_catalog.text;
  member_roles pg_catalog.text[];
  member_strengths pg_catalog.text[];
  member_weaknesses pg_catalog.text[];
  member_preferred_work_types pg_catalog.text[];
  member_evidence_types pg_catalog.text[];
  member_experience_level pg_catalog.text;
  member_best_work_time pg_catalog.text;
  member_notes pg_catalog.text;
  member_custom_notes pg_catalog.text;
  normalized_selected_criteria pg_catalog.text[];
  normalized_custom_criteria pg_catalog.text[];
  normalized_criteria pg_catalog.text[];
  success_criteria_json pg_catalog.jsonb;
  request_fingerprint pg_catalog.jsonb;
  request_payload_hash pg_catalog.text;
  existing_created_by pg_catalog.uuid;
  existing_project_id pg_catalog.uuid;
  existing_payload_hash pg_catalog.text;
  existing_profile_count pg_catalog.int8;
  existing_pledge_count pg_catalog.int8;
  existing_audit_count pg_catalog.int8;
  caller_is_selected pg_catalog.bool := false;
  key_count pg_catalog.int8;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;
  if p_request_id is null then
    raise exception 'A project creation request ID is required';
  end if;
  if p_team_id is null then
    raise exception 'A team is required';
  end if;
  if not exists (
    select 1
    from public.team_members as membership
    where membership.team_id = p_team_id
      and membership.user_id = caller_id
      and membership.role in ('owner', 'member')
  ) then
    raise exception 'You are not allowed to create a project for this team';
  end if;

  p_project_type := pg_catalog.btrim(coalesce(p_project_type, ''));
  p_title := pg_catalog.btrim(coalesce(p_title, ''));
  p_description := pg_catalog.btrim(coalesce(p_description, ''));
  p_goal := pg_catalog.btrim(coalesce(p_goal, ''));

  if pg_catalog.char_length(p_project_type) not between 2 and 120 then
    raise exception 'Project type must be between 2 and 120 characters';
  end if;
  if pg_catalog.char_length(p_title) not between 2 and 120 then
    raise exception 'Project title must be between 2 and 120 characters';
  end if;
  if pg_catalog.char_length(p_description) not between 2 and 2000 then
    raise exception 'Project description must be between 2 and 2000 characters';
  end if;
  if pg_catalog.char_length(p_goal) not between 2 and 1000 then
    raise exception 'Project goal must be between 2 and 1000 characters';
  end if;
  if p_start_date is null or p_end_date is null or p_end_date < p_start_date then
    raise exception 'Project dates must form a valid interval';
  end if;
  if p_pledge_amount is null
    or p_pledge_amount::pg_catalog.text in ('NaN', 'Infinity', '-Infinity')
    or p_pledge_amount < 0
    or p_pledge_amount > 1000000
    or p_pledge_amount <> pg_catalog.round(p_pledge_amount, 2)
  then
    raise exception 'Pledge amount must be between 0 and 1000000 with at most two decimal places';
  end if;
  if p_pledge_amount_is_custom is null then
    raise exception 'Pledge selection type is required';
  end if;

  if not private.is_valid_project_setup_text_array(
    pg_catalog.to_jsonb(p_selected_success_criteria),
    20,
    500
  ) or not private.is_valid_project_setup_text_array(
    pg_catalog.to_jsonb(p_custom_success_criteria),
    20,
    500
  ) then
    raise exception 'Success criteria are malformed';
  end if;

  select coalesce(
    pg_catalog.array_agg(pg_catalog.btrim(item.value) order by item.ordinality),
    '{}'::pg_catalog.text[]
  )
  into normalized_selected_criteria
  from pg_catalog.unnest(p_selected_success_criteria) with ordinality as item(value, ordinality);

  select coalesce(
    pg_catalog.array_agg(pg_catalog.btrim(item.value) order by item.ordinality),
    '{}'::pg_catalog.text[]
  )
  into normalized_custom_criteria
  from pg_catalog.unnest(p_custom_success_criteria) with ordinality as item(value, ordinality);

  normalized_criteria := pg_catalog.array_cat(
    normalized_selected_criteria,
    normalized_custom_criteria
  );
  if pg_catalog.cardinality(normalized_criteria) not between 1 and 20 then
    raise exception 'Choose between 1 and 20 success criteria';
  end if;
  if (
    select pg_catalog.count(*) <> pg_catalog.count(distinct pg_catalog.lower(item.value))
    from pg_catalog.unnest(normalized_criteria) as item(value)
  ) then
    raise exception 'Success criteria must be unique';
  end if;

  select pg_catalog.jsonb_agg(
    pg_catalog.jsonb_build_object('criterion', item.value)
    order by item.ordinality
  )
  into success_criteria_json
  from pg_catalog.unnest(normalized_criteria) with ordinality as item(value, ordinality);

  if p_members is null or pg_catalog.jsonb_typeof(p_members) <> 'array' then
    raise exception 'Member setup must be a JSON array';
  end if;
  member_count := pg_catalog.jsonb_array_length(p_members);
  if member_count not between 1 and 5 then
    raise exception 'Choose between 1 and 5 project members';
  end if;

  for member_item in
    select item.value
    from pg_catalog.jsonb_array_elements(p_members) as item(value)
  loop
    if pg_catalog.jsonb_typeof(member_item) <> 'object' then
      raise exception 'Every member setup must be an object';
    end if;

    select pg_catalog.count(*)
    into key_count
    from pg_catalog.jsonb_object_keys(member_item) as item(key)
    where item.key in (
      'member_id',
      'roles',
      'strengths',
      'weaknesses',
      'availability_minutes_per_day',
      'preferred_work_types',
      'evidence_types',
      'experience_level',
      'best_work_time',
      'notes',
      'custom_notes',
      'pledge'
    );
    if key_count <> 12 or (
      select pg_catalog.count(*)
      from pg_catalog.jsonb_object_keys(member_item) as item(key)
    ) <> 12 then
      raise exception 'Member setup has missing or unsupported fields';
    end if;

    if pg_catalog.jsonb_typeof(
      pg_catalog.jsonb_extract_path(member_item, 'member_id')
    ) <> 'string' then
      raise exception 'Member ID must be a UUID string';
    end if;
    member_id_text := pg_catalog.jsonb_extract_path_text(member_item, 'member_id');
    if not pg_catalog.pg_input_is_valid(member_id_text, 'pg_catalog.uuid') then
      raise exception 'Member ID must be a valid UUID';
    end if;
    member_id := member_id_text::pg_catalog.uuid;
    if pg_catalog.array_position(member_ids, member_id) is not null then
      raise exception 'Project members must be unique';
    end if;
    member_ids := pg_catalog.array_append(member_ids, member_id);

    if not exists (
      select 1
      from public.team_members as membership
      where membership.team_id = p_team_id
        and membership.user_id = member_id
        and membership.role in ('owner', 'member')
    ) then
      raise exception 'Every selected member must belong to this team';
    end if;
    if member_id = caller_id then
      caller_is_selected := true;
    end if;

    if not private.is_valid_project_setup_text_array(
      pg_catalog.jsonb_extract_path(member_item, 'roles'),
      20,
      120
    ) or not private.is_valid_project_setup_text_array(
      pg_catalog.jsonb_extract_path(member_item, 'strengths'),
      20,
      120
    ) or not private.is_valid_project_setup_text_array(
      pg_catalog.jsonb_extract_path(member_item, 'weaknesses'),
      20,
      120
    ) or not private.is_valid_project_setup_text_array(
      pg_catalog.jsonb_extract_path(member_item, 'preferred_work_types'),
      20,
      120
    ) or not private.is_valid_project_setup_text_array(
      pg_catalog.jsonb_extract_path(member_item, 'evidence_types'),
      20,
      120
    ) then
      raise exception 'Member capability lists are malformed';
    end if;

    select coalesce(
      pg_catalog.array_agg(pg_catalog.btrim(item.value) order by item.ordinality),
      '{}'::pg_catalog.text[]
    )
    into member_roles
    from pg_catalog.jsonb_array_elements_text(
      pg_catalog.jsonb_extract_path(member_item, 'roles')
    ) with ordinality as item(value, ordinality);

    select coalesce(
      pg_catalog.array_agg(pg_catalog.btrim(item.value) order by item.ordinality),
      '{}'::pg_catalog.text[]
    )
    into member_strengths
    from pg_catalog.jsonb_array_elements_text(
      pg_catalog.jsonb_extract_path(member_item, 'strengths')
    ) with ordinality as item(value, ordinality);

    select coalesce(
      pg_catalog.array_agg(pg_catalog.btrim(item.value) order by item.ordinality),
      '{}'::pg_catalog.text[]
    )
    into member_weaknesses
    from pg_catalog.jsonb_array_elements_text(
      pg_catalog.jsonb_extract_path(member_item, 'weaknesses')
    ) with ordinality as item(value, ordinality);

    select coalesce(
      pg_catalog.array_agg(pg_catalog.btrim(item.value) order by item.ordinality),
      '{}'::pg_catalog.text[]
    )
    into member_preferred_work_types
    from pg_catalog.jsonb_array_elements_text(
      pg_catalog.jsonb_extract_path(member_item, 'preferred_work_types')
    ) with ordinality as item(value, ordinality);

    select coalesce(
      pg_catalog.array_agg(pg_catalog.btrim(item.value) order by item.ordinality),
      '{}'::pg_catalog.text[]
    )
    into member_evidence_types
    from pg_catalog.jsonb_array_elements_text(
      pg_catalog.jsonb_extract_path(member_item, 'evidence_types')
    ) with ordinality as item(value, ordinality);

    if pg_catalog.cardinality(member_roles) = 0
      and pg_catalog.cardinality(member_strengths) = 0
    then
      raise exception 'Choose at least one role or strength for every member';
    end if;

    if pg_catalog.jsonb_typeof(
      pg_catalog.jsonb_extract_path(member_item, 'availability_minutes_per_day')
    ) <> 'number'
      or pg_catalog.jsonb_extract_path_text(
        member_item,
        'availability_minutes_per_day'
      ) !~ '^[0-9]+$'
      or pg_catalog.jsonb_extract_path_text(
        member_item,
        'availability_minutes_per_day'
      )::pg_catalog.int4 not between 15 and 1440
    then
      raise exception 'Member availability must be between 15 and 1440 minutes';
    end if;

    if pg_catalog.jsonb_typeof(
      pg_catalog.jsonb_extract_path(member_item, 'experience_level')
    ) <> 'string'
      or pg_catalog.char_length(
        pg_catalog.btrim(
          pg_catalog.jsonb_extract_path_text(member_item, 'experience_level')
        )
      ) not between 2 and 80
    then
      raise exception 'Member experience level must be between 2 and 80 characters';
    end if;
    member_experience_level := pg_catalog.btrim(
      pg_catalog.jsonb_extract_path_text(member_item, 'experience_level')
    );

    if pg_catalog.jsonb_typeof(
      pg_catalog.jsonb_extract_path(member_item, 'best_work_time')
    ) <> 'string'
      or pg_catalog.char_length(
        pg_catalog.btrim(
          pg_catalog.jsonb_extract_path_text(member_item, 'best_work_time')
        )
      ) not between 2 and 80
    then
      raise exception 'Member best work time must be between 2 and 80 characters';
    end if;
    member_best_work_time := pg_catalog.btrim(
      pg_catalog.jsonb_extract_path_text(member_item, 'best_work_time')
    );

    if pg_catalog.jsonb_typeof(
      pg_catalog.jsonb_extract_path(member_item, 'notes')
    ) <> 'string'
      or pg_catalog.char_length(
        pg_catalog.jsonb_extract_path_text(member_item, 'notes')
      ) > 1000
      or pg_catalog.jsonb_typeof(
        pg_catalog.jsonb_extract_path(member_item, 'custom_notes')
      ) <> 'string'
      or pg_catalog.char_length(
        pg_catalog.jsonb_extract_path_text(member_item, 'custom_notes')
      ) > 1000
    then
      raise exception 'Member notes must not exceed 1000 characters';
    end if;
    member_notes := pg_catalog.jsonb_extract_path_text(member_item, 'notes');
    member_custom_notes := pg_catalog.jsonb_extract_path_text(member_item, 'custom_notes');

    pledge_item := pg_catalog.jsonb_extract_path(member_item, 'pledge');
    if pledge_item is null or pg_catalog.jsonb_typeof(pledge_item) <> 'object' then
      raise exception 'Every member requires a pledge object';
    end if;
    select pg_catalog.count(*)
    into key_count
    from pg_catalog.jsonb_object_keys(pledge_item) as item(key)
    where item.key in ('amount', 'currency');
    if key_count <> 2 or (
      select pg_catalog.count(*)
      from pg_catalog.jsonb_object_keys(pledge_item) as item(key)
    ) <> 2 then
      raise exception 'Pledge setup has missing or unsupported fields';
    end if;
    if pg_catalog.jsonb_typeof(
      pg_catalog.jsonb_extract_path(pledge_item, 'amount')
    ) <> 'number' then
      raise exception 'Pledge amount must be numeric';
    end if;
    member_pledge_amount := pg_catalog.jsonb_extract_path_text(
      pledge_item,
      'amount'
    )::pg_catalog.numeric;
    if member_pledge_amount::pg_catalog.text in ('NaN', 'Infinity', '-Infinity')
      or member_pledge_amount < 0
      or member_pledge_amount > 1000000
      or member_pledge_amount <> pg_catalog.round(member_pledge_amount, 2)
      or member_pledge_amount <> p_pledge_amount
    then
      raise exception 'Every member pledge must match the valid project pledge amount';
    end if;
    if pg_catalog.jsonb_typeof(
      pg_catalog.jsonb_extract_path(pledge_item, 'currency')
    ) <> 'string' then
      raise exception 'Pledge currency must be a string';
    end if;
    member_pledge_currency := pg_catalog.jsonb_extract_path_text(
      pledge_item,
      'currency'
    );
    if member_pledge_currency <> 'POINTS' then
      raise exception 'New projects support POINTS pledges only';
    end if;

    normalized_member := pg_catalog.jsonb_build_object(
      'member_id',
      member_id,
      'roles',
      pg_catalog.to_jsonb(member_roles),
      'strengths',
      pg_catalog.to_jsonb(member_strengths),
      'weaknesses',
      pg_catalog.to_jsonb(member_weaknesses),
      'availability_minutes_per_day',
      pg_catalog.jsonb_extract_path_text(
        member_item,
        'availability_minutes_per_day'
      )::pg_catalog.int4,
      'preferred_work_types',
      pg_catalog.to_jsonb(member_preferred_work_types),
      'evidence_types',
      pg_catalog.to_jsonb(member_evidence_types),
      'experience_level',
      member_experience_level,
      'best_work_time',
      member_best_work_time,
      'notes',
      member_notes,
      'custom_notes',
      member_custom_notes,
      'pledge',
      pg_catalog.jsonb_build_object(
        'amount',
        member_pledge_amount,
        'currency',
        member_pledge_currency
      )
    );
    normalized_members := normalized_members
      OPERATOR(pg_catalog.||) pg_catalog.jsonb_build_array(normalized_member);
  end loop;

  if not caller_is_selected then
    raise exception 'The project creator must be a selected member';
  end if;

  select coalesce(
    pg_catalog.jsonb_agg(
      item.value
      order by pg_catalog.jsonb_extract_path_text(item.value, 'member_id')
    ),
    '[]'::pg_catalog.jsonb
  )
  into normalized_members
  from pg_catalog.jsonb_array_elements(normalized_members) as item(value);

  request_fingerprint := pg_catalog.jsonb_build_object(
    'team_id',
    p_team_id,
    'project_type',
    p_project_type,
    'title',
    p_title,
    'description',
    p_description,
    'goal',
    p_goal,
    'selected_success_criteria',
    pg_catalog.to_jsonb(normalized_selected_criteria),
    'custom_success_criteria',
    pg_catalog.to_jsonb(normalized_custom_criteria),
    'start_date',
    p_start_date,
    'end_date',
    p_end_date,
    'pledge_amount',
    p_pledge_amount,
    'pledge_amount_is_custom',
    p_pledge_amount_is_custom,
    'members',
    normalized_members
  );
  request_payload_hash := pg_catalog.encode(
    extensions.digest(request_fingerprint::pg_catalog.text, 'sha256'),
    'hex'
  );

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_request_id::pg_catalog.text, 0)
  );

  select
    request.created_by,
    request.project_id,
    request.payload_hash,
    (
      select pg_catalog.count(*)
      from public.project_member_profiles as profile
      where profile.project_id = request.project_id
    ),
    (
      select pg_catalog.count(*)
      from public.pledges as pledge
      where pledge.project_id = request.project_id
    ),
    (
      select pg_catalog.count(*)
      from public.audit_logs as audit
      where audit.project_id = request.project_id
        and audit.action = 'project_created'
    )
  into
    existing_created_by,
    existing_project_id,
    existing_payload_hash,
    existing_profile_count,
    existing_pledge_count,
    existing_audit_count
  from private.project_creation_requests as request
  join public.projects as project
    on project.id = request.project_id
  where request.request_id = p_request_id;

  if existing_project_id is not null then
    if existing_created_by = caller_id
      and existing_payload_hash = request_payload_hash
      and existing_profile_count = member_count
      and existing_pledge_count = member_count
      and existing_audit_count = 1
    then
      return existing_project_id;
    end if;
    raise exception 'Project creation request already used with different data';
  end if;

  if exists (
    select 1
    from public.projects as project
    where project.id = p_request_id
  ) then
    raise exception 'Project creation request ID is already in use';
  end if;

  insert into public.projects (
    id,
    team_id,
    project_type,
    title,
    description,
    goal,
    success_criteria,
    selected_success_criteria,
    custom_success_criteria,
    pledge_amount,
    pledge_amount_is_custom,
    start_date,
    end_date,
    status,
    created_by
  )
  values (
    p_request_id,
    p_team_id,
    p_project_type,
    p_title,
    p_description,
    p_goal,
    success_criteria_json,
    normalized_selected_criteria,
    normalized_custom_criteria,
    p_pledge_amount,
    p_pledge_amount_is_custom,
    p_start_date,
    p_end_date,
    'draft',
    caller_id
  );

  for normalized_member in
    select item.value
    from pg_catalog.jsonb_array_elements(normalized_members) as item(value)
  loop
    member_id := pg_catalog.jsonb_extract_path_text(
      normalized_member,
      'member_id'
    )::pg_catalog.uuid;

    select coalesce(
      pg_catalog.array_agg(item.value order by item.ordinality),
      '{}'::pg_catalog.text[]
    )
    into member_roles
    from pg_catalog.jsonb_array_elements_text(
      pg_catalog.jsonb_extract_path(normalized_member, 'roles')
    ) with ordinality as item(value, ordinality);

    select coalesce(
      pg_catalog.array_agg(item.value order by item.ordinality),
      '{}'::pg_catalog.text[]
    )
    into member_strengths
    from pg_catalog.jsonb_array_elements_text(
      pg_catalog.jsonb_extract_path(normalized_member, 'strengths')
    ) with ordinality as item(value, ordinality);

    select coalesce(
      pg_catalog.array_agg(item.value order by item.ordinality),
      '{}'::pg_catalog.text[]
    )
    into member_weaknesses
    from pg_catalog.jsonb_array_elements_text(
      pg_catalog.jsonb_extract_path(normalized_member, 'weaknesses')
    ) with ordinality as item(value, ordinality);

    select coalesce(
      pg_catalog.array_agg(item.value order by item.ordinality),
      '{}'::pg_catalog.text[]
    )
    into member_preferred_work_types
    from pg_catalog.jsonb_array_elements_text(
      pg_catalog.jsonb_extract_path(normalized_member, 'preferred_work_types')
    ) with ordinality as item(value, ordinality);

    select coalesce(
      pg_catalog.array_agg(item.value order by item.ordinality),
      '{}'::pg_catalog.text[]
    )
    into member_evidence_types
    from pg_catalog.jsonb_array_elements_text(
      pg_catalog.jsonb_extract_path(normalized_member, 'evidence_types')
    ) with ordinality as item(value, ordinality);

    insert into public.project_member_profiles (
      project_id,
      user_id,
      roles,
      strengths,
      weaknesses,
      availability_minutes_per_day,
      preferred_work_types,
      evidence_types,
      experience_level,
      best_work_time,
      notes,
      custom_notes
    )
    values (
      p_request_id,
      member_id,
      member_roles,
      member_strengths,
      member_weaknesses,
      pg_catalog.jsonb_extract_path_text(
        normalized_member,
        'availability_minutes_per_day'
      )::pg_catalog.int4,
      member_preferred_work_types,
      member_evidence_types,
      pg_catalog.jsonb_extract_path_text(
        normalized_member,
        'experience_level'
      ),
      pg_catalog.jsonb_extract_path_text(
        normalized_member,
        'best_work_time'
      ),
      pg_catalog.jsonb_extract_path_text(normalized_member, 'notes'),
      pg_catalog.jsonb_extract_path_text(normalized_member, 'custom_notes')
    );

    pledge_item := pg_catalog.jsonb_extract_path(normalized_member, 'pledge');
    insert into public.pledges (
      project_id,
      user_id,
      amount,
      currency,
      status
    )
    values (
      p_request_id,
      member_id,
      pg_catalog.jsonb_extract_path_text(
        pledge_item,
        'amount'
      )::pg_catalog.numeric,
      pg_catalog.jsonb_extract_path_text(pledge_item, 'currency'),
      'declared'
    );
  end loop;

  insert into public.audit_logs (
    project_id,
    user_id,
    action,
    details
  )
  values (
    p_request_id,
    caller_id,
    'project_created',
    pg_catalog.jsonb_build_object(
      'title',
      p_title,
      'member_count',
      member_count,
      'request_id',
      p_request_id
    )
  );

  insert into private.project_creation_requests (
    request_id,
    project_id,
    created_by,
    payload_hash
  )
  values (
    p_request_id,
    p_request_id,
    caller_id,
    request_payload_hash
  );

  return p_request_id;
end;
$$;

drop policy if exists "members create draft projects" on public.projects;
drop policy if exists "owner manages project profiles" on public.project_member_profiles;
drop policy if exists "owner manages pledges" on public.pledges;
drop policy if exists "members add audit" on public.audit_logs;

create policy "members add non-creation audit"
on public.audit_logs
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and action <> 'project_created'
  and (
    project_id is null
    or (select private.is_project_member(project_id))
  )
);

revoke all on table public.projects from anon, authenticated;
revoke all on table public.project_member_profiles from anon, authenticated;
revoke all on table public.pledges from anon, authenticated;
revoke all on table public.audit_logs from anon, authenticated;

grant select, update on table public.projects to authenticated;
grant select on table public.project_member_profiles to authenticated;
grant select on table public.pledges to authenticated;
grant select, insert on table public.audit_logs to authenticated;

revoke all on function public.create_project_with_members(
  pg_catalog.uuid,
  pg_catalog.uuid,
  pg_catalog.text,
  pg_catalog.text,
  pg_catalog.text,
  pg_catalog.text,
  pg_catalog.text[],
  pg_catalog.text[],
  pg_catalog.date,
  pg_catalog.date,
  pg_catalog.numeric,
  pg_catalog.bool,
  pg_catalog.jsonb
) from public, anon, authenticated;

grant execute on function public.create_project_with_members(
  pg_catalog.uuid,
  pg_catalog.uuid,
  pg_catalog.text,
  pg_catalog.text,
  pg_catalog.text,
  pg_catalog.text,
  pg_catalog.text[],
  pg_catalog.text[],
  pg_catalog.date,
  pg_catalog.date,
  pg_catalog.numeric,
  pg_catalog.bool,
  pg_catalog.jsonb
) to authenticated, service_role;
