begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(9);

insert into auth.users (id, email)
values
  ('55555555-5555-4555-8555-555555555555', 'owner@final-report.test'),
  ('66666666-6666-4666-8666-666666666666', 'member@final-report.test'),
  ('77777777-7777-4777-8777-777777777777', 'outsider@final-report.test');

insert into public.teams (id, name, owner_id, invite_code)
values (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'Final report authorization team',
  '55555555-5555-4555-8555-555555555555',
  'FINALAUTH'
);

insert into public.team_members (team_id, user_id, role)
values
  (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    '55555555-5555-4555-8555-555555555555',
    'owner'
  ),
  (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    '66666666-6666-4666-8666-666666666666',
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
  'ffffffff-ffff-4fff-8fff-ffffffffffff',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'Protected final report project',
  'Verify final report authorization',
  '2026-07-20',
  '2026-08-02',
  'active',
  '55555555-5555-4555-8555-555555555555'
);

insert into public.project_member_profiles (
  project_id,
  user_id,
  availability_minutes_per_day
)
values
  (
    'ffffffff-ffff-4fff-8fff-ffffffffffff',
    '55555555-5555-4555-8555-555555555555',
    60
  ),
  (
    'ffffffff-ffff-4fff-8fff-ffffffffffff',
    '66666666-6666-4666-8666-666666666666',
    60
  );

insert into public.pledges (project_id, user_id, amount, currency)
values (
  'ffffffff-ffff-4fff-8fff-ffffffffffff',
  '66666666-6666-4666-8666-666666666666',
  20,
  'POINTS'
);

insert into public.ai_reports (
  project_id,
  type,
  input_snapshot,
  output,
  model
)
values (
  'ffffffff-ffff-4fff-8fff-ffffffffffff',
  'final',
  '{"project":{"id":"ffffffff-ffff-4fff-8fff-ffffffffffff"}}',
  '{"human_confirmation_required":true}',
  'mock-v1'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '66666666-6666-4666-8666-666666666666',
  true
);

select is(
  (
    select count(*)::integer
    from public.projects
    where id = 'ffffffff-ffff-4fff-8fff-ffffffffffff'
  ),
  1,
  'a project member can retrieve the protected project'
);

select is(
  (
    select count(*)::integer
    from public.ai_reports
    where project_id = 'ffffffff-ffff-4fff-8fff-ffffffffffff'
      and type = 'final'
  ),
  1,
  'a project member can retrieve protected final report data'
);

select throws_ok(
  $$
    insert into public.ai_reports (
      project_id,
      type,
      input_snapshot,
      output,
      model
    )
    values (
      'ffffffff-ffff-4fff-8fff-ffffffffffff',
      'final',
      '{}',
      '{}',
      'mock-v1'
    )
  $$,
  '42501',
  'permission denied for table ai_reports',
  'a regular project member cannot generate an owner-only final report'
);

select throws_ok(
  $$
    insert into public.final_decisions (
      project_id,
      ai_recommendation,
      confirmed_by,
      final_action
    )
    values (
      'ffffffff-ffff-4fff-8fff-ffffffffffff',
      '{}',
      '66666666-6666-4666-8666-666666666666',
      '{}'
    )
  $$,
  '42501',
  'permission denied for table final_decisions',
  'a regular project member cannot bypass the owner-only finalization RPC'
);

select set_config(
  'request.jwt.claim.sub',
  '77777777-7777-4777-8777-777777777777',
  true
);

select is(
  (
    select count(*)::integer
    from public.projects
    where id = 'ffffffff-ffff-4fff-8fff-ffffffffffff'
  ),
  0,
  'a non-member cannot retrieve the protected project'
);

select is(
  (
    select count(*)::integer
    from public.ai_reports
    where project_id = 'ffffffff-ffff-4fff-8fff-ffffffffffff'
  ),
  0,
  'a non-member cannot retrieve protected final report data'
);

select is(
  (
    select count(*)::integer
    from public.pledges
    where project_id = 'ffffffff-ffff-4fff-8fff-ffffffffffff'
  ),
  0,
  'a non-member cannot retrieve protected final pledge data'
);

select throws_ok(
  $$
    insert into public.ai_reports (
      project_id,
      type,
      input_snapshot,
      output,
      model
    )
    values (
      'ffffffff-ffff-4fff-8fff-ffffffffffff',
      'final',
      '{}',
      '{}',
      'mock-v1'
    )
  $$,
  '42501',
  'permission denied for table ai_reports',
  'a non-member cannot generate a final report'
);

select is(
  (
    select count(*)::integer
    from public.projects
    where id = '88888888-8888-4888-8888-888888888888'
  ),
  0,
  'a missing project returns no protected data'
);

select * from finish();
rollback;
