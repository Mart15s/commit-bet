begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(67);

insert into auth.users (id, email)
values
  ('11111111-1111-4111-8111-111111111111', 'owner@atomic-plan.test'),
  ('22222222-2222-4222-8222-222222222222', 'member@atomic-plan.test'),
  ('33333333-3333-4333-8333-333333333333', 'team-only@atomic-plan.test'),
  ('44444444-4444-4444-8444-444444444444', 'other-project@atomic-plan.test'),
  ('55555555-5555-4555-8555-555555555555', 'other-team@atomic-plan.test'),
  ('66666666-6666-4666-8666-666666666666', 'outsider@atomic-plan.test');

insert into public.teams (id, name, owner_id, invite_code)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Atomic plan team',
    '11111111-1111-4111-8111-111111111111',
    'ATOMICPLAN'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Other atomic plan team',
    '55555555-5555-4555-8555-555555555555',
    'OTHERPLAN'
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
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '33333333-3333-4333-8333-333333333333',
    'member'
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '44444444-4444-4444-8444-444444444444',
    'member'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '55555555-5555-4555-8555-555555555555',
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
    '10000000-0000-4000-8000-000000000001',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Draft atomic plan project',
    'Replace plans without partial writes',
    '2026-07-24',
    '2026-08-06',
    'draft',
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Active atomic plan project',
    'Reject active replacement',
    '2026-07-24',
    '2026-08-06',
    'active',
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Completed atomic plan project',
    'Reject completed replacement',
    '2026-07-24',
    '2026-08-06',
    'completed',
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Other project in same team',
    'Keep its plan isolated',
    '2026-07-24',
    '2026-08-06',
    'draft',
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    '10000000-0000-4000-8000-000000000005',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Other team project',
    'Reject cross-team access',
    '2026-07-24',
    '2026-08-06',
    'draft',
    '55555555-5555-4555-8555-555555555555'
  );

insert into public.project_member_profiles (
  project_id,
  user_id,
  availability_minutes_per_day
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    60
  ),
  (
    '10000000-0000-4000-8000-000000000001',
    '22222222-2222-4222-8222-222222222222',
    60
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111111',
    60
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    '11111111-1111-4111-8111-111111111111',
    60
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    '11111111-1111-4111-8111-111111111111',
    60
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    '44444444-4444-4444-8444-444444444444',
    60
  ),
  (
    '10000000-0000-4000-8000-000000000005',
    '55555555-5555-4555-8555-555555555555',
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
  ai_generated
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'Legacy generated task',
    'The plan that must survive failures.',
    '["Legacy task remains complete"]',
    array['demo'],
    'high',
    '2026-08-01',
    true
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'Manual task',
    'A user-authored task.',
    '["Manual task remains"]',
    array['document'],
    'medium',
    '2026-08-02',
    false
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000004',
    'Other project generated task',
    'Must not be changed.',
    '["Other project remains"]',
    array['demo'],
    'high',
    '2026-08-01',
    true
  );

insert into public.task_assignments (task_id, user_id, assigned_reason)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '22222222-2222-4222-8222-222222222222',
    'Legacy assignment'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111111',
    'Manual assignment'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '44444444-4444-4444-8444-444444444444',
    'Other project assignment'
  );

insert into public.ai_reports (
  id,
  project_id,
  type,
  input_snapshot,
  output,
  provider,
  model
)
values (
  '30000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'plan',
  '{"legacy":true}',
  '{"legacy":true}',
  'legacy',
  'legacy-v1'
);

create or replace function pg_temp.valid_ai_plan(
  assignee_id pg_catalog.uuid,
  task_title pg_catalog.text
)
returns pg_catalog.jsonb
language sql
immutable
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'phases',
    pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object(
        'name',
        'Build',
        'description',
        'Build and validate the result.'
      )
    ),
    'deliverables',
    pg_catalog.jsonb_build_array('Working result'),
    'tasks',
    pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object(
        'title',
        task_title,
        'description',
        'Create the complete working result.',
        'assigned_user_id',
        assignee_id,
        'assigned_reason',
        'Assigned from project-specific capability data.',
        'priority',
        'high',
        'due_date',
        '2026-08-02',
        'acceptance_criteria',
        pg_catalog.jsonb_build_array('The result works end to end'),
        'expected_evidence_types',
        pg_catalog.jsonb_build_array('demo')
      )
    ),
    'risks',
    pg_catalog.jsonb_build_array('Scope growth'),
    'minimum_success_version',
    'One complete result.',
    'ambitious_success_version',
    'A polished complete result.'
  );
$$;

create or replace function pg_temp.replace_plan(
  checked_project_id pg_catalog.uuid,
  request_id pg_catalog.uuid,
  assignee_id pg_catalog.uuid,
  task_title pg_catalog.text,
  supplied_hash pg_catalog.text
)
returns pg_catalog.jsonb
language sql
set search_path = ''
as $$
  select public.replace_ai_project_plan(
    checked_project_id,
    request_id,
    pg_temp.valid_ai_plan(assignee_id, task_title),
    'mock',
    'mock-test-v1',
    pg_catalog.jsonb_build_object(
      'project_id',
      checked_project_id,
      'test',
      true
    ),
    supplied_hash
  );
$$;

create or replace function pg_temp.fail_ai_plan_stage()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if pg_catalog.current_setting(
    'commitbet.test_ai_plan_failure',
    true
  ) = tg_argv[0] then
    raise exception 'Injected % failure', tg_argv[0];
  end if;
  return new;
end;
$$;

create trigger fail_ai_plan_report
before insert on public.ai_reports
for each row execute function pg_temp.fail_ai_plan_stage('report');

create trigger fail_ai_plan_task
before insert on public.tasks
for each row execute function pg_temp.fail_ai_plan_stage('task');

create trigger fail_ai_plan_assignment
before insert on public.task_assignments
for each row execute function pg_temp.fail_ai_plan_stage('assignment');

create trigger fail_ai_plan_audit
before insert on public.audit_logs
for each row execute function pg_temp.fail_ai_plan_stage('audit');

select ok(
  not has_function_privilege(
    'anon',
    'public.replace_ai_project_plan(uuid,uuid,jsonb,text,text,jsonb,text)',
    'EXECUTE'
  ),
  'anonymous callers cannot execute the plan replacement RPC'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.replace_ai_project_plan(uuid,uuid,jsonb,text,text,jsonb,text)',
    'EXECUTE'
  ),
  'authenticated callers can reach the authorization-checked RPC'
);

select ok(
  has_function_privilege(
    'service_role',
    'public.replace_ai_project_plan(uuid,uuid,jsonb,text,text,jsonb,text)',
    'EXECUTE'
  ),
  'the current local role graph exposes the RPC to service_role; caller identity checks still apply'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '', true);

select throws_ok(
  $$
    select pg_temp.replace_plan(
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      '22222222-2222-4222-8222-222222222222',
      'Unauthenticated task',
      repeat('1', 64)
    )
  $$,
  'P0001',
  'Authentication required',
  'an authenticated database role without a user identity is rejected'
);

select set_config(
  'request.jwt.claim.sub',
  '66666666-6666-4666-8666-666666666666',
  true
);
select throws_ok(
  $$
    select pg_temp.replace_plan(
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000002',
      '22222222-2222-4222-8222-222222222222',
      'Outsider task',
      repeat('2', 64)
    )
  $$,
  'P0001',
  'Only the project owner can replace the AI plan',
  'a non-member cannot replace a project plan'
);

select set_config(
  'request.jwt.claim.sub',
  '44444444-4444-4444-8444-444444444444',
  true
);
select throws_ok(
  $$
    select pg_temp.replace_plan(
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000003',
      '22222222-2222-4222-8222-222222222222',
      'Other project member task',
      repeat('3', 64)
    )
  $$,
  'P0001',
  'Only the project owner can replace the AI plan',
  'a member of another project cannot replace this plan'
);

select set_config(
  'request.jwt.claim.sub',
  '22222222-2222-4222-8222-222222222222',
  true
);
select throws_ok(
  $$
    select pg_temp.replace_plan(
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000004',
      '22222222-2222-4222-8222-222222222222',
      'Regular member task',
      repeat('4', 64)
    )
  $$,
  'P0001',
  'Only the project owner can replace the AI plan',
  'a regular project member cannot replace the plan'
);

select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);
select lives_ok(
  $$
    select pg_temp.replace_plan(
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000005',
      '11111111-1111-4111-8111-111111111111',
      'Authorized owner task',
      repeat('5', 64)
    )
  $$,
  'the project owner can replace a draft project plan'
);

select is(
  (
    select title
    from public.tasks
    where project_id = '10000000-0000-4000-8000-000000000001'
      and ai_generated
  ),
  'Authorized owner task',
  'the owner replacement becomes the only generated task'
);

select is(
  (
    select count(*)::integer
    from public.tasks
    where id = '20000000-0000-4000-8000-000000000002'
      and not ai_generated
  ),
  1,
  'a manual task survives a successful plan replacement'
);

select is(
  (
    select count(*)::integer
    from public.tasks
    where id = '20000000-0000-4000-8000-000000000003'
      and project_id = '10000000-0000-4000-8000-000000000004'
  ),
  1,
  'a successful replacement does not change another project'
);

select throws_ok(
  $$
    select pg_temp.replace_plan(
      '10000000-0000-4000-8000-000000000002',
      '40000000-0000-4000-8000-000000000006',
      '11111111-1111-4111-8111-111111111111',
      'Active project task',
      repeat('6', 64)
    )
  $$,
  'P0001',
  'Only draft projects can replace the AI plan',
  'an active project plan cannot be destructively replaced'
);

select throws_ok(
  $$
    select pg_temp.replace_plan(
      '10000000-0000-4000-8000-000000000003',
      '40000000-0000-4000-8000-000000000007',
      '11111111-1111-4111-8111-111111111111',
      'Completed project task',
      repeat('7', 64)
    )
  $$,
  'P0001',
  'Only draft projects can replace the AI plan',
  'a completed project plan cannot be destructively replaced'
);

select lives_ok(
  $$
    select pg_temp.replace_plan(
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000008',
      '22222222-2222-4222-8222-222222222222',
      'Allowed project member task',
      repeat('8', 64)
    )
  $$,
  'an assignee from this exact project is allowed'
);

select is(
  (
    select assignment.user_id
    from public.task_assignments as assignment
    join public.tasks as task on task.id = assignment.task_id
    where task.project_id = '10000000-0000-4000-8000-000000000001'
      and task.ai_generated
  ),
  '22222222-2222-4222-8222-222222222222'::uuid,
  'the generated assignment targets the validated project member'
);

select throws_ok(
  $$
    select pg_temp.replace_plan(
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000009',
      '33333333-3333-4333-8333-333333333333',
      'Team-only assignee task',
      repeat('9', 64)
    )
  $$,
  'P0001',
  'Every AI task assignee must belong to this project',
  'a team member outside the project cannot be assigned'
);

select is(
  (
    select title
    from public.tasks
    where project_id = '10000000-0000-4000-8000-000000000001'
      and ai_generated
  ),
  'Allowed project member task',
  'a team-only assignee failure leaves the old plan unchanged'
);

select throws_ok(
  $$
    select pg_temp.replace_plan(
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-00000000000a',
      '44444444-4444-4444-8444-444444444444',
      'Other-project assignee task',
      repeat('a', 64)
    )
  $$,
  'P0001',
  'Every AI task assignee must belong to this project',
  'a user included only in another project cannot be assigned'
);

select is(
  (
    select title
    from public.tasks
    where project_id = '10000000-0000-4000-8000-000000000001'
      and ai_generated
  ),
  'Allowed project member task',
  'an other-project assignee failure leaves the old plan unchanged'
);

select throws_ok(
  $$
    select pg_temp.replace_plan(
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-00000000000b',
      '77777777-7777-4777-8777-777777777777',
      'Missing assignee task',
      repeat('b', 64)
    )
  $$,
  'P0001',
  'Every AI task assignee must belong to this project',
  'a nonexistent assignee cannot be assigned'
);

select is(
  (
    select title
    from public.tasks
    where project_id = '10000000-0000-4000-8000-000000000001'
      and ai_generated
  ),
  'Allowed project member task',
  'a nonexistent assignee failure leaves the old plan unchanged'
);

select is(
  (
    pg_temp.replace_plan(
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000008',
      '22222222-2222-4222-8222-222222222222',
      'Allowed project member task',
      repeat('8', 64)
    ) ->> 'replayed'
  )::boolean,
  true,
  'an exact retry returns the stored result as a replay'
);

select is(
  (
    select count(*)::integer
    from public.ai_reports
    where project_id = '10000000-0000-4000-8000-000000000001'
      and type = 'plan'
  ),
  3,
  'an exact retry does not duplicate the AI report'
);

select is(
  (
    select count(*)::integer
    from public.tasks
    where project_id = '10000000-0000-4000-8000-000000000001'
      and ai_generated
  ),
  1,
  'an exact retry does not duplicate generated tasks'
);

select is(
  (
    select count(*)::integer
    from public.task_assignments as assignment
    join public.tasks as task on task.id = assignment.task_id
    where task.project_id = '10000000-0000-4000-8000-000000000001'
      and task.ai_generated
  ),
  1,
  'an exact retry does not duplicate generated assignments'
);

select is(
  (
    select count(*)::integer
    from public.audit_logs
    where project_id = '10000000-0000-4000-8000-000000000001'
      and action = 'ai_plan_generated'
  ),
  2,
  'an exact retry does not duplicate the audit entry'
);

select throws_ok(
  $$
    select pg_temp.replace_plan(
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000008',
      '22222222-2222-4222-8222-222222222222',
      'Different retry task',
      repeat('c', 64)
    )
  $$,
  'P0001',
  'Idempotency key was already used with different plan data',
  'the same idempotency key with another payload is rejected'
);

select is(
  (
    select title
    from public.tasks
    where project_id = '10000000-0000-4000-8000-000000000001'
      and ai_generated
  ),
  'Allowed project member task',
  'an idempotency conflict does not alter the saved plan'
);

select set_config('commitbet.test_ai_plan_failure', 'report', true);
select throws_ok(
  $$
    select pg_temp.replace_plan(
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-00000000000c',
      '22222222-2222-4222-8222-222222222222',
      'Report failure task',
      repeat('d', 64)
    )
  $$,
  'P0001',
  'Injected report failure',
  'a report insert failure aborts replacement'
);
select set_config('commitbet.test_ai_plan_failure', '', true);
select is(
  (select count(*)::integer from public.ai_reports
   where project_id = '10000000-0000-4000-8000-000000000001'
     and type = 'plan'),
  3,
  'a report failure leaves existing reports unchanged'
);
select is(
  (select title from public.tasks
   where project_id = '10000000-0000-4000-8000-000000000001'
     and ai_generated),
  'Allowed project member task',
  'a report failure preserves the old generated plan'
);
select is(
  (select count(*)::integer from public.tasks
   where project_id = '10000000-0000-4000-8000-000000000001'),
  2,
  'a report failure leaves task counts unchanged'
);
select is(
  (select count(*)::integer from public.task_assignments as assignment
   join public.tasks as task on task.id = assignment.task_id
   where task.project_id = '10000000-0000-4000-8000-000000000001'),
  2,
  'a report failure leaves assignments unchanged'
);
select is(
  (select count(*)::integer from public.audit_logs
   where project_id = '10000000-0000-4000-8000-000000000001'
     and action = 'ai_plan_generated'),
  2,
  'a report failure leaves audit entries unchanged'
);

select set_config('commitbet.test_ai_plan_failure', 'task', true);
select throws_ok(
  $$
    select pg_temp.replace_plan(
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-00000000000d',
      '22222222-2222-4222-8222-222222222222',
      'Task failure task',
      repeat('e', 64)
    )
  $$,
  'P0001',
  'Injected task failure',
  'a task insert failure aborts replacement'
);
select set_config('commitbet.test_ai_plan_failure', '', true);
select is(
  (select count(*)::integer from public.ai_reports
   where project_id = '10000000-0000-4000-8000-000000000001'
     and type = 'plan'),
  3,
  'a task failure rolls back the inserted report'
);
select is(
  (select title from public.tasks
   where project_id = '10000000-0000-4000-8000-000000000001'
     and ai_generated),
  'Allowed project member task',
  'a task failure preserves the old generated plan'
);
select is(
  (select count(*)::integer from public.tasks
   where project_id = '10000000-0000-4000-8000-000000000001'),
  2,
  'a task failure leaves task counts unchanged'
);
select is(
  (select count(*)::integer from public.task_assignments as assignment
   join public.tasks as task on task.id = assignment.task_id
   where task.project_id = '10000000-0000-4000-8000-000000000001'),
  2,
  'a task failure leaves assignments unchanged'
);
select is(
  (select count(*)::integer from public.audit_logs
   where project_id = '10000000-0000-4000-8000-000000000001'
     and action = 'ai_plan_generated'),
  2,
  'a task failure leaves audit entries unchanged'
);

select set_config('commitbet.test_ai_plan_failure', 'assignment', true);
select throws_ok(
  $$
    select pg_temp.replace_plan(
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-00000000000e',
      '22222222-2222-4222-8222-222222222222',
      'Assignment failure task',
      repeat('f', 64)
    )
  $$,
  'P0001',
  'Injected assignment failure',
  'an assignment insert failure aborts replacement'
);
select set_config('commitbet.test_ai_plan_failure', '', true);
select is(
  (select count(*)::integer from public.ai_reports
   where project_id = '10000000-0000-4000-8000-000000000001'
     and type = 'plan'),
  3,
  'an assignment failure rolls back the inserted report'
);
select is(
  (select title from public.tasks
   where project_id = '10000000-0000-4000-8000-000000000001'
     and ai_generated),
  'Allowed project member task',
  'an assignment failure preserves the old generated plan'
);
select is(
  (select count(*)::integer from public.tasks
   where project_id = '10000000-0000-4000-8000-000000000001'),
  2,
  'an assignment failure rolls back the inserted task'
);
select is(
  (select count(*)::integer from public.task_assignments as assignment
   join public.tasks as task on task.id = assignment.task_id
   where task.project_id = '10000000-0000-4000-8000-000000000001'),
  2,
  'an assignment failure leaves assignments unchanged'
);
select is(
  (select count(*)::integer from public.audit_logs
   where project_id = '10000000-0000-4000-8000-000000000001'
     and action = 'ai_plan_generated'),
  2,
  'an assignment failure leaves audit entries unchanged'
);

select set_config('commitbet.test_ai_plan_failure', 'audit', true);
select throws_ok(
  $$
    select pg_temp.replace_plan(
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-00000000000f',
      '22222222-2222-4222-8222-222222222222',
      'Audit failure task',
      repeat('0', 64)
    )
  $$,
  'P0001',
  'Injected audit failure',
  'an audit insert failure aborts replacement'
);
select set_config('commitbet.test_ai_plan_failure', '', true);
select is(
  (select count(*)::integer from public.ai_reports
   where project_id = '10000000-0000-4000-8000-000000000001'
     and type = 'plan'),
  3,
  'an audit failure rolls back the inserted report'
);
select is(
  (select title from public.tasks
   where project_id = '10000000-0000-4000-8000-000000000001'
     and ai_generated),
  'Allowed project member task',
  'an audit failure preserves the old generated plan'
);
select is(
  (select count(*)::integer from public.tasks
   where project_id = '10000000-0000-4000-8000-000000000001'),
  2,
  'an audit failure rolls back the inserted task'
);
select is(
  (select count(*)::integer from public.task_assignments as assignment
   join public.tasks as task on task.id = assignment.task_id
   where task.project_id = '10000000-0000-4000-8000-000000000001'),
  2,
  'an audit failure rolls back the inserted assignment'
);
select is(
  (select count(*)::integer from public.audit_logs
   where project_id = '10000000-0000-4000-8000-000000000001'
     and action = 'ai_plan_generated'),
  2,
  'an audit failure leaves audit entries unchanged'
);

select throws_ok(
  $$
    select public.replace_ai_project_plan(
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000010',
      jsonb_build_object(
        'phases', '[]'::jsonb,
        'deliverables', '[]'::jsonb,
        'tasks', '[]'::jsonb,
        'risks', '[]'::jsonb,
        'minimum_success_version', 'Minimum',
        'ambitious_success_version', 'Ambitious'
      ),
      'mock',
      'mock-test-v1',
      '{"test":true}',
      repeat('1', 64)
    )
  $$,
  'P0001',
  'AI plan must contain between 1 and 50 tasks',
  'an invalid empty plan is rejected before persistence'
);

select is(
  (select title from public.tasks
   where project_id = '10000000-0000-4000-8000-000000000001'
     and ai_generated),
  'Allowed project member task',
  'an invalid payload leaves the old plan unchanged'
);

select throws_ok(
  $$
    select pg_temp.replace_plan(
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000011',
      '33333333-3333-4333-8333-333333333333',
      'Foreign assignee atomicity task',
      repeat('2', 64)
    )
  $$,
  'P0001',
  'Every AI task assignee must belong to this project',
  'a foreign assignee is rejected before persistence'
);

select is(
  (select title from public.tasks
   where project_id = '10000000-0000-4000-8000-000000000001'
     and ai_generated),
  'Allowed project member task',
  'a foreign assignee leaves the old plan unchanged'
);

reset role;
select is(
  (
    select count(*)::integer
    from private.ai_plan_replacement_requests
    where project_id = '10000000-0000-4000-8000-000000000001'
  ),
  2,
  'failed replacements leave no idempotency records'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);

select throws_ok(
  $$
    insert into public.ai_reports (
      project_id,
      type,
      input_snapshot,
      output,
      provider,
      model
    )
    values (
      '10000000-0000-4000-8000-000000000001',
      'plan',
      '{}',
      '{}',
      'mock',
      'bypass'
    )
  $$,
  '42501',
  'permission denied for table ai_reports',
  'an authenticated owner cannot insert a plan report directly'
);

select throws_ok(
  $$
    insert into public.tasks (
      project_id,
      title,
      due_date,
      ai_generated
    )
    values (
      '10000000-0000-4000-8000-000000000001',
      'Generated bypass task',
      '2026-08-02',
      true
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "tasks"',
  'an authenticated owner cannot insert generated tasks directly'
);

select throws_ok(
  $$
    insert into public.task_assignments (task_id, user_id)
    select
      task.id,
      '11111111-1111-4111-8111-111111111111'
    from public.tasks as task
    where task.project_id = '10000000-0000-4000-8000-000000000001'
      and task.ai_generated
  $$,
  '42501',
  'new row violates row-level security policy for table "task_assignments"',
  'an authenticated owner cannot write generated assignments directly'
);

select throws_ok(
  $$
    insert into public.audit_logs (project_id, user_id, action)
    values (
      '10000000-0000-4000-8000-000000000001',
      '11111111-1111-4111-8111-111111111111',
      'ai_plan_generated'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "audit_logs"',
  'an authenticated owner cannot forge the plan audit directly'
);

reset role;
select lives_ok(
  $$
    insert into public.evidence (
      task_id,
      user_id,
      type,
      description
    )
    select
      task.id,
      '22222222-2222-4222-8222-222222222222',
      'demo',
      'Legacy activity that must not be cascaded'
    from public.tasks as task
    where task.project_id = '10000000-0000-4000-8000-000000000001'
      and task.ai_generated
  $$,
  'test setup adds activity to the current generated plan'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);
select throws_ok(
  $$
    select pg_temp.replace_plan(
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000012',
      '22222222-2222-4222-8222-222222222222',
      'Unsafe cascade task',
      repeat('3', 64)
    )
  $$,
  'P0001',
  'AI plan cannot be replaced after generated task activity exists',
  'regeneration refuses to cascade-delete generated task history'
);

select is(
  (
    select count(*)::integer
    from public.tasks
    where project_id = '10000000-0000-4000-8000-000000000001'
      and ai_generated
      and title = 'Allowed project member task'
  ),
  1,
  'the generated task with activity remains intact'
);

select is(
  (
    select count(*)::integer
    from public.evidence as evidence
    join public.tasks as task on task.id = evidence.task_id
    where task.project_id = '10000000-0000-4000-8000-000000000001'
  ),
  1,
  'generated task evidence remains intact'
);

select is(
  (
    select count(*)::integer
    from public.tasks
    where id = '20000000-0000-4000-8000-000000000002'
      and not ai_generated
  ),
  1,
  'the manual task still remains after every replacement attempt'
);

select is(
  (
    select count(*)::integer
    from public.tasks
    where id = '20000000-0000-4000-8000-000000000003'
      and project_id = '10000000-0000-4000-8000-000000000004'
  ),
  1,
  'the other project remains isolated after every replacement attempt'
);

select * from finish();
rollback;
