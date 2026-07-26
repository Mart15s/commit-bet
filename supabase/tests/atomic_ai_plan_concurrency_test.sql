create extension if not exists pgtap with schema extensions;
create extension if not exists dblink with schema extensions;
set search_path = public, extensions;
select plan(11);

insert into auth.users (id, email)
values
  ('71111111-1111-4111-8111-111111111111', 'owner@plan-concurrency.test'),
  ('72222222-2222-4222-8222-222222222222', 'member@plan-concurrency.test');

insert into public.teams (id, name, owner_id, invite_code)
values (
  '7aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Plan concurrency team',
  '71111111-1111-4111-8111-111111111111',
  'PLANLOCK'
);

insert into public.team_members (team_id, user_id, role)
values
  (
    '7aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '71111111-1111-4111-8111-111111111111',
    'owner'
  ),
  (
    '7aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '72222222-2222-4222-8222-222222222222',
    'member'
  );

insert into public.projects (
  id,
  team_id,
  title,
  goal,
  start_date,
  end_date,
  status,
  created_by
)
values (
  '71000000-0000-4000-8000-000000000001',
  '7aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Concurrent plan project',
  'Serialize exact retries',
  '2026-07-24',
  '2026-08-06',
  'draft',
  '71111111-1111-4111-8111-111111111111'
);

insert into public.project_member_profiles (
  project_id,
  user_id,
  availability_minutes_per_day
)
values
  (
    '71000000-0000-4000-8000-000000000001',
    '71111111-1111-4111-8111-111111111111',
    60
  ),
  (
    '71000000-0000-4000-8000-000000000001',
    '72222222-2222-4222-8222-222222222222',
    60
  );

create temporary table concurrency_results (
  connection_name pg_catalog.text primary key,
  result pg_catalog.jsonb not null
);

select lives_ok(
  $$
    select dblink_connect(
      'plan_connection_1',
      'host=supabase_db_commitbet port=5432 dbname=postgres user=postgres password=postgres'
    )
  $$,
  'the first concurrent database session connects'
);

select lives_ok(
  $$
    select dblink_connect(
      'plan_connection_2',
      'host=supabase_db_commitbet port=5432 dbname=postgres user=postgres password=postgres'
    )
  $$,
  'the second concurrent database session connects'
);

select dblink_exec('plan_connection_1', 'begin');
select dblink_exec('plan_connection_2', 'begin');
select dblink_exec('plan_connection_1', 'set local role authenticated');
select dblink_exec('plan_connection_2', 'set local role authenticated');
select dblink_exec(
  'plan_connection_1',
  $$set local "request.jwt.claim.sub" =
    '71111111-1111-4111-8111-111111111111'$$
);
select dblink_exec(
  'plan_connection_2',
  $$set local "request.jwt.claim.sub" =
    '71111111-1111-4111-8111-111111111111'$$
);

select is(
  dblink_send_query(
    'plan_connection_1',
    $query$
      select public.replace_ai_project_plan(
        '71000000-0000-4000-8000-000000000001',
        '74000000-0000-4000-8000-000000000001',
        '{
          "phases":[{"name":"Build","description":"Build the result."}],
          "deliverables":["Working result"],
          "tasks":[{
            "title":"Concurrent generated task",
            "description":"Create the complete result.",
            "assigned_user_id":"72222222-2222-4222-8222-222222222222",
            "assigned_reason":"Project member capability match.",
            "priority":"high",
            "due_date":"2026-08-02",
            "acceptance_criteria":["The result works"],
            "expected_evidence_types":["demo"]
          }],
          "risks":["Scope growth"],
          "minimum_success_version":"One result.",
          "ambitious_success_version":"A polished result."
        }'::jsonb,
        'mock',
        'mock-concurrency-v1',
        '{"test":"concurrency"}'::jsonb,
        repeat('7', 64)
      )
    $query$
  ),
  1,
  'the first replacement request starts asynchronously'
);

-- Let the first statement finish while keeping its transaction open. This
-- makes it the deterministic lock holder before the retry is dispatched.
do $$
begin
  while dblink_is_busy('plan_connection_1') = 1 loop
    perform pg_sleep(0.01);
  end loop;
end;
$$;

select is(
  dblink_send_query(
    'plan_connection_2',
    $query$
      select public.replace_ai_project_plan(
        '71000000-0000-4000-8000-000000000001',
        '74000000-0000-4000-8000-000000000001',
        '{
          "phases":[{"name":"Build","description":"Build the result."}],
          "deliverables":["Working result"],
          "tasks":[{
            "title":"Concurrent generated task",
            "description":"Create the complete result.",
            "assigned_user_id":"72222222-2222-4222-8222-222222222222",
            "assigned_reason":"Project member capability match.",
            "priority":"high",
            "due_date":"2026-08-02",
            "acceptance_criteria":["The result works"],
            "expected_evidence_types":["demo"]
          }],
          "risks":["Scope growth"],
          "minimum_success_version":"One result.",
          "ambitious_success_version":"A polished result."
        }'::jsonb,
        'mock',
        'mock-concurrency-v1',
        '{"test":"concurrency"}'::jsonb,
        repeat('7', 64)
      )
    $query$
  ),
  1,
  'the exact retry starts in a second session'
);

select pg_sleep(0.1);
select is(
  dblink_is_busy('plan_connection_2'),
  1,
  'the second request waits on the project row lock'
);

insert into concurrency_results (connection_name, result)
select 'plan_connection_1', response.result
from dblink_get_result('plan_connection_1') as response(result jsonb);
select *
from dblink_get_result('plan_connection_1') as drained(result jsonb);
select dblink_exec('plan_connection_1', 'commit');

do $$
begin
  while dblink_is_busy('plan_connection_2') = 1 loop
    perform pg_sleep(0.01);
  end loop;
end;
$$;

insert into concurrency_results (connection_name, result)
select 'plan_connection_2', response.result
from dblink_get_result('plan_connection_2') as response(result jsonb);
select *
from dblink_get_result('plan_connection_2') as drained(result jsonb);
select dblink_exec('plan_connection_2', 'commit');

select is(
  (
    select result ->> 'replayed'
    from concurrency_results
    where connection_name = 'plan_connection_1'
  ),
  'false',
  'the lock winner creates the plan once'
);

select is(
  (
    select result ->> 'replayed'
    from concurrency_results
    where connection_name = 'plan_connection_2'
  ),
  'true',
  'the waiting exact retry receives the stored result'
);

select is(
  (
    select count(*)::integer
    from public.ai_reports
    where project_id = '71000000-0000-4000-8000-000000000001'
      and type = 'plan'
  ),
  1,
  'concurrent exact retries create one AI report'
);

select is(
  (
    select count(*)::integer
    from public.tasks
    where project_id = '71000000-0000-4000-8000-000000000001'
      and ai_generated
  ),
  1,
  'concurrent exact retries leave one active generated plan'
);

select is(
  (
    select count(*)::integer
    from public.task_assignments as assignment
    join public.tasks as task on task.id = assignment.task_id
    where task.project_id = '71000000-0000-4000-8000-000000000001'
      and task.ai_generated
  ),
  1,
  'the waiting request leaves no partial assignment'
);

select is(
  (
    select count(*)::integer
    from public.audit_logs
    where project_id = '71000000-0000-4000-8000-000000000001'
      and action = 'ai_plan_generated'
  ),
  1,
  'concurrent exact retries create one audit entry'
);

select dblink_disconnect('plan_connection_1');
select dblink_disconnect('plan_connection_2');

delete from public.teams
where id = '7aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

delete from auth.users
where id in (
  '71111111-1111-4111-8111-111111111111',
  '72222222-2222-4222-8222-222222222222'
);

select * from finish();
