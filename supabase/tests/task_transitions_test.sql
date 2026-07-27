begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(39);

insert into auth.users (id, email)
values
  ('11111111-1111-4111-8111-111111111111', 'owner@task-transitions.test'),
  ('22222222-2222-4222-8222-222222222222', 'assignee@task-transitions.test'),
  ('33333333-3333-4333-8333-333333333333', 'reviewer@task-transitions.test'),
  ('44444444-4444-4444-8444-444444444444', 'outsider@task-transitions.test');

insert into public.teams (id, name, owner_id, invite_code)
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Task transition test team',
  '11111111-1111-4111-8111-111111111111',
  'TASKTEST'
);

insert into public.team_members (team_id, user_id, role)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'owner'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '22222222-2222-4222-8222-222222222222', 'member'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '33333333-3333-4333-8333-333333333333', 'member');

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
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Active transition project',
    'Verify task transitions',
    '2026-07-20',
    '2026-08-02',
    'active',
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Draft transition project',
    'Verify draft edits',
    '2026-07-20',
    '2026-08-02',
    'draft',
    '11111111-1111-4111-8111-111111111111'
  );

insert into public.project_member_profiles (
  project_id,
  user_id,
  availability_minutes_per_day
)
values
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '11111111-1111-4111-8111-111111111111', 60),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '22222222-2222-4222-8222-222222222222', 60),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '33333333-3333-4333-8333-333333333333', 60),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '11111111-1111-4111-8111-111111111111', 60),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '22222222-2222-4222-8222-222222222222', 60),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '33333333-3333-4333-8333-333333333333', 60);

insert into public.tasks (
  id,
  project_id,
  title,
  due_date,
  status
)
values
  (
    'dddddddd-1111-4111-8111-dddddddddddd',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Assignee workflow task',
    '2026-07-28',
    'todo'
  ),
  (
    'dddddddd-2222-4222-8222-dddddddddddd',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Other assignee task',
    '2026-07-28',
    'todo'
  ),
  (
    'dddddddd-3333-4333-8333-dddddddddddd',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Disputed task',
    '2026-07-28',
    'rejected'
  ),
  (
    'dddddddd-4444-4444-8444-dddddddddddd',
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'Draft task',
    '2026-07-28',
    'todo'
  );

insert into public.task_assignments (task_id, user_id, assigned_reason)
values
  ('dddddddd-1111-4111-8111-dddddddddddd', '22222222-2222-4222-8222-222222222222', 'Assignee test'),
  ('dddddddd-2222-4222-8222-dddddddddddd', '11111111-1111-4111-8111-111111111111', 'Owner test'),
  ('dddddddd-3333-4333-8333-dddddddddddd', '22222222-2222-4222-8222-222222222222', 'Dispute test'),
  ('dddddddd-4444-4444-8444-dddddddddddd', '22222222-2222-4222-8222-222222222222', 'Draft test');

insert into public.disputes (
  id,
  task_id,
  opened_by,
  reason,
  performer_explanation,
  reviewer_rejection_reason
)
values (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'dddddddd-3333-4333-8333-dddddddddddd',
  '22222222-2222-4222-8222-222222222222',
  'Evidence was overlooked',
  'The proof covers the task',
  'The proof was incomplete'
);

select ok(
  not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tasks'
      and cmd in ('UPDATE', 'ALL')
  ),
  'tasks has no direct authenticated UPDATE policy'
);

select ok(
  not has_table_privilege('authenticated', 'public.tasks', 'UPDATE'),
  'authenticated cannot update tasks directly'
);

select ok(
  not has_function_privilege('anon', 'public.start_task(uuid)', 'EXECUTE'),
  'anonymous callers cannot execute task transitions'
);

select ok(
  has_function_privilege('authenticated', 'public.start_task(uuid)', 'EXECUTE'),
  'authenticated callers can execute the scoped transition function'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

select throws_ok(
  $$update public.tasks set status = 'approved' where id = 'dddddddd-1111-4111-8111-dddddddddddd'$$,
  '42501',
  'permission denied for table tasks',
  'even the project owner cannot bypass transitions with direct UPDATE'
);

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);

select lives_ok(
  $$select public.start_task('dddddddd-1111-4111-8111-dddddddddddd')$$,
  'the assignee can start a todo task'
);

select is(
  (select status from public.tasks where id = 'dddddddd-1111-4111-8111-dddddddddddd'),
  'in_progress',
  'start_task moves todo to in_progress'
);

select throws_ok(
  $$select public.start_task('dddddddd-1111-4111-8111-dddddddddddd')$$,
  'P0001',
  'Task must be todo before it can be started',
  'start_task rejects an invalid previous state'
);

select throws_ok(
  $$select public.start_task('dddddddd-2222-4222-8222-dddddddddddd')$$,
  'P0001',
  'Only the task assignee can start this task',
  'a project member cannot start another member task'
);

select throws_ok(
  $$select public.submit_task('dddddddd-1111-4111-8111-dddddddddddd')$$,
  'P0001',
  'Add at least one evidence item before submitting',
  'submit_task requires evidence'
);

reset role;
insert into public.evidence (task_id, user_id, type, url, description)
values (
  'dddddddd-1111-4111-8111-dddddddddddd',
  '22222222-2222-4222-8222-222222222222',
  'link',
  'https://example.test/proof',
  'Transition test proof'
);
set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);

select lives_ok(
  $$select public.submit_task('dddddddd-1111-4111-8111-dddddddddddd')$$,
  'the assignee can submit an in-progress task with evidence'
);

select is(
  (select status from public.tasks where id = 'dddddddd-1111-4111-8111-dddddddddddd'),
  'submitted',
  'submit_task moves in_progress to submitted'
);

select throws_ok(
  $$select public.review_submitted_task('dddddddd-1111-4111-8111-dddddddddddd', 'approved', '')$$,
  'P0001',
  'Assignees cannot review their own task',
  'an assignee cannot approve their own task'
);

select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);

select throws_ok(
  $$select public.review_submitted_task('dddddddd-1111-4111-8111-dddddddddddd', 'disputed', 'Invalid target')$$,
  'P0001',
  'Invalid review status',
  'review rejects a reviewer-controlled invalid next state'
);

select lives_ok(
  $$select public.review_submitted_task('dddddddd-1111-4111-8111-dddddddddddd', 'needs_changes', 'Add the missing screenshot')$$,
  'a different project member can request changes'
);

select is(
  (select status from public.tasks where id = 'dddddddd-1111-4111-8111-dddddddddddd'),
  'needs_changes',
  'review moves submitted to needs_changes'
);

select is(
  (select count(*)::integer from public.reviews where task_id = 'dddddddd-1111-4111-8111-dddddddddddd'),
  1,
  'review and transition are committed together'
);

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);

select lives_ok(
  $$select public.submit_task('dddddddd-1111-4111-8111-dddddddddddd')$$,
  'the assignee can resubmit a task that needs changes'
);

select is(
  (select status from public.tasks where id = 'dddddddd-1111-4111-8111-dddddddddddd'),
  'submitted',
  'resubmission returns the task to submitted'
);

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

select lives_ok(
  $$select public.review_submitted_task('dddddddd-1111-4111-8111-dddddddddddd', 'approved', '')$$,
  'a non-assignee project owner can approve submitted work'
);

select is(
  (select status from public.tasks where id = 'dddddddd-1111-4111-8111-dddddddddddd'),
  'approved',
  'review approval moves submitted to approved'
);

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);

select throws_ok(
  $$select public.reopen_task_after_changes('dddddddd-1111-4111-8111-dddddddddddd')$$,
  'P0001',
  'Only tasks needing changes or rejected tasks can be reopened',
  'an approved task cannot be reopened by its assignee'
);

reset role;
select lives_ok(
  $$
    select public.attach_dispute_recommendation_server(
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
      '22222222-2222-4222-8222-222222222222',
      '{
        "recommended_resolution": "needs_changes",
        "missing_information": [],
        "arguments_for_approval": ["Evidence was supplied"],
        "arguments_for_rejection": ["Reviewer found a gap"]
      }'::jsonb
    )
  $$,
  'the server-controlled AI path can attach a validated recommendation'
);

select is(
  (select status from public.tasks where id = 'dddddddd-3333-4333-8333-dddddddddddd'),
  'disputed',
  'attaching the recommendation transitions rejected to disputed'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444444', true);

select throws_ok(
  $$select public.resolve_project_dispute('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'approve')$$,
  'P0001',
  'Not a project member',
  'an outsider cannot resolve a project dispute'
);

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

select throws_ok(
  $$select public.resolve_project_dispute('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'partial_credit')$$,
  'P0001',
  'Invalid dispute resolution',
  'invalid dispute resolutions are rejected before writes'
);

select is(
  (select status from public.disputes where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'),
  'open',
  'a failed dispute resolution leaves the dispute open'
);

select is(
  (select status from public.tasks where id = 'dddddddd-3333-4333-8333-dddddddddddd'),
  'disputed',
  'a failed dispute resolution leaves the task disputed'
);

select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);

select throws_ok(
  $$select public.resolve_project_dispute('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'approve')$$,
  'P0001',
  'Only the project owner can resolve this dispute',
  'a non-owner project member cannot resolve a dispute'
);

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

select lives_ok(
  $$select public.resolve_project_dispute('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'needs_changes')$$,
  'the project owner can resolve an open dispute'
);

select is(
  (select status from public.disputes where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'),
  'resolved',
  'resolution updates the dispute status'
);

select is(
  (select status from public.tasks where id = 'dddddddd-3333-4333-8333-dddddddddddd'),
  'needs_changes',
  'resolution updates the related task consistently'
);

select is(
  (
    select count(*)::integer
    from public.audit_logs
    where action = 'dispute_resolved'
      and details->>'dispute_id' = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
  ),
  1,
  'resolution writes one audit event in the same transaction'
);

select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);

select throws_ok(
  $$
    select public.update_draft_task(
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      'dddddddd-4444-4444-8444-dddddddddddd',
      'Unauthorized edit',
      '2026-07-29',
      'high',
      '33333333-3333-4333-8333-333333333333'
    )
  $$,
  'P0001',
  'Only the project owner can edit draft tasks',
  'a project member cannot edit owner-controlled draft task metadata'
);

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

select lives_ok(
  $$
    select public.update_draft_task(
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      'dddddddd-4444-4444-8444-dddddddddddd',
      'Owner edited draft task',
      '2026-07-29',
      'high',
      '33333333-3333-4333-8333-333333333333'
    )
  $$,
  'the project owner can edit a todo task in a draft project'
);

select is(
  (select title from public.tasks where id = 'dddddddd-4444-4444-8444-dddddddddddd'),
  'Owner edited draft task',
  'draft task metadata is updated'
);

select is(
  (select user_id from public.task_assignments where task_id = 'dddddddd-4444-4444-8444-dddddddddddd'),
  '33333333-3333-4333-8333-333333333333'::uuid,
  'draft reassignment is restricted to a project member'
);

select throws_ok(
  $$
    select public.update_draft_task(
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'dddddddd-1111-4111-8111-dddddddddddd',
      'Late unsafe edit',
      '2026-07-29',
      'high',
      '33333333-3333-4333-8333-333333333333'
    )
  $$,
  'P0001',
  'Only todo tasks in draft projects can be edited',
  'active project task metadata cannot use the draft edit path'
);

select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);

select throws_ok(
  $$select public.review_submitted_task('dddddddd-1111-4111-8111-dddddddddddd', 'rejected', 'Too late')$$,
  'P0001',
  'Task is not submitted',
  'review cannot transition an already approved task'
);

select * from finish();
rollback;
