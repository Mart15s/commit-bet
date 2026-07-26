create extension if not exists pgtap with schema extensions;
create extension if not exists dblink with schema extensions;
set search_path = public, extensions;
select no_plan();

insert into auth.users (id, email)
values (
  '91111111-1111-4111-8111-111111111111',
  'owner@daily-log-concurrency.test'
);

insert into public.teams (id, name, owner_id, invite_code)
values (
  '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Daily log concurrency team',
  '91111111-1111-4111-8111-111111111111',
  'LOGLOCK'
);

insert into public.team_members (team_id, user_id, role)
values (
  '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '91111111-1111-4111-8111-111111111111',
  'owner'
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
  '91000000-0000-4000-8000-000000000001',
  '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Concurrent daily log project',
  'Serialize daily log saves',
  current_date - 30,
  current_date + 30,
  'active',
  '91111111-1111-4111-8111-111111111111'
);

insert into public.project_member_profiles (
  project_id,
  user_id,
  availability_minutes_per_day
)
values (
  '91000000-0000-4000-8000-000000000001',
  '91111111-1111-4111-8111-111111111111',
  60
);

insert into public.tasks (
  id,
  project_id,
  title,
  description,
  acceptance_criteria,
  expected_evidence_types,
  priority,
  due_date,
  status
)
values
  (
    '92000000-0000-4000-8000-000000000001',
    '91000000-0000-4000-8000-000000000001',
    'Concurrent task one',
    'First complete save.',
    '["One atomic save"]',
    array['link'],
    'high',
    current_date + 10,
    'in_progress'
  ),
  (
    '92000000-0000-4000-8000-000000000002',
    '91000000-0000-4000-8000-000000000001',
    'Concurrent task two',
    'Second complete save.',
    '["Latest atomic save"]',
    array['link'],
    'high',
    current_date + 10,
    'in_progress'
  );

create temporary table concurrency_results (
  request_name pg_catalog.text primary key,
  result pg_catalog.jsonb not null
);

select lives_ok(
  $$
    select extensions.dblink_connect(
      'daily_log_connection_1',
      'host=supabase_db_commitbet port=5432 dbname=postgres user=postgres password=postgres'
    )
  $$,
  'the first concurrent daily log session connects'
);

select lives_ok(
  $$
    select extensions.dblink_connect(
      'daily_log_connection_2',
      'host=supabase_db_commitbet port=5432 dbname=postgres user=postgres password=postgres'
    )
  $$,
  'the second concurrent daily log session connects'
);

select extensions.dblink_exec('daily_log_connection_1', 'begin');
select extensions.dblink_exec('daily_log_connection_2', 'begin');
select extensions.dblink_exec(
  'daily_log_connection_1',
  'set local role authenticated'
);
select extensions.dblink_exec(
  'daily_log_connection_2',
  'set local role authenticated'
);
select extensions.dblink_exec(
  'daily_log_connection_1',
  $$set local "request.jwt.claim.sub" =
    '91111111-1111-4111-8111-111111111111'$$
);
select extensions.dblink_exec(
  'daily_log_connection_2',
  $$set local "request.jwt.claim.sub" =
    '91111111-1111-4111-8111-111111111111'$$
);

select is(
  extensions.dblink_send_query(
    'daily_log_connection_1',
    $query$
      select public.save_daily_log_with_tasks(
        '93000000-0000-4000-8000-000000000001',
        pg_catalog.jsonb_build_object(
          'project_id', '91000000-0000-4000-8000-000000000001',
          'log_date', current_date,
          'summary', 'Concurrent exact daily log',
          'time_spent_minutes', 60,
          'blockers', '',
          'next_steps', 'Confirm exact retry serialization.',
          'task_ids', '["92000000-0000-4000-8000-000000000001"]'::jsonb,
          'proof_links', '["https://example.test/concurrent-exact"]'::jsonb
        ),
        repeat('1', 64)
      )
    $query$
  ),
  1,
  'the first exact daily log request starts asynchronously'
);

do $$
begin
  while extensions.dblink_is_busy('daily_log_connection_1') = 1 loop
    perform pg_catalog.pg_sleep(0.01);
  end loop;
end;
$$;

select is(
  extensions.dblink_send_query(
    'daily_log_connection_2',
    $query$
      select public.save_daily_log_with_tasks(
        '93000000-0000-4000-8000-000000000001',
        pg_catalog.jsonb_build_object(
          'project_id', '91000000-0000-4000-8000-000000000001',
          'log_date', current_date,
          'summary', 'Concurrent exact daily log',
          'time_spent_minutes', 60,
          'blockers', '',
          'next_steps', 'Confirm exact retry serialization.',
          'task_ids', '["92000000-0000-4000-8000-000000000001"]'::jsonb,
          'proof_links', '["https://example.test/concurrent-exact"]'::jsonb
        ),
        repeat('1', 64)
      )
    $query$
  ),
  1,
  'the exact retry starts in the second session'
);

select pg_catalog.pg_sleep(0.1);
select is(
  extensions.dblink_is_busy('daily_log_connection_2'),
  1,
  'the exact retry waits on the uncommitted idempotency reservation'
);

insert into concurrency_results (request_name, result)
select 'exact_first', response.result
from extensions.dblink_get_result(
  'daily_log_connection_1'
) as response(result pg_catalog.jsonb);
select *
from extensions.dblink_get_result(
  'daily_log_connection_1'
) as drained(result pg_catalog.jsonb);
select extensions.dblink_exec('daily_log_connection_1', 'commit');

do $$
begin
  while extensions.dblink_is_busy('daily_log_connection_2') = 1 loop
    perform pg_catalog.pg_sleep(0.01);
  end loop;
end;
$$;

insert into concurrency_results (request_name, result)
select 'exact_retry', response.result
from extensions.dblink_get_result(
  'daily_log_connection_2'
) as response(result pg_catalog.jsonb);
select *
from extensions.dblink_get_result(
  'daily_log_connection_2'
) as drained(result pg_catalog.jsonb);
select extensions.dblink_exec('daily_log_connection_2', 'commit');

select is(
  (
    select result ->> 'replayed'
    from concurrency_results
    where request_name = 'exact_first'
  ),
  'false',
  'the exact retry lock winner performs one save'
);

select is(
  (
    select result ->> 'replayed'
    from concurrency_results
    where request_name = 'exact_retry'
  ),
  'true',
  'the waiting exact retry receives the stored result'
);

select is(
  (
    select pg_catalog.count(*)::pg_catalog.int4
    from public.daily_logs
    where project_id = '91000000-0000-4000-8000-000000000001'
      and user_id = '91111111-1111-4111-8111-111111111111'
      and log_date = current_date
  ),
  1,
  'concurrent exact retries leave one daily log'
);

select is(
  (
    select pg_catalog.count(*)::pg_catalog.int4
    from public.daily_log_tasks
    where daily_log_id = (
      select id
      from public.daily_logs
      where project_id = '91000000-0000-4000-8000-000000000001'
        and user_id = '91111111-1111-4111-8111-111111111111'
        and log_date = current_date
    )
  ),
  1,
  'concurrent exact retries leave one task link'
);

select is(
  (
    select pg_catalog.count(*)::pg_catalog.int4
    from public.evidence
    where daily_log_id = (
      select id
      from public.daily_logs
      where project_id = '91000000-0000-4000-8000-000000000001'
        and user_id = '91111111-1111-4111-8111-111111111111'
        and log_date = current_date
    )
  ),
  1,
  'concurrent exact retries leave one proof row'
);

select is(
  (
    select pg_catalog.count(*)::pg_catalog.int4
    from public.audit_logs
    where project_id = '91000000-0000-4000-8000-000000000001'
      and user_id = '91111111-1111-4111-8111-111111111111'
      and action = 'daily_log_submitted'
  ),
  1,
  'concurrent exact retries leave one audit row'
);

select extensions.dblink_exec('daily_log_connection_1', 'begin');
select extensions.dblink_exec('daily_log_connection_2', 'begin');
select extensions.dblink_exec(
  'daily_log_connection_1',
  'set local role authenticated'
);
select extensions.dblink_exec(
  'daily_log_connection_2',
  'set local role authenticated'
);
select extensions.dblink_exec(
  'daily_log_connection_1',
  $$set local "request.jwt.claim.sub" =
    '91111111-1111-4111-8111-111111111111'$$
);
select extensions.dblink_exec(
  'daily_log_connection_2',
  $$set local "request.jwt.claim.sub" =
    '91111111-1111-4111-8111-111111111111'$$
);

select is(
  extensions.dblink_send_query(
    'daily_log_connection_1',
    $query$
      select public.save_daily_log_with_tasks(
        '93000000-0000-4000-8000-000000000002',
        pg_catalog.jsonb_build_object(
          'project_id', '91000000-0000-4000-8000-000000000001',
          'log_date', current_date,
          'summary', 'First distinct concurrent save',
          'time_spent_minutes', 70,
          'blockers', 'First blocker',
          'next_steps', 'First next step.',
          'task_ids', '["92000000-0000-4000-8000-000000000001"]'::jsonb,
          'proof_links', '["https://example.test/concurrent-first"]'::jsonb
        ),
        repeat('2', 64)
      )
    $query$
  ),
  1,
  'the first distinct save starts asynchronously'
);

do $$
begin
  while extensions.dblink_is_busy('daily_log_connection_1') = 1 loop
    perform pg_catalog.pg_sleep(0.01);
  end loop;
end;
$$;

select is(
  extensions.dblink_send_query(
    'daily_log_connection_2',
    $query$
      select public.save_daily_log_with_tasks(
        '93000000-0000-4000-8000-000000000003',
        pg_catalog.jsonb_build_object(
          'project_id', '91000000-0000-4000-8000-000000000001',
          'log_date', current_date,
          'summary', 'Second distinct concurrent save',
          'time_spent_minutes', 80,
          'blockers', 'Second blocker',
          'next_steps', 'Second next step.',
          'task_ids', '["92000000-0000-4000-8000-000000000002"]'::jsonb,
          'proof_links', '["https://example.test/concurrent-second"]'::jsonb
        ),
        repeat('3', 64)
      )
    $query$
  ),
  1,
  'the second distinct save starts in the other session'
);

select pg_catalog.pg_sleep(0.1);
select is(
  extensions.dblink_is_busy('daily_log_connection_2'),
  1,
  'the second distinct save waits on the unique daily log row'
);

insert into concurrency_results (request_name, result)
select 'distinct_first', response.result
from extensions.dblink_get_result(
  'daily_log_connection_1'
) as response(result pg_catalog.jsonb);
select *
from extensions.dblink_get_result(
  'daily_log_connection_1'
) as drained(result pg_catalog.jsonb);
select extensions.dblink_exec('daily_log_connection_1', 'commit');

do $$
begin
  while extensions.dblink_is_busy('daily_log_connection_2') = 1 loop
    perform pg_catalog.pg_sleep(0.01);
  end loop;
end;
$$;

insert into concurrency_results (request_name, result)
select 'distinct_second', response.result
from extensions.dblink_get_result(
  'daily_log_connection_2'
) as response(result pg_catalog.jsonb);
select *
from extensions.dblink_get_result(
  'daily_log_connection_2'
) as drained(result pg_catalog.jsonb);
select extensions.dblink_exec('daily_log_connection_2', 'commit');

select is(
  (
    select result ->> 'replayed'
    from concurrency_results
    where request_name = 'distinct_first'
  ),
  'false',
  'the first distinct request commits a complete save'
);

select is(
  (
    select result ->> 'replayed'
    from concurrency_results
    where request_name = 'distinct_second'
  ),
  'false',
  'the waiting distinct request commits a complete replacement'
);

select is(
  (
    select pg_catalog.count(*)::pg_catalog.int4
    from public.daily_logs
    where project_id = '91000000-0000-4000-8000-000000000001'
      and user_id = '91111111-1111-4111-8111-111111111111'
      and log_date = current_date
  ),
  1,
  'different concurrent requests still leave one logical daily log'
);

select is(
  (
    select summary
    from public.daily_logs
    where project_id = '91000000-0000-4000-8000-000000000001'
      and user_id = '91111111-1111-4111-8111-111111111111'
      and log_date = current_date
  ),
  'Second distinct concurrent save',
  'the serialized later request becomes the complete final log'
);

select is(
  (
    select pg_catalog.jsonb_agg(link.task_id order by link.task_id)
    from public.daily_log_tasks as link
    where link.daily_log_id = (
      select id
      from public.daily_logs
      where project_id = '91000000-0000-4000-8000-000000000001'
        and user_id = '91111111-1111-4111-8111-111111111111'
        and log_date = current_date
    )
  ),
  '["92000000-0000-4000-8000-000000000002"]'::pg_catalog.jsonb,
  'no partial task links remain from the earlier concurrent request'
);

select is(
  (
    select pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'task_id', evidence.task_id,
        'url', evidence.url
      )
      order by evidence.task_id, evidence.url
    )
    from public.evidence as evidence
    where evidence.daily_log_id = (
      select id
      from public.daily_logs
      where project_id = '91000000-0000-4000-8000-000000000001'
        and user_id = '91111111-1111-4111-8111-111111111111'
        and log_date = current_date
    )
  ),
  '[{
    "task_id":"92000000-0000-4000-8000-000000000002",
    "url":"https://example.test/concurrent-second"
  }]'::pg_catalog.jsonb,
  'no partial proof remains from the earlier concurrent request'
);

select is(
  (
    select pg_catalog.count(*)::pg_catalog.int4
    from public.audit_logs
    where project_id = '91000000-0000-4000-8000-000000000001'
      and user_id = '91111111-1111-4111-8111-111111111111'
      and action = 'daily_log_submitted'
  ),
  3,
  'each distinct committed request has one audit and the exact retry has none'
);

select is(
  (
    select pg_catalog.count(*)::pg_catalog.int4
    from private.daily_log_save_requests
    where user_id = '91111111-1111-4111-8111-111111111111'
  ),
  3,
  'idempotency state contains one complete result per distinct request'
);

select extensions.dblink_disconnect('daily_log_connection_1');
select extensions.dblink_disconnect('daily_log_connection_2');

delete from public.teams
where id = '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
delete from auth.users
where id = '91111111-1111-4111-8111-111111111111';

select * from finish();
