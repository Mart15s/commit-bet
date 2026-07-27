begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

insert into auth.users (id, email)
values
  ('81111111-1111-4111-8111-111111111111', 'owner@daily-log.test'),
  ('82222222-2222-4222-8222-222222222222', 'member@daily-log.test'),
  ('83333333-3333-4333-8333-333333333333', 'team-only@daily-log.test'),
  ('84444444-4444-4444-8444-444444444444', 'other-owner@daily-log.test'),
  ('85555555-5555-4555-8555-555555555555', 'outsider@daily-log.test');

insert into public.teams (id, name, owner_id, invite_code)
values
  (
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Atomic daily log team',
    '81111111-1111-4111-8111-111111111111',
    'DAILYLOG'
  ),
  (
    '8bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Other daily log team',
    '84444444-4444-4444-8444-444444444444',
    'OTHERLOG'
  );

insert into public.team_members (team_id, user_id, role)
values
  (
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '81111111-1111-4111-8111-111111111111',
    'owner'
  ),
  (
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '82222222-2222-4222-8222-222222222222',
    'member'
  ),
  (
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '83333333-3333-4333-8333-333333333333',
    'member'
  ),
  (
    '8bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '84444444-4444-4444-8444-444444444444',
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
values
  (
    '81000000-0000-4000-8000-000000000001',
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Active daily log project A',
    'Save daily logs atomically',
    current_date - 30,
    current_date + 30,
    'active',
    '81111111-1111-4111-8111-111111111111'
  ),
  (
    '81000000-0000-4000-8000-000000000002',
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Active daily log project B',
    'Stay isolated from project A',
    current_date - 30,
    current_date + 30,
    'active',
    '81111111-1111-4111-8111-111111111111'
  ),
  (
    '81000000-0000-4000-8000-000000000003',
    '8bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Other team daily log project',
    'Reject cross-team writes',
    current_date - 30,
    current_date + 30,
    'active',
    '84444444-4444-4444-8444-444444444444'
  ),
  (
    '81000000-0000-4000-8000-000000000004',
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Draft daily log project',
    'Reject logs before activation',
    current_date - 30,
    current_date + 30,
    'draft',
    '81111111-1111-4111-8111-111111111111'
  );

insert into public.project_member_profiles (
  project_id,
  user_id,
  availability_minutes_per_day
)
values
  (
    '81000000-0000-4000-8000-000000000001',
    '81111111-1111-4111-8111-111111111111',
    60
  ),
  (
    '81000000-0000-4000-8000-000000000001',
    '82222222-2222-4222-8222-222222222222',
    60
  ),
  (
    '81000000-0000-4000-8000-000000000002',
    '81111111-1111-4111-8111-111111111111',
    60
  ),
  (
    '81000000-0000-4000-8000-000000000003',
    '84444444-4444-4444-8444-444444444444',
    60
  ),
  (
    '81000000-0000-4000-8000-000000000004',
    '81111111-1111-4111-8111-111111111111',
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
    '82000000-0000-4000-8000-000000000001',
    '81000000-0000-4000-8000-000000000001',
    'Project A open task one',
    'Primary daily log task.',
    '["Daily work is recorded"]',
    array['link'],
    'high',
    current_date + 10,
    'in_progress'
  ),
  (
    '82000000-0000-4000-8000-000000000002',
    '81000000-0000-4000-8000-000000000001',
    'Project A open task two',
    'Replacement daily log task.',
    '["Replacement remains atomic"]',
    array['link'],
    'medium',
    current_date + 12,
    'needs_changes'
  ),
  (
    '82000000-0000-4000-8000-000000000003',
    '81000000-0000-4000-8000-000000000001',
    'Project A approved task',
    'Approved tasks cannot receive daily proof.',
    '["Already approved"]',
    array['link'],
    'low',
    current_date + 5,
    'approved'
  ),
  (
    '82000000-0000-4000-8000-000000000004',
    '81000000-0000-4000-8000-000000000002',
    'Project B task',
    'Must stay isolated.',
    '["Project B remains unchanged"]',
    array['link'],
    'high',
    current_date + 10,
    'in_progress'
  ),
  (
    '82000000-0000-4000-8000-000000000005',
    '81000000-0000-4000-8000-000000000003',
    'Other team task',
    'Must never cross team boundaries.',
    '["Other team remains isolated"]',
    array['link'],
    'high',
    current_date + 10,
    'in_progress'
  );

insert into public.task_assignments (task_id, user_id, assigned_reason)
values
  (
    '82000000-0000-4000-8000-000000000001',
    '81111111-1111-4111-8111-111111111111',
    'Owner task'
  ),
  (
    '82000000-0000-4000-8000-000000000002',
    '82222222-2222-4222-8222-222222222222',
    'Member task'
  ),
  (
    '82000000-0000-4000-8000-000000000003',
    '81111111-1111-4111-8111-111111111111',
    'Approved owner task'
  ),
  (
    '82000000-0000-4000-8000-000000000004',
    '81111111-1111-4111-8111-111111111111',
    'Project B owner task'
  ),
  (
    '82000000-0000-4000-8000-000000000005',
    '84444444-4444-4444-8444-444444444444',
    'Other team task'
  );

create or replace function pg_temp.daily_payload(
  target_project_id pg_catalog.uuid,
  target_task_id pg_catalog.uuid,
  payload_summary pg_catalog.text default 'Complete atomic daily log',
  proof_link pg_catalog.text default 'https://example.test/proof'
)
returns pg_catalog.jsonb
language sql
stable
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'project_id',
    target_project_id,
    'log_date',
    current_date,
    'summary',
    payload_summary,
    'time_spent_minutes',
    60,
    'blockers',
    '',
    'next_steps',
    'Verify the atomic save.',
    'task_ids',
    case
      when target_task_id is null then '[]'::pg_catalog.jsonb
      else pg_catalog.jsonb_build_array(target_task_id)
    end,
    'proof_links',
    case
      when proof_link is null then '[]'::pg_catalog.jsonb
      else pg_catalog.jsonb_build_array(proof_link)
    end
  );
$$;

create or replace function pg_temp.owner_snapshot(
  target_project_id pg_catalog.uuid
)
returns pg_catalog.jsonb
language sql
stable
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'logs',
    (
      select coalesce(
        pg_catalog.jsonb_agg(
          pg_catalog.jsonb_build_object(
            'id', log.id,
            'date', log.log_date,
            'summary', log.summary,
            'minutes', log.time_spent_minutes,
            'blockers', log.blockers,
            'next_steps', log.next_steps
          )
          order by log.log_date, log.id
        ),
        '[]'::pg_catalog.jsonb
      )
      from public.daily_logs as log
      where log.project_id = target_project_id
        and log.user_id = '81111111-1111-4111-8111-111111111111'
    ),
    'task_links',
    (
      select coalesce(
        pg_catalog.jsonb_agg(link.task_id order by link.task_id),
        '[]'::pg_catalog.jsonb
      )
      from public.daily_log_tasks as link
      join public.daily_logs as log on log.id = link.daily_log_id
      where log.project_id = target_project_id
        and log.user_id = '81111111-1111-4111-8111-111111111111'
    ),
    'proof',
    (
      select coalesce(
        pg_catalog.jsonb_agg(
          pg_catalog.jsonb_build_object(
            'task_id', evidence.task_id,
            'url', evidence.url
          )
          order by evidence.task_id, evidence.url
        ),
        '[]'::pg_catalog.jsonb
      )
      from public.evidence as evidence
      join public.daily_logs as log on log.id = evidence.daily_log_id
      where log.project_id = target_project_id
        and log.user_id = '81111111-1111-4111-8111-111111111111'
    ),
    'audit_count',
    (
      select pg_catalog.count(*)
      from public.audit_logs as audit
      where audit.project_id = target_project_id
        and audit.user_id = '81111111-1111-4111-8111-111111111111'
        and audit.action = 'daily_log_submitted'
    )
  );
$$;

select ok(
  has_function_privilege(
    'authenticated',
    'public.save_daily_log_with_tasks(uuid,jsonb,text)',
    'EXECUTE'
  ),
  'authenticated callers can execute the daily log RPC'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.save_daily_log_with_tasks(uuid,jsonb,text)',
    'EXECUTE'
  ),
  'anonymous callers cannot execute the daily log RPC'
);

select ok(
  not has_table_privilege('authenticated', 'public.daily_logs', 'INSERT')
  and not has_table_privilege('authenticated', 'public.daily_logs', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.daily_logs', 'DELETE'),
  'authenticated callers cannot mutate daily logs directly'
);

select ok(
  not has_table_privilege(
    'authenticated',
    'public.daily_log_tasks',
    'INSERT'
  )
  and not has_table_privilege(
    'authenticated',
    'public.daily_log_tasks',
    'UPDATE'
  )
  and not has_table_privilege(
    'authenticated',
    'public.daily_log_tasks',
    'DELETE'
  ),
  'authenticated callers cannot mutate daily log task links directly'
);

select ok(
  (
    select procedure.prosecdef
      and 'search_path=""' = any(procedure.proconfig)
    from pg_catalog.pg_proc as procedure
    where procedure.oid =
      'public.save_daily_log_with_tasks(uuid,jsonb,text)'::pg_catalog.regprocedure
  ),
  'the RPC is SECURITY DEFINER with an empty search path'
);

select ok(
  pg_catalog.pg_get_function_arguments(
    'public.save_daily_log_with_tasks(uuid,jsonb,text)'::pg_catalog.regprocedure
  ) not like '%user_id%',
  'the RPC contract cannot impersonate another user'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '', true);

select throws_ok(
  $$
    select public.save_daily_log_with_tasks(
      '83000000-0000-4000-8000-000000000001',
      pg_temp.daily_payload(
        '81000000-0000-4000-8000-000000000001',
        '82000000-0000-4000-8000-000000000001'
      ),
      repeat('1', 64)
    )
  $$,
  'Authentication required',
  'an unauthenticated database caller is rejected'
);

select set_config(
  'request.jwt.claim.sub',
  '83333333-3333-4333-8333-333333333333',
  true
);
select throws_ok(
  $$
    select public.save_daily_log_with_tasks(
      '83000000-0000-4000-8000-000000000002',
      pg_temp.daily_payload(
        '81000000-0000-4000-8000-000000000001',
        null,
        'Team-only member attempt',
        null
      ),
      repeat('2', 64)
    )
  $$,
  'Not a member of this project',
  'a same-team user outside project_member_profiles is rejected'
);

select set_config(
  'request.jwt.claim.sub',
  '84444444-4444-4444-8444-444444444444',
  true
);
select throws_ok(
  $$
    select public.save_daily_log_with_tasks(
      '83000000-0000-4000-8000-000000000003',
      pg_temp.daily_payload(
        '81000000-0000-4000-8000-000000000001',
        null,
        'Other team attempt',
        null
      ),
      repeat('3', 64)
    )
  $$,
  'Not a member of this project',
  'a member of another team is rejected'
);

select set_config(
  'request.jwt.claim.sub',
  '81111111-1111-4111-8111-111111111111',
  true
);
select throws_ok(
  $$
    select public.save_daily_log_with_tasks(
      '83000000-0000-4000-8000-000000000004',
      pg_temp.daily_payload(
        '81000000-0000-4000-8000-000000000004',
        null,
        'Draft project attempt',
        null
      ),
      repeat('4', 64)
    )
  $$,
  'Daily logs are only allowed for active projects',
  'daily logs are rejected while a project is not active'
);

select lives_ok(
  $$
    select public.save_daily_log_with_tasks(
      '83000000-0000-4000-8000-000000000010',
      pg_temp.daily_payload(
        '81000000-0000-4000-8000-000000000001',
        '82000000-0000-4000-8000-000000000001',
        'Initial complete owner log',
        'https://example.test/owner-proof'
      ),
      repeat('a', 64)
    )
  $$,
  'a concrete project member can save a daily log'
);

select is(
  (
    select user_id
    from public.daily_logs
    where project_id = '81000000-0000-4000-8000-000000000001'
      and log_date = current_date
  ),
  '81111111-1111-4111-8111-111111111111'::pg_catalog.uuid,
  'the owner can only create a log as the authenticated owner'
);

select is(
  (
    select (
      public.save_daily_log_with_tasks(
        '83000000-0000-4000-8000-000000000010',
        pg_temp.daily_payload(
          '81000000-0000-4000-8000-000000000001',
          '82000000-0000-4000-8000-000000000001',
          'Initial complete owner log',
          'https://example.test/owner-proof'
        ),
        repeat('a', 64)
      )
    ) ->> 'replayed'
  ),
  'true',
  'an exact retry replays the committed result'
);

select is(
  (
    select pg_catalog.count(*)::pg_catalog.int4
    from public.daily_logs
    where project_id = '81000000-0000-4000-8000-000000000001'
      and user_id = '81111111-1111-4111-8111-111111111111'
      and log_date = current_date
  ),
  1,
  'an exact retry does not duplicate the daily log'
);

select is(
  (
    select pg_catalog.count(*)::pg_catalog.int4
    from public.daily_log_tasks as link
    join public.daily_logs as log on log.id = link.daily_log_id
    where log.project_id = '81000000-0000-4000-8000-000000000001'
      and log.user_id = '81111111-1111-4111-8111-111111111111'
      and log.log_date = current_date
  ),
  1,
  'an exact retry does not duplicate task links'
);

select is(
  (
    select pg_catalog.count(*)::pg_catalog.int4
    from public.evidence
    where daily_log_id = (
      select id
      from public.daily_logs
      where project_id = '81000000-0000-4000-8000-000000000001'
        and user_id = '81111111-1111-4111-8111-111111111111'
        and log_date = current_date
    )
  ),
  1,
  'an exact retry does not duplicate proof rows'
);

select is(
  (
    select pg_catalog.count(*)::pg_catalog.int4
    from public.audit_logs
    where project_id = '81000000-0000-4000-8000-000000000001'
      and user_id = '81111111-1111-4111-8111-111111111111'
      and action = 'daily_log_submitted'
  ),
  1,
  'an exact retry does not duplicate the audit row'
);

select throws_ok(
  $$
    select public.save_daily_log_with_tasks(
      '83000000-0000-4000-8000-000000000010',
      pg_temp.daily_payload(
        '81000000-0000-4000-8000-000000000001',
        '82000000-0000-4000-8000-000000000001',
        'Changed data with reused key',
        'https://example.test/owner-proof'
      ),
      repeat('b', 64)
    )
  $$,
  'Idempotency key was already used with different daily log data',
  'a reused key with different payload is rejected'
);

select throws_ok(
  $$
    select public.save_daily_log_with_tasks(
      '83000000-0000-4000-8000-000000000011',
      pg_temp.daily_payload(
        '81000000-0000-4000-8000-000000000001',
        '82000000-0000-4000-8000-000000000004',
        'Foreign project task',
        null
      ),
      repeat('c', 64)
    )
  $$,
  'Every task must belong to this project and be open',
  'a task from another project in the same team is rejected'
);

select throws_ok(
  $$
    select public.save_daily_log_with_tasks(
      '83000000-0000-4000-8000-000000000012',
      pg_temp.daily_payload(
        '81000000-0000-4000-8000-000000000001',
        '82000000-0000-4000-8000-000000000005',
        'Other team task',
        null
      ),
      repeat('d', 64)
    )
  $$,
  'Every task must belong to this project and be open',
  'a task from another team project is rejected'
);

select throws_ok(
  $$
    select public.save_daily_log_with_tasks(
      '83000000-0000-4000-8000-000000000013',
      pg_temp.daily_payload(
        '81000000-0000-4000-8000-000000000001',
        '82000000-0000-4000-8000-000000000003',
        'Approved task',
        null
      ),
      repeat('e', 64)
    )
  $$,
  'Every task must belong to this project and be open',
  'an approved task cannot receive daily log proof'
);

select throws_ok(
  $$
    select public.save_daily_log_with_tasks(
      '83000000-0000-4000-8000-000000000014',
      pg_temp.daily_payload(
        '81000000-0000-4000-8000-000000000001',
        '82000000-0000-4000-8000-000000000001',
        'Invalid URL',
        'not-a-url'
      ),
      repeat('f', 64)
    )
  $$,
  'Proof links must be valid HTTP or HTTPS URLs',
  'a malformed URL is rejected'
);

select throws_ok(
  $$
    select public.save_daily_log_with_tasks(
      '83000000-0000-4000-8000-000000000015',
      pg_temp.daily_payload(
        '81000000-0000-4000-8000-000000000001',
        '82000000-0000-4000-8000-000000000001',
        'Javascript URL',
        'javascript:alert(1)'
      ),
      repeat('1', 64)
    )
  $$,
  'Proof links must be valid HTTP or HTTPS URLs',
  'javascript proof URLs are rejected'
);

select throws_ok(
  $$
    select public.save_daily_log_with_tasks(
      '83000000-0000-4000-8000-000000000016',
      pg_temp.daily_payload(
        '81000000-0000-4000-8000-000000000001',
        '82000000-0000-4000-8000-000000000001',
        'Data URL',
        'data:text/plain,proof'
      ),
      repeat('2', 64)
    )
  $$,
  'Proof links must be valid HTTP or HTTPS URLs',
  'data proof URLs are rejected'
);

select throws_ok(
  $$
    select public.save_daily_log_with_tasks(
      '83000000-0000-4000-8000-000000000017',
      pg_temp.daily_payload(
        '81000000-0000-4000-8000-000000000001',
        '82000000-0000-4000-8000-000000000001',
        'File URL',
        'file:///tmp/proof'
      ),
      repeat('3', 64)
    )
  $$,
  'Proof links must be valid HTTP or HTTPS URLs',
  'file proof URLs are rejected'
);

select throws_ok(
  $$
    select public.save_daily_log_with_tasks(
      '83000000-0000-4000-8000-000000000018',
      pg_catalog.jsonb_set(
        pg_temp.daily_payload(
          '81000000-0000-4000-8000-000000000001',
          null,
          'Invalid date',
          null
        ),
        '{log_date}',
        '"2026-02-31"'::pg_catalog.jsonb
      ),
      repeat('4', 64)
    )
  $$,
  'Log date must be a valid ISO date',
  'an invalid calendar date is rejected'
);

select throws_ok(
  $$
    select public.save_daily_log_with_tasks(
      '83000000-0000-4000-8000-000000000019',
      pg_catalog.jsonb_set(
        pg_temp.daily_payload(
          '81000000-0000-4000-8000-000000000001',
          null,
          'Date before project',
          null
        ),
        '{log_date}',
        pg_catalog.to_jsonb(current_date - 31)
      ),
      repeat('5', 64)
    )
  $$,
  'Log date must be within the active project and not in the future',
  'a date before the project interval is rejected'
);

select throws_ok(
  $$
    select public.save_daily_log_with_tasks(
      '83000000-0000-4000-8000-000000000020',
      pg_catalog.jsonb_set(
        pg_temp.daily_payload(
          '81000000-0000-4000-8000-000000000001',
          null,
          'Future date',
          null
        ),
        '{log_date}',
        pg_catalog.to_jsonb(current_date + 1)
      ),
      repeat('6', 64)
    )
  $$,
  'Log date must be within the active project and not in the future',
  'a future daily log date is rejected'
);

select throws_ok(
  $$
    select public.save_daily_log_with_tasks(
      '83000000-0000-4000-8000-000000000021',
      pg_catalog.jsonb_set(
        pg_temp.daily_payload(
          '81000000-0000-4000-8000-000000000001',
          null,
          'Negative time',
          null
        ),
        '{time_spent_minutes}',
        '-1'::pg_catalog.jsonb
      ),
      repeat('7', 64)
    )
  $$,
  'Time spent must be between 0 and 1440 minutes',
  'negative time is rejected'
);

select throws_ok(
  $$
    select public.save_daily_log_with_tasks(
      '83000000-0000-4000-8000-000000000022',
      pg_catalog.jsonb_set(
        pg_temp.daily_payload(
          '81000000-0000-4000-8000-000000000001',
          null,
          'Excessive time',
          null
        ),
        '{time_spent_minutes}',
        '1441'::pg_catalog.jsonb
      ),
      repeat('8', 64)
    )
  $$,
  'Time spent must be between 0 and 1440 minutes',
  'time above one day is rejected'
);

select throws_ok(
  $$
    select public.save_daily_log_with_tasks(
      '83000000-0000-4000-8000-000000000023',
      pg_catalog.jsonb_set(
        pg_temp.daily_payload(
          '81000000-0000-4000-8000-000000000001',
          null,
          'Duplicate tasks',
          null
        ),
        '{task_ids}',
        '[
          "82000000-0000-4000-8000-000000000001",
          "82000000-0000-4000-8000-000000000001"
        ]'::pg_catalog.jsonb
      ),
      repeat('9', 64)
    )
  $$,
  'Task IDs must be unique',
  'duplicate task IDs are rejected before writes'
);

select throws_ok(
  $$
    select public.save_daily_log_with_tasks(
      '83000000-0000-4000-8000-000000000024',
      pg_catalog.jsonb_set(
        pg_temp.daily_payload(
          '81000000-0000-4000-8000-000000000001',
          '82000000-0000-4000-8000-000000000001',
          'Duplicate proof links',
          null
        ),
        '{proof_links}',
        '[
          "https://example.test/duplicate",
          "https://example.test/duplicate"
        ]'::pg_catalog.jsonb
      ),
      repeat('a', 64)
    )
  $$,
  'Proof links must be unique',
  'duplicate proof links are rejected before writes'
);

select throws_ok(
  $$
    select public.save_daily_log_with_tasks(
      '83000000-0000-4000-8000-000000000025',
      pg_catalog.jsonb_set(
        pg_temp.daily_payload(
          '81000000-0000-4000-8000-000000000001',
          null,
          'Too many tasks',
          null
        ),
        '{task_ids}',
        (
          select pg_catalog.jsonb_agg(
            '89000000-0000-4000-8000-' OPERATOR(pg_catalog.||)
            pg_catalog.to_char(item.number, 'FM000000000000')
          )
          from pg_catalog.generate_series(1, 51) as item(number)
        )
      ),
      repeat('b', 64)
    )
  $$,
  'Task IDs must be an array of at most 50 UUIDs',
  'more than 50 tasks are rejected'
);

select throws_ok(
  $$
    select public.save_daily_log_with_tasks(
      '83000000-0000-4000-8000-000000000026',
      pg_catalog.jsonb_set(
        pg_temp.daily_payload(
          '81000000-0000-4000-8000-000000000001',
          '82000000-0000-4000-8000-000000000001',
          'Too many links',
          null
        ),
        '{proof_links}',
        (
          select pg_catalog.jsonb_agg(
            pg_catalog.format('https://example.test/proof/%s', item.number)
          )
          from pg_catalog.generate_series(1, 21) as item(number)
        )
      ),
      repeat('c', 64)
    )
  $$,
  'Proof links must be valid HTTP or HTTPS URLs',
  'more than 20 proof links are rejected'
);

select throws_ok(
  $$
    select public.save_daily_log_with_tasks(
      '83000000-0000-4000-8000-000000000027',
      pg_catalog.jsonb_set(
        pg_temp.daily_payload(
          '81000000-0000-4000-8000-000000000001',
          null,
          'Oversized payload',
          null
        ),
        '{summary}',
        pg_catalog.to_jsonb(pg_catalog.repeat('x', 66000))
      ),
      repeat('d', 64)
    )
  $$,
  'Daily log payload is invalid or too large',
  'a payload above 64 KiB is rejected'
);

select throws_ok(
  $$
    select public.save_daily_log_with_tasks(
      '83000000-0000-4000-8000-000000000028',
      pg_catalog.jsonb_set(
        pg_temp.daily_payload(
          '81000000-0000-4000-8000-000000000001',
          null,
          'Proof without task',
          null
        ),
        '{proof_links}',
        '["https://example.test/orphan"]'::pg_catalog.jsonb
      ),
      repeat('e', 64)
    )
  $$,
  'Choose at least one task before adding proof links',
  'proof cannot be saved without a linked task'
);

set local role postgres;

create or replace function pg_temp.fail_daily_log_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'injected daily log failure';
end;
$$;

create trigger inject_daily_log_failure
before insert or update on public.daily_logs
for each row execute function pg_temp.fail_daily_log_write();

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '81111111-1111-4111-8111-111111111111',
  true
);
select throws_ok(
  $$
    select public.save_daily_log_with_tasks(
      '83000000-0000-4000-8000-000000000030',
      pg_temp.daily_payload(
        '81000000-0000-4000-8000-000000000001',
        '82000000-0000-4000-8000-000000000002',
        'Must roll back at daily log',
        'https://example.test/new-proof'
      ),
      repeat('1', 64)
    )
  $$,
  'injected daily log failure',
  'a daily log write failure aborts the RPC'
);
set local role postgres;
drop trigger inject_daily_log_failure on public.daily_logs;

select is(
  pg_temp.owner_snapshot('81000000-0000-4000-8000-000000000001'),
  pg_catalog.jsonb_build_object(
    'logs',
    pg_catalog.jsonb_build_array(
      (
        select pg_catalog.jsonb_build_object(
          'id', log.id,
          'date', log.log_date,
          'summary', 'Initial complete owner log',
          'minutes', 60,
          'blockers', '',
          'next_steps', 'Verify the atomic save.'
        )
        from public.daily_logs as log
        where log.project_id = '81000000-0000-4000-8000-000000000001'
          and log.user_id = '81111111-1111-4111-8111-111111111111'
          and log.log_date = current_date
      )
    ),
    'task_links',
    '["82000000-0000-4000-8000-000000000001"]'::pg_catalog.jsonb,
    'proof',
    '[{
      "task_id":"82000000-0000-4000-8000-000000000001",
      "url":"https://example.test/owner-proof"
    }]'::pg_catalog.jsonb,
    'audit_count',
    1
  ),
  'the complete old log survives a daily log write failure'
);

create or replace function pg_temp.fail_task_link_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'injected task link failure';
end;
$$;

create trigger inject_task_link_failure
before insert on public.daily_log_tasks
for each row execute function pg_temp.fail_task_link_write();

set local role authenticated;
select throws_ok(
  $$
    select public.save_daily_log_with_tasks(
      '83000000-0000-4000-8000-000000000031',
      pg_temp.daily_payload(
        '81000000-0000-4000-8000-000000000001',
        '82000000-0000-4000-8000-000000000002',
        'Must roll back at task link',
        'https://example.test/new-proof'
      ),
      repeat('2', 64)
    )
  $$,
  'injected task link failure',
  'a task-link failure aborts the RPC'
);
set local role postgres;
drop trigger inject_task_link_failure on public.daily_log_tasks;

select is(
  (
    pg_temp.owner_snapshot('81000000-0000-4000-8000-000000000001')
      ->> 'logs'
  ),
  (
    pg_catalog.jsonb_build_array(
      (
        select pg_catalog.jsonb_build_object(
          'id', log.id,
          'date', log.log_date,
          'summary', log.summary,
          'minutes', log.time_spent_minutes,
          'blockers', log.blockers,
          'next_steps', log.next_steps
        )
        from public.daily_logs as log
        where log.project_id = '81000000-0000-4000-8000-000000000001'
          and log.user_id = '81111111-1111-4111-8111-111111111111'
      )
    )::pg_catalog.text
  ),
  'the daily log row survives a task-link failure'
);
select is(
  pg_temp.owner_snapshot('81000000-0000-4000-8000-000000000001')
    -> 'task_links',
  '["82000000-0000-4000-8000-000000000001"]'::pg_catalog.jsonb,
  'the old task link survives a replacement failure'
);

create or replace function pg_temp.fail_daily_proof_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.daily_log_id is not null then
    raise exception 'injected proof failure';
  end if;
  return new;
end;
$$;

create trigger inject_proof_failure
before insert on public.evidence
for each row execute function pg_temp.fail_daily_proof_write();

set local role authenticated;
select throws_ok(
  $$
    select public.save_daily_log_with_tasks(
      '83000000-0000-4000-8000-000000000032',
      pg_temp.daily_payload(
        '81000000-0000-4000-8000-000000000001',
        '82000000-0000-4000-8000-000000000002',
        'Must roll back at proof',
        'https://example.test/new-proof'
      ),
      repeat('3', 64)
    )
  $$,
  'injected proof failure',
  'a proof insert failure aborts the RPC'
);
set local role postgres;
drop trigger inject_proof_failure on public.evidence;

select is(
  pg_temp.owner_snapshot('81000000-0000-4000-8000-000000000001')
    -> 'proof',
  '[{
    "task_id":"82000000-0000-4000-8000-000000000001",
    "url":"https://example.test/owner-proof"
  }]'::pg_catalog.jsonb,
  'the old proof survives a proof replacement failure'
);

create or replace function pg_temp.fail_daily_audit_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.action = 'daily_log_submitted' then
    raise exception 'injected audit failure';
  end if;
  return new;
end;
$$;

create trigger inject_audit_failure
before insert on public.audit_logs
for each row execute function pg_temp.fail_daily_audit_write();

set local role authenticated;
select throws_ok(
  $$
    select public.save_daily_log_with_tasks(
      '83000000-0000-4000-8000-000000000033',
      pg_temp.daily_payload(
        '81000000-0000-4000-8000-000000000001',
        '82000000-0000-4000-8000-000000000002',
        'Must roll back at audit',
        'https://example.test/new-proof'
      ),
      repeat('4', 64)
    )
  $$,
  'injected audit failure',
  'an audit insert failure aborts the RPC'
);
set local role postgres;
drop trigger inject_audit_failure on public.audit_logs;

select is(
  pg_temp.owner_snapshot('81000000-0000-4000-8000-000000000001')
    ->> 'audit_count',
  '1',
  'the failed audit stage leaves no duplicate audit row'
);

select is(
  (
    select pg_catalog.count(*)::pg_catalog.int4
    from private.daily_log_save_requests
    where idempotency_key in (
      '83000000-0000-4000-8000-000000000030',
      '83000000-0000-4000-8000-000000000031',
      '83000000-0000-4000-8000-000000000032',
      '83000000-0000-4000-8000-000000000033'
    )
  ),
  0,
  'every injected failure also rolls back idempotency state'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '81111111-1111-4111-8111-111111111111',
  true
);
select lives_ok(
  $$
    select public.save_daily_log_with_tasks(
      '83000000-0000-4000-8000-000000000040',
      pg_temp.daily_payload(
        '81000000-0000-4000-8000-000000000002',
        '82000000-0000-4000-8000-000000000004',
        'Project B isolated log',
        'https://example.test/project-b'
      ),
      repeat('5', 64)
    )
  $$,
  'project B receives its own daily log'
);
set local role postgres;

create temporary table isolation_snapshots (
  name pg_catalog.text primary key,
  value pg_catalog.jsonb not null
);
insert into isolation_snapshots (name, value)
values
  (
    'project_b',
    pg_temp.owner_snapshot('81000000-0000-4000-8000-000000000002')
  ),
  (
    'owner_a',
    pg_temp.owner_snapshot('81000000-0000-4000-8000-000000000001')
  );

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '82222222-2222-4222-8222-222222222222',
  true
);
select lives_ok(
  $$
    select public.save_daily_log_with_tasks(
      '83000000-0000-4000-8000-000000000041',
      pg_temp.daily_payload(
        '81000000-0000-4000-8000-000000000001',
        '82000000-0000-4000-8000-000000000002',
        'Project member independent log',
        'https://example.test/member-proof'
      ),
      repeat('6', 64)
    )
  $$,
  'a non-owner project member can save their own daily log'
);
set local role postgres;

select is(
  pg_temp.owner_snapshot('81000000-0000-4000-8000-000000000002'),
  (
    select value
    from isolation_snapshots
    where name = 'project_b'
  ),
  'saving project A does not change project B'
);

select is(
  pg_temp.owner_snapshot('81000000-0000-4000-8000-000000000001'),
  (
    select value
    from isolation_snapshots
    where name = 'owner_a'
  ),
  'one member save does not change another member daily log'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '81111111-1111-4111-8111-111111111111',
  true
);
select throws_ok(
  $$
    insert into public.evidence (
      daily_log_id,
      task_id,
      user_id,
      type,
      url,
      description,
      metadata
    )
    values (
      (
        select id
        from public.daily_logs
        where project_id = '81000000-0000-4000-8000-000000000001'
          and user_id = '81111111-1111-4111-8111-111111111111'
          and log_date = current_date
      ),
      '82000000-0000-4000-8000-000000000001',
      '81111111-1111-4111-8111-111111111111',
      'link',
      'https://example.test/forged-proof',
      'Forged daily proof',
      '{"daily_log_id":"forged"}'
    )
  $$,
  'new row violates row-level security policy for table "evidence"',
  'direct evidence writes cannot forge a daily log association'
);

select throws_ok(
  $$
    insert into public.audit_logs (
      project_id,
      user_id,
      action,
      details
    )
    values (
      '81000000-0000-4000-8000-000000000001',
      '81111111-1111-4111-8111-111111111111',
      'daily_log_submitted',
      '{}'::pg_catalog.jsonb
    )
  $$,
  'new row violates row-level security policy for table "audit_logs"',
  'direct audit writes cannot forge daily log success'
);

set local role postgres;

select is(
  (
    select pg_catalog.count(*)::pg_catalog.int4
    from public.daily_logs
    where project_id = '81000000-0000-4000-8000-000000000001'
      and log_date = current_date
  ),
  2,
  'project A has exactly one log per member for the day'
);

select * from finish();
rollback;
