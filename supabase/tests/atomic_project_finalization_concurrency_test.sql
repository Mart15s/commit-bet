create extension if not exists pgtap with schema extensions;
create extension if not exists dblink with schema extensions;
set search_path = public, extensions;
select plan(13);

insert into auth.users (id, email)
values
  ('c1111111-1111-4111-8111-111111111111', 'owner@finalization-concurrency.test'),
  ('c2222222-2222-4222-8222-222222222222', 'member@finalization-concurrency.test');

insert into public.teams (id, name, owner_id, invite_code)
values (
  'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Finalization concurrency team',
  'c1111111-1111-4111-8111-111111111111',
  'FINLOCK'
);

insert into public.team_members (team_id, user_id, role)
values
  (
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'c1111111-1111-4111-8111-111111111111',
    'owner'
  ),
  (
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'c2222222-2222-4222-8222-222222222222',
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
  'c1000000-0000-4000-8000-000000000001',
  'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Concurrent finalization project',
  'Serialize exact finalization retries',
  current_date - 30,
  current_date + 30,
  'active',
  'c1111111-1111-4111-8111-111111111111'
);

insert into public.project_member_profiles (
  project_id,
  user_id,
  availability_minutes_per_day
)
values
  (
    'c1000000-0000-4000-8000-000000000001',
    'c1111111-1111-4111-8111-111111111111',
    60
  ),
  (
    'c1000000-0000-4000-8000-000000000001',
    'c2222222-2222-4222-8222-222222222222',
    60
  );

insert into public.pledges (project_id, user_id, amount, currency, status)
values
  (
    'c1000000-0000-4000-8000-000000000001',
    'c1111111-1111-4111-8111-111111111111',
    20,
    'POINTS',
    'declared'
  ),
  (
    'c1000000-0000-4000-8000-000000000001',
    'c2222222-2222-4222-8222-222222222222',
    20,
    'POINTS',
    'declared'
  );

insert into public.ai_reports (
  id,
  project_id,
  type,
  input_snapshot,
  output,
  model,
  provider
)
values (
  'c2000000-0000-4000-8000-000000000001',
  'c1000000-0000-4000-8000-000000000001',
  'final',
  '{"project":{"id":"c1000000-0000-4000-8000-000000000001"}}',
  '{
    "human_confirmation_required":true,
    "pledge_recommendation":[
      {
        "user_id":"c1111111-1111-4111-8111-111111111111",
        "pledge_return_percentage":100,
        "reason":"Owner recommendation."
      },
      {
        "user_id":"c2222222-2222-4222-8222-222222222222",
        "pledge_return_percentage":100,
        "reason":"Member recommendation."
      }
    ]
  }',
  'mock-finalization-concurrency-v1',
  'mock'
);

create temporary table finalization_concurrency_results (
  request_name pg_catalog.text primary key,
  result pg_catalog.jsonb not null
);

select lives_ok(
  $$
    select extensions.dblink_connect(
      'finalization_connection_1',
      'host=supabase_db_commitbet port=5432 dbname=postgres user=postgres password=postgres'
    )
  $$,
  'the first concurrent finalization session connects'
);

select lives_ok(
  $$
    select extensions.dblink_connect(
      'finalization_connection_2',
      'host=supabase_db_commitbet port=5432 dbname=postgres user=postgres password=postgres'
    )
  $$,
  'the second concurrent finalization session connects'
);

select extensions.dblink_exec('finalization_connection_1', 'begin');
select extensions.dblink_exec('finalization_connection_2', 'begin');
select extensions.dblink_exec(
  'finalization_connection_1',
  'set local role authenticated'
);
select extensions.dblink_exec(
  'finalization_connection_2',
  'set local role authenticated'
);
select extensions.dblink_exec(
  'finalization_connection_1',
  $$set local "request.jwt.claim.sub" =
    'c1111111-1111-4111-8111-111111111111'$$
);
select extensions.dblink_exec(
  'finalization_connection_2',
  $$set local "request.jwt.claim.sub" =
    'c1111111-1111-4111-8111-111111111111'$$
);

select is(
  extensions.dblink_send_query(
    'finalization_connection_1',
    $query$
      select public.finalize_project(
        'c1000000-0000-4000-8000-000000000001',
        'c2000000-0000-4000-8000-000000000001',
        'c3000000-0000-4000-8000-000000000001',
        '[
          {
            "user_id":"c1111111-1111-4111-8111-111111111111",
            "return_percentage":100
          },
          {
            "user_id":"c2222222-2222-4222-8222-222222222222",
            "return_percentage":100
          }
        ]'::jsonb,
        'Concurrent exact confirmation'
      )
    $query$
  ),
  1,
  'the first finalization request starts asynchronously'
);

do $wait_for_first$
begin
  while extensions.dblink_is_busy('finalization_connection_1') = 1 loop
    perform pg_catalog.pg_sleep(0.01);
  end loop;
end;
$wait_for_first$;

select is(
  extensions.dblink_send_query(
    'finalization_connection_2',
    $query$
      select public.finalize_project(
        'c1000000-0000-4000-8000-000000000001',
        'c2000000-0000-4000-8000-000000000001',
        'c3000000-0000-4000-8000-000000000001',
        '[
          {
            "user_id":"c1111111-1111-4111-8111-111111111111",
            "return_percentage":100
          },
          {
            "user_id":"c2222222-2222-4222-8222-222222222222",
            "return_percentage":100
          }
        ]'::jsonb,
        'Concurrent exact confirmation'
      )
    $query$
  ),
  1,
  'the exact retry starts in the second session'
);

select pg_catalog.pg_sleep(0.1);
select is(
  extensions.dblink_is_busy('finalization_connection_2'),
  1,
  'the exact retry waits on the project row lock'
);

insert into finalization_concurrency_results (request_name, result)
select 'first', response.result
from extensions.dblink_get_result(
  'finalization_connection_1'
) as response(result pg_catalog.jsonb);
select *
from extensions.dblink_get_result(
  'finalization_connection_1'
) as drained(result pg_catalog.jsonb);
select extensions.dblink_exec('finalization_connection_1', 'commit');

do $wait_for_retry$
begin
  while extensions.dblink_is_busy('finalization_connection_2') = 1 loop
    perform pg_catalog.pg_sleep(0.01);
  end loop;
end;
$wait_for_retry$;

insert into finalization_concurrency_results (request_name, result)
select 'retry', response.result
from extensions.dblink_get_result(
  'finalization_connection_2'
) as response(result pg_catalog.jsonb);
select *
from extensions.dblink_get_result(
  'finalization_connection_2'
) as drained(result pg_catalog.jsonb);
select extensions.dblink_exec('finalization_connection_2', 'commit');

select is(
  (
    select result ->> 'replayed'
    from finalization_concurrency_results
    where request_name = 'first'
  ),
  'false',
  'the lock winner performs the finalization once'
);

select is(
  (
    select result ->> 'replayed'
    from finalization_concurrency_results
    where request_name = 'retry'
  ),
  'true',
  'the waiting exact retry receives the stored result'
);

select is(
  (
    select first_result.result ->> 'final_decision_id'
    from finalization_concurrency_results as first_result
    where first_result.request_name = 'first'
  ),
  (
    select retry_result.result ->> 'final_decision_id'
    from finalization_concurrency_results as retry_result
    where retry_result.request_name = 'retry'
  ),
  'both concurrent callers receive the same decision identity'
);

select is(
  (
    select pg_catalog.count(*)::pg_catalog.int4
    from public.final_decisions
    where project_id = 'c1000000-0000-4000-8000-000000000001'
  ),
  1,
  'concurrent exact requests create one final decision'
);

select is(
  (
    select pg_catalog.count(*)::pg_catalog.int4
    from public.pledges
    where project_id = 'c1000000-0000-4000-8000-000000000001'
      and status = 'confirmed'
  ),
  2,
  'concurrent exact requests leave every pledge consistently confirmed'
);

select is(
  (
    select status
    from public.projects
    where id = 'c1000000-0000-4000-8000-000000000001'
  ),
  'completed',
  'concurrent exact requests leave one completed project state'
);

select is(
  (
    select pg_catalog.count(*)::pg_catalog.int4
    from public.audit_logs
    where project_id = 'c1000000-0000-4000-8000-000000000001'
      and action = 'final_decision_confirmed'
  ),
  1,
  'concurrent exact requests create one success audit'
);

select is(
  (
    select pg_catalog.count(*)::pg_catalog.int4
    from private.project_finalization_requests
    where project_id = 'c1000000-0000-4000-8000-000000000001'
  ),
  1,
  'concurrent exact requests store one idempotency result'
);

select extensions.dblink_disconnect('finalization_connection_1');
select extensions.dblink_disconnect('finalization_connection_2');

delete from public.teams
where id = 'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

delete from auth.users
where id in (
  'c1111111-1111-4111-8111-111111111111',
  'c2222222-2222-4222-8222-222222222222'
);

select * from finish();
