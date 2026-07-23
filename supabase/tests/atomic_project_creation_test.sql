begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(68);

insert into auth.users (id, email)
values
  ('11111111-1111-4111-8111-111111111111', 'owner@atomic-project.test'),
  ('22222222-2222-4222-8222-222222222222', 'member@atomic-project.test'),
  ('33333333-3333-4333-8333-333333333333', 'foreign@atomic-project.test'),
  ('44444444-4444-4444-8444-444444444444', 'outsider@atomic-project.test');

insert into public.teams (id, name, owner_id, invite_code)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Atomic project team',
    '11111111-1111-4111-8111-111111111111',
    'ATOMIC01'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Foreign project team',
    '33333333-3333-4333-8333-333333333333',
    'ATOMIC02'
  );

insert into public.team_members (team_id, user_id, role)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    'owner'
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '22222222-2222-4222-8222-222222222222',
    'member'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '33333333-3333-4333-8333-333333333333',
    'owner'
  );

create function pg_temp.member_setup(
  setup_user_id uuid,
  setup_role text default 'Builder'
)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'member_id', setup_user_id,
    'roles', pg_catalog.jsonb_build_array(setup_role),
    'strengths', '[]'::jsonb,
    'weaknesses', '[]'::jsonb,
    'availability_minutes_per_day', 60,
    'preferred_work_types', '["Focused work"]'::jsonb,
    'evidence_types', '["Demo"]'::jsonb,
    'experience_level', 'Intermediate',
    'best_work_time', 'Morning',
    'notes', '',
    'custom_notes', '',
    'pledge', '{"amount":20,"currency":"POINTS"}'::jsonb
  );
$$;

create function pg_temp.valid_members()
returns jsonb
language sql
stable
set search_path = ''
as $$
  select pg_catalog.jsonb_build_array(
    pg_temp.member_setup(
      '11111111-1111-4111-8111-111111111111',
      'Owner'
    ),
    pg_temp.member_setup(
      '22222222-2222-4222-8222-222222222222',
      'Builder'
    )
  );
$$;

create function pg_temp.create_atomic_project(
  request_id uuid,
  target_team_id uuid,
  project_title text,
  member_payload jsonb,
  pledge_amount numeric default 20,
  project_start_date date default '2026-07-24',
  project_end_date date default '2026-08-06'
)
returns uuid
language sql
set search_path = ''
as $$
  select public.create_project_with_members(
    request_id,
    target_team_id,
    'MVP / Startup project',
    project_title,
    'A complete atomic project creation test.',
    'Ship the project without partial setup rows.',
    array['The agreed deliverable is accepted'],
    array[]::text[],
    project_start_date,
    project_end_date,
    pledge_amount,
    false,
    member_payload
  );
$$;

select ok(
  has_function_privilege(
    'authenticated',
    'public.create_project_with_members(uuid,uuid,text,text,text,text,text[],text[],date,date,numeric,boolean,jsonb)',
    'EXECUTE'
  ),
  'authenticated callers can execute the atomic project creation RPC'
);

select ok(
  has_function_privilege(
    'service_role',
    'public.create_project_with_members(uuid,uuid,text,text,text,text,text[],text[],date,date,numeric,boolean,jsonb)',
    'EXECUTE'
  ),
  'service_role retains explicit RPC execution privilege'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.create_project_with_members(uuid,uuid,text,text,text,text,text[],text[],date,date,numeric,boolean,jsonb)',
    'EXECUTE'
  ),
  'anonymous callers cannot execute project creation'
);

select ok(
  not has_table_privilege('authenticated', 'public.projects', 'INSERT'),
  'authenticated callers cannot insert projects directly'
);

select ok(
  not has_table_privilege(
    'authenticated',
    'public.project_member_profiles',
    'INSERT'
  ),
  'authenticated callers cannot insert project profiles directly'
);

select ok(
  not has_table_privilege('authenticated', 'public.pledges', 'INSERT'),
  'authenticated callers cannot insert pledges directly'
);

select ok(
  has_table_privilege('authenticated', 'public.audit_logs', 'INSERT'),
  'authenticated audit inserts remain available for other workflows'
);

select ok(
  not exists (
    select 1
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename in ('projects', 'project_member_profiles', 'pledges')
      and cmd in ('INSERT', 'ALL')
  ),
  'project setup tables have no direct authenticated insert policies'
);

select ok(
  pg_catalog.pg_get_function_arguments(
    'public.create_project_with_members(uuid,uuid,text,text,text,text,text[],text[],date,date,numeric,boolean,jsonb)'::regprocedure
  ) not like '%created_by%',
  'the RPC contract does not let callers supply created_by'
);

select ok(
  pg_catalog.pg_get_function_arguments(
    'public.create_project_with_members(uuid,uuid,text,text,text,text,text[],text[],date,date,numeric,boolean,jsonb)'::regprocedure
  ) not like '%status%',
  'the RPC contract does not let callers supply a project status'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);

select is(
  pg_temp.create_atomic_project(
    '90000000-0000-4000-8000-000000000001',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Atomic owner project',
    pg_temp.valid_members()
  ),
  '90000000-0000-4000-8000-000000000001'::uuid,
  'an authorized team owner receives the stable project ID'
);

select is(
  (
    select count(*)::integer
    from public.projects
    where id = '90000000-0000-4000-8000-000000000001'
  ),
  1,
  'the project row is created once'
);

select is(
  (
    select status
    from public.projects
    where id = '90000000-0000-4000-8000-000000000001'
  ),
  'draft',
  'the project starts in draft status'
);

select is(
  (
    select created_by
    from public.projects
    where id = '90000000-0000-4000-8000-000000000001'
  ),
  '11111111-1111-4111-8111-111111111111'::uuid,
  'created_by is always the authenticated caller'
);

select is(
  (
    select count(*)::integer
    from public.project_member_profiles
    where project_id = '90000000-0000-4000-8000-000000000001'
  ),
  2,
  'every selected member receives exactly one capability profile'
);

select is(
  (
    select count(*)::integer
    from public.pledges
    where project_id = '90000000-0000-4000-8000-000000000001'
  ),
  2,
  'every selected member receives exactly one pledge'
);

select is(
  (
    select count(*)::integer
    from public.pledges
    where project_id = '90000000-0000-4000-8000-000000000001'
      and status = 'declared'
  ),
  2,
  'every initial pledge is declared'
);

select is(
  (
    select count(*)::integer
    from public.pledges
    where project_id = '90000000-0000-4000-8000-000000000001'
      and currency = 'POINTS'
  ),
  2,
  'every initial pledge uses virtual points'
);

select is(
  (
    select count(*)::integer
    from public.audit_logs
    where project_id = '90000000-0000-4000-8000-000000000001'
      and action = 'project_created'
      and user_id = '11111111-1111-4111-8111-111111111111'
  ),
  1,
  'one project-created audit event records the authenticated actor'
);

reset role;
select is(
  (
    select count(*)::integer
    from private.project_creation_requests
    where request_id = '90000000-0000-4000-8000-000000000001'
      and project_id = '90000000-0000-4000-8000-000000000001'
  ),
  1,
  'the successful transaction records one private idempotency entry'
);
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);

select is(
  pg_temp.create_atomic_project(
    '90000000-0000-4000-8000-000000000001',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Atomic owner project',
    pg_temp.valid_members()
  ),
  '90000000-0000-4000-8000-000000000001'::uuid,
  'an exact retry returns the original project ID'
);

select is(
  (
    select count(*)::integer
    from public.projects
    where id = '90000000-0000-4000-8000-000000000001'
  ),
  1,
  'an exact retry does not create another project'
);

select is(
  (
    select count(*)::integer
    from public.audit_logs
    where project_id = '90000000-0000-4000-8000-000000000001'
      and action = 'project_created'
  ),
  1,
  'an exact retry does not create a duplicate audit event'
);

select throws_ok(
  $$select pg_temp.create_atomic_project(
    '90000000-0000-4000-8000-000000000001',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Conflicting retry title',
    pg_temp.valid_members()
  )$$,
  'P0001',
  'Project creation request already used with different data',
  'a conflicting retry fails safely'
);

select set_config(
  'request.jwt.claim.sub',
  '22222222-2222-4222-8222-222222222222',
  true
);
select is(
  pg_temp.create_atomic_project(
    '90000000-0000-4000-8000-000000000002',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Regular member project',
    pg_temp.valid_members()
  ),
  '90000000-0000-4000-8000-000000000002'::uuid,
  'the current product model allows a regular team member to create'
);

select is(
  (
    select created_by
    from public.projects
    where id = '90000000-0000-4000-8000-000000000002'
  ),
  '22222222-2222-4222-8222-222222222222'::uuid,
  'regular-member creation still binds created_by to the caller'
);

select set_config('request.jwt.claim.sub', '', true);
select throws_ok(
  $$select pg_temp.create_atomic_project(
    '90000000-0000-4000-8000-000000000010',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Unauthenticated project',
    pg_temp.valid_members()
  )$$,
  'P0001',
  'Authentication required',
  'an authenticated database role without a user identity is rejected'
);

set local role anon;
select throws_ok(
  $$select public.create_project_with_members(
    '90000000-0000-4000-8000-000000000011',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'MVP / Startup project',
    'Anonymous project',
    'Anonymous project description',
    'Anonymous project goal',
    array['Criterion'],
    array[]::text[],
    '2026-07-24',
    '2026-08-06',
    20,
    false,
    '[]'::jsonb
  )$$,
  '42501',
  'permission denied for function create_project_with_members',
  'anon is denied at the function privilege boundary'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '44444444-4444-4444-8444-444444444444',
  true
);
select throws_ok(
  $$select pg_temp.create_atomic_project(
    '90000000-0000-4000-8000-000000000012',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Outsider project',
    pg_temp.valid_members()
  )$$,
  'P0001',
  'You are not allowed to create a project for this team',
  'a non-team member cannot create a project'
);

select throws_ok(
  $$select pg_temp.create_atomic_project(
    '90000000-0000-4000-8000-000000000013',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Inaccessible team project',
    pg_temp.valid_members()
  )$$,
  'P0001',
  'You are not allowed to create a project for this team',
  'a caller cannot create under an inaccessible team'
);

select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);
select throws_ok(
  $$select pg_temp.create_atomic_project(
    '90000000-0000-4000-8000-000000000014',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Creator omitted project',
    pg_catalog.jsonb_build_array(
      pg_temp.member_setup('22222222-2222-4222-8222-222222222222')
    )
  )$$,
  'P0001',
  'The project creator must be a selected member',
  'the creator must be included in the selected members'
);

select throws_ok(
  $$select pg_temp.create_atomic_project(
    '90000000-0000-4000-8000-000000000015',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Foreign member project',
    pg_catalog.jsonb_build_array(
      pg_temp.member_setup('11111111-1111-4111-8111-111111111111'),
      pg_temp.member_setup('33333333-3333-4333-8333-333333333333')
    )
  )$$,
  'P0001',
  'Every selected member must belong to this team',
  'a foreign-team member is rejected'
);

select throws_ok(
  $$select pg_temp.create_atomic_project(
    '90000000-0000-4000-8000-000000000016',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Duplicate member project',
    pg_catalog.jsonb_build_array(
      pg_temp.member_setup('11111111-1111-4111-8111-111111111111'),
      pg_temp.member_setup('11111111-1111-4111-8111-111111111111')
    )
  )$$,
  'P0001',
  'Project members must be unique',
  'duplicate selected member IDs are rejected'
);

select throws_ok(
  $$select pg_temp.create_atomic_project(
    '90000000-0000-4000-8000-000000000017',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Missing profile project',
    pg_catalog.jsonb_build_array(
      pg_temp.member_setup('11111111-1111-4111-8111-111111111111') - 'roles'
    )
  )$$,
  'P0001',
  'Member setup has missing or unsupported fields',
  'a missing required capability profile field is rejected'
);

select throws_ok(
  $$select pg_temp.create_atomic_project(
    '90000000-0000-4000-8000-000000000018',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Extra profile project',
    pg_catalog.jsonb_build_array(
      pg_temp.member_setup('11111111-1111-4111-8111-111111111111')
        || '{"profile_for":"22222222-2222-4222-8222-222222222222"}'::jsonb
    )
  )$$,
  'P0001',
  'Member setup has missing or unsupported fields',
  'an extra profile-like member field is rejected'
);

select throws_ok(
  $$select pg_temp.create_atomic_project(
    '90000000-0000-4000-8000-000000000019',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Missing pledge project',
    pg_catalog.jsonb_build_array(
      pg_temp.member_setup('11111111-1111-4111-8111-111111111111') - 'pledge'
    )
  )$$,
  'P0001',
  'Member setup has missing or unsupported fields',
  'a missing required pledge is rejected'
);

select throws_ok(
  $$select pg_temp.create_atomic_project(
    '90000000-0000-4000-8000-000000000020',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Unsupported pledge status project',
    pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_set(
        pg_temp.member_setup('11111111-1111-4111-8111-111111111111'),
        '{pledge}',
        '{"amount":20,"currency":"POINTS","status":"confirmed"}'::jsonb
      )
    )
  )$$,
  'P0001',
  'Pledge setup has missing or unsupported fields',
  'a caller cannot supply a privileged initial pledge status'
);

select throws_ok(
  $$select pg_temp.create_atomic_project(
    '90000000-0000-4000-8000-000000000021',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Too many members project',
    pg_catalog.jsonb_build_array(
      pg_temp.member_setup('11111111-1111-4111-8111-111111111111'),
      pg_temp.member_setup('11111111-1111-4111-8111-111111111111'),
      pg_temp.member_setup('11111111-1111-4111-8111-111111111111'),
      pg_temp.member_setup('11111111-1111-4111-8111-111111111111'),
      pg_temp.member_setup('11111111-1111-4111-8111-111111111111'),
      pg_temp.member_setup('11111111-1111-4111-8111-111111111111')
    )
  )$$,
  'P0001',
  'Choose between 1 and 5 project members',
  'more than five selected members are rejected'
);

select throws_ok(
  $$select pg_temp.create_atomic_project(
    '90000000-0000-4000-8000-000000000022',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Empty member project',
    '[]'::jsonb
  )$$,
  'P0001',
  'Choose between 1 and 5 project members',
  'an empty selected-member set is rejected'
);

select throws_ok(
  $$select pg_temp.create_atomic_project(
    '90000000-0000-4000-8000-000000000023',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Invalid dates project',
    pg_temp.valid_members(),
    20,
    '2026-08-06',
    '2026-07-24'
  )$$,
  'P0001',
  'Project dates must form a valid interval',
  'an invalid project date interval is rejected'
);

select throws_ok(
  $$select pg_temp.create_atomic_project(
    '90000000-0000-4000-8000-000000000024',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Invalid amount project',
    pg_temp.valid_members(),
    20.001
  )$$,
  'P0001',
  'Pledge amount must be between 0 and 1000000 with at most two decimal places',
  'an invalid project pledge amount is rejected'
);

select throws_ok(
  $$select pg_temp.create_atomic_project(
    '90000000-0000-4000-8000-000000000025',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Unsupported currency project',
    pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_set(
        pg_temp.member_setup('11111111-1111-4111-8111-111111111111'),
        '{pledge,currency}',
        '"EUR_DECLARED"'::jsonb
      )
    )
  )$$,
  'P0001',
  'New projects support POINTS pledges only',
  'an unsupported initial pledge currency is rejected'
);

select throws_ok(
  $$select pg_temp.create_atomic_project(
    '90000000-0000-4000-8000-000000000026',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Malformed member project',
    pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_set(
        pg_temp.member_setup('11111111-1111-4111-8111-111111111111'),
        '{roles}',
        '{"not":"an array"}'::jsonb
      )
    )
  )$$,
  'P0001',
  'Member capability lists are malformed',
  'malformed nested JSON is rejected'
);

select is(
  (
    select count(*)::integer
    from public.projects
    where id = '90000000-0000-4000-8000-000000000026'
  ),
  0,
  'malformed nested input leaves no project'
);

select is(
  (
    select count(*)::integer
    from public.audit_logs
    where project_id = '90000000-0000-4000-8000-000000000026'
  ),
  0,
  'malformed nested input leaves no audit event'
);

reset role;

create function pg_temp.fail_atomic_profile_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.project_id = '90000000-0000-4000-8000-000000000091' then
    raise exception 'Injected profile failure';
  end if;
  if new.project_id = '90000000-0000-4000-8000-000000000094' then
    new.availability_minutes_per_day := 0;
  end if;
  return new;
end;
$$;

create function pg_temp.fail_atomic_pledge_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.project_id = '90000000-0000-4000-8000-000000000092' then
    raise exception 'Injected pledge failure';
  end if;
  return new;
end;
$$;

create function pg_temp.fail_atomic_audit_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.project_id = '90000000-0000-4000-8000-000000000093'
    and new.action = 'project_created'
  then
    raise exception 'Injected audit failure';
  end if;
  return new;
end;
$$;

create trigger fail_atomic_profile_insert
before insert on public.project_member_profiles
for each row execute function pg_temp.fail_atomic_profile_insert();

create trigger fail_atomic_pledge_insert
before insert on public.pledges
for each row execute function pg_temp.fail_atomic_pledge_insert();

create trigger fail_atomic_audit_insert
before insert on public.audit_logs
for each row execute function pg_temp.fail_atomic_audit_insert();

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);

select throws_ok(
  $$select pg_temp.create_atomic_project(
    '90000000-0000-4000-8000-000000000091',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Injected profile failure project',
    pg_temp.valid_members()
  )$$,
  'P0001',
  'Injected profile failure',
  'a profile-stage failure aborts project creation'
);

select is(
  (select count(*)::integer from public.projects where id = '90000000-0000-4000-8000-000000000091'),
  0,
  'a profile-stage failure leaves no project'
);
select is(
  (select count(*)::integer from public.project_member_profiles where project_id = '90000000-0000-4000-8000-000000000091'),
  0,
  'a profile-stage failure leaves no profiles'
);
select is(
  (select count(*)::integer from public.pledges where project_id = '90000000-0000-4000-8000-000000000091'),
  0,
  'a profile-stage failure leaves no pledges'
);
select is(
  (select count(*)::integer from public.audit_logs where project_id = '90000000-0000-4000-8000-000000000091'),
  0,
  'a profile-stage failure leaves no audit'
);

select throws_ok(
  $$select pg_temp.create_atomic_project(
    '90000000-0000-4000-8000-000000000092',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Injected pledge failure project',
    pg_temp.valid_members()
  )$$,
  'P0001',
  'Injected pledge failure',
  'a pledge-stage failure aborts project creation'
);

select is(
  (select count(*)::integer from public.projects where id = '90000000-0000-4000-8000-000000000092'),
  0,
  'a pledge-stage failure rolls back the project'
);
select is(
  (select count(*)::integer from public.project_member_profiles where project_id = '90000000-0000-4000-8000-000000000092'),
  0,
  'a pledge-stage failure rolls back profiles'
);
select is(
  (select count(*)::integer from public.pledges where project_id = '90000000-0000-4000-8000-000000000092'),
  0,
  'a pledge-stage failure leaves no pledges'
);
select is(
  (select count(*)::integer from public.audit_logs where project_id = '90000000-0000-4000-8000-000000000092'),
  0,
  'a pledge-stage failure leaves no audit'
);

select throws_ok(
  $$select pg_temp.create_atomic_project(
    '90000000-0000-4000-8000-000000000093',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Injected audit failure project',
    pg_temp.valid_members()
  )$$,
  'P0001',
  'Injected audit failure',
  'an audit-stage failure aborts project creation'
);

select is(
  (select count(*)::integer from public.projects where id = '90000000-0000-4000-8000-000000000093'),
  0,
  'an audit-stage failure rolls back the project'
);
select is(
  (select count(*)::integer from public.project_member_profiles where project_id = '90000000-0000-4000-8000-000000000093'),
  0,
  'an audit-stage failure rolls back profiles'
);
select is(
  (select count(*)::integer from public.pledges where project_id = '90000000-0000-4000-8000-000000000093'),
  0,
  'an audit-stage failure rolls back pledges'
);
select is(
  (select count(*)::integer from public.audit_logs where project_id = '90000000-0000-4000-8000-000000000093'),
  0,
  'an audit-stage failure leaves no misleading audit'
);

select throws_ok(
  $$select pg_temp.create_atomic_project(
    '90000000-0000-4000-8000-000000000094',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Injected constraint failure project',
    pg_temp.valid_members()
  )$$,
  '23514',
  'new row for relation "project_member_profiles" violates check constraint "project_member_profiles_availability_minutes_per_day_check"',
  'a child-table constraint violation aborts project creation'
);

select is(
  (select count(*)::integer from public.projects where id = '90000000-0000-4000-8000-000000000094'),
  0,
  'a child-table constraint violation rolls back the project'
);

select is(
  (select count(*)::integer from public.audit_logs where project_id = '90000000-0000-4000-8000-000000000094'),
  0,
  'a child-table constraint violation leaves no audit'
);

reset role;
select is(
  (
    select count(*)::integer
    from private.project_creation_requests
    where request_id in (
      '90000000-0000-4000-8000-000000000091',
      '90000000-0000-4000-8000-000000000092',
      '90000000-0000-4000-8000-000000000093',
      '90000000-0000-4000-8000-000000000094'
    )
  ),
  0,
  'failed transactions leave no idempotency records'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);

select throws_ok(
  $$insert into public.projects (
    id, team_id, title, description, goal, start_date, end_date, created_by
  ) values (
    '90000000-0000-4000-8000-000000000095',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Direct bypass',
    'Direct bypass description',
    'Direct bypass goal',
    '2026-07-24',
    '2026-08-06',
    '11111111-1111-4111-8111-111111111111'
  )$$,
  '42501',
  'permission denied for table projects',
  'direct project insert cannot bypass atomic creation'
);

select throws_ok(
  $$insert into public.project_member_profiles (
    project_id, user_id, availability_minutes_per_day
  ) values (
    '90000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    60
  )$$,
  '42501',
  'permission denied for table project_member_profiles',
  'direct profile insert cannot bypass the RPC'
);

select throws_ok(
  $$insert into public.pledges (project_id, user_id, amount, currency)
  values (
    '90000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    20,
    'POINTS'
  )$$,
  '42501',
  'permission denied for table pledges',
  'direct pledge insert cannot bypass the RPC'
);

select throws_ok(
  $$insert into public.audit_logs (project_id, user_id, action)
  values (
    '90000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'project_created'
  )$$,
  '42501',
  'new row violates row-level security policy for table "audit_logs"',
  'direct audit insert cannot forge a project-created event'
);

select * from finish();
rollback;
