begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

insert into auth.users (id, email)
values
  ('a1111111-1111-4111-8111-111111111111', 'owner@finalization.test'),
  ('a2222222-2222-4222-8222-222222222222', 'member@finalization.test'),
  ('a3333333-3333-4333-8333-333333333333', 'outsider@finalization.test'),
  ('a4444444-4444-4444-8444-444444444444', 'other-owner@finalization.test');

insert into public.teams (id, name, owner_id, invite_code)
values
  (
    'aaaaaaaa-0000-4000-8000-000000000001',
    'Atomic finalization team',
    'a1111111-1111-4111-8111-111111111111',
    'FINAL001'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000001',
    'Foreign finalization team',
    'a4444444-4444-4444-8444-444444444444',
    'FINAL002'
  );

insert into public.team_members (team_id, user_id, role)
values
  (
    'aaaaaaaa-0000-4000-8000-000000000001',
    'a1111111-1111-4111-8111-111111111111',
    'owner'
  ),
  (
    'aaaaaaaa-0000-4000-8000-000000000001',
    'a2222222-2222-4222-8222-222222222222',
    'member'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000001',
    'a4444444-4444-4444-8444-444444444444',
    'owner'
  );

create function pg_temp.valid_final_report(project_members pg_catalog.uuid[])
returns pg_catalog.jsonb
language sql
immutable
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'project_summary', 'Saved project-scoped final recommendation.',
    'pledge_recommendation',
    coalesce(
      (
        select pg_catalog.jsonb_agg(
          pg_catalog.jsonb_build_object(
            'user_id',
            member.user_id,
            'pledge_return_percentage',
            100,
            'reason',
            'Saved recommendation for this project member.'
          )
          order by member.user_id
        )
        from pg_catalog.unnest(project_members) as member(user_id)
      ),
      '[]'::pg_catalog.jsonb
    ),
    'human_confirmation_required', true
  );
$$;

create function pg_temp.seed_finalizable_project(
  seeded_project_id pg_catalog.uuid,
  seeded_report_id pg_catalog.uuid,
  seeded_team_id pg_catalog.uuid,
  seeded_owner_id pg_catalog.uuid,
  seeded_member_ids pg_catalog.uuid[],
  seeded_status pg_catalog.text default 'active',
  seeded_report_type pg_catalog.text default 'final',
  seeded_report_output pg_catalog.jsonb default null
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  seeded_member_id pg_catalog.uuid;
begin
  insert into public.projects (
    id,
    team_id,
    title,
    description,
    goal,
    start_date,
    end_date,
    status,
    created_by
  )
  values (
    seeded_project_id,
    seeded_team_id,
    pg_catalog.format('Finalization fixture %s', seeded_project_id),
    'Atomic finalization fixture.',
    'Prove the project finalizes all or nothing.',
    current_date - 30,
    current_date + 30,
    seeded_status,
    seeded_owner_id
  );

  foreach seeded_member_id in array seeded_member_ids
  loop
    insert into public.project_member_profiles (
      project_id,
      user_id,
      availability_minutes_per_day
    )
    values (seeded_project_id, seeded_member_id, 60);

    insert into public.pledges (
      project_id,
      user_id,
      amount,
      currency,
      status
    )
    values (seeded_project_id, seeded_member_id, 20, 'POINTS', 'declared');
  end loop;

  if seeded_report_id is not null then
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
      seeded_report_id,
      seeded_project_id,
      seeded_report_type,
      pg_catalog.jsonb_build_object(
        'project',
        pg_catalog.jsonb_build_object('id', seeded_project_id)
      ),
      coalesce(
        seeded_report_output,
        pg_temp.valid_final_report(seeded_member_ids)
      ),
      'mock-finalization-v1',
      'mock'
    );
  end if;
end;
$$;

create function pg_temp.final_action(
  seeded_project_id pg_catalog.uuid,
  return_percentage pg_catalog.numeric default 100
)
returns pg_catalog.jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'user_id',
        member.user_id,
        'return_percentage',
        return_percentage
      )
      order by member.user_id
    ),
    '[]'::pg_catalog.jsonb
  )
  from public.project_member_profiles as member
  where member.project_id = seeded_project_id;
$$;

create function pg_temp.no_finalization_request(
  checked_project_id pg_catalog.uuid
)
returns pg_catalog.bool
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1
    from private.project_finalization_requests as request
    where request.project_id = checked_project_id
  );
$$;

do $fixtures$
declare
  local_team pg_catalog.uuid :=
    'aaaaaaaa-0000-4000-8000-000000000001';
  foreign_team pg_catalog.uuid :=
    'bbbbbbbb-0000-4000-8000-000000000001';
  local_owner pg_catalog.uuid :=
    'a1111111-1111-4111-8111-111111111111';
  local_member pg_catalog.uuid :=
    'a2222222-2222-4222-8222-222222222222';
  foreign_owner pg_catalog.uuid :=
    'a4444444-4444-4444-8444-444444444444';
  local_members pg_catalog.uuid[] := array[local_owner, local_member];
  fixture_number pg_catalog.int4;
begin
  perform pg_temp.seed_finalizable_project(
    'f1000000-0000-4000-8000-000000000001',
    'f2000000-0000-4000-8000-000000000001',
    local_team, local_owner, local_members
  );
  perform pg_temp.seed_finalizable_project(
    'f1000000-0000-4000-8000-000000000002',
    'f2000000-0000-4000-8000-000000000002',
    local_team, local_owner, local_members
  );
  perform pg_temp.seed_finalizable_project(
    'f1000000-0000-4000-8000-000000000003',
    'f2000000-0000-4000-8000-000000000003',
    local_team, local_owner, local_members
  );
  perform pg_temp.seed_finalizable_project(
    'f1000000-0000-4000-8000-000000000004',
    'f2000000-0000-4000-8000-000000000004',
    local_team, local_owner, local_members
  );
  perform pg_temp.seed_finalizable_project(
    'f1000000-0000-4000-8000-000000000005',
    null,
    local_team, local_owner, local_members
  );
  perform pg_temp.seed_finalizable_project(
    'f1000000-0000-4000-8000-000000000006',
    'f2000000-0000-4000-8000-000000000006',
    local_team, local_owner, local_members, 'active', 'plan'
  );
  perform pg_temp.seed_finalizable_project(
    'f1000000-0000-4000-8000-000000000007',
    'f2000000-0000-4000-8000-000000000007',
    local_team, local_owner, local_members, 'active', 'final',
    '{"human_confirmation_required":false,"pledge_recommendation":[]}'::jsonb
  );
  perform pg_temp.seed_finalizable_project(
    'f1000000-0000-4000-8000-000000000008',
    'f2000000-0000-4000-8000-000000000008',
    local_team, local_owner, local_members
  );
  perform pg_temp.seed_finalizable_project(
    'f1000000-0000-4000-8000-000000000009',
    'f2000000-0000-4000-8000-000000000009',
    foreign_team, foreign_owner, array[foreign_owner]
  );

  for fixture_number in 10..18
  loop
    perform pg_temp.seed_finalizable_project(
      pg_catalog.format(
        'f1000000-0000-4000-8000-%s',
        pg_catalog.lpad(fixture_number::pg_catalog.text, 12, '0')
      )::pg_catalog.uuid,
      pg_catalog.format(
        'f2000000-0000-4000-8000-%s',
        pg_catalog.lpad(fixture_number::pg_catalog.text, 12, '0')
      )::pg_catalog.uuid,
      local_team,
      local_owner,
      local_members
    );
  end loop;

  for fixture_number in 21..26
  loop
    perform pg_temp.seed_finalizable_project(
      pg_catalog.format(
        'f1000000-0000-4000-8000-%s',
        pg_catalog.lpad(fixture_number::pg_catalog.text, 12, '0')
      )::pg_catalog.uuid,
      pg_catalog.format(
        'f2000000-0000-4000-8000-%s',
        pg_catalog.lpad(fixture_number::pg_catalog.text, 12, '0')
      )::pg_catalog.uuid,
      local_team,
      local_owner,
      local_members
    );
  end loop;
end;
$fixtures$;

update public.projects
set status = case id
  when 'f1000000-0000-4000-8000-000000000002'::pg_catalog.uuid
    then 'draft'
  when 'f1000000-0000-4000-8000-000000000003'::pg_catalog.uuid
    then 'cancelled'
  else 'completed'
end
where id in (
  'f1000000-0000-4000-8000-000000000002',
  'f1000000-0000-4000-8000-000000000003',
  'f1000000-0000-4000-8000-000000000004'
);

-- Fixture mutations model malformed historical/service-role data. The RPC
-- must reject it rather than inventing missing pledge outcomes.
delete from public.pledges
where project_id = 'f1000000-0000-4000-8000-000000000013'
  and user_id = 'a2222222-2222-4222-8222-222222222222';

insert into public.pledges (project_id, user_id, amount, currency, status)
values (
  'f1000000-0000-4000-8000-000000000014',
  'a3333333-3333-4333-8333-333333333333',
  20,
  'POINTS',
  'declared'
);

insert into public.tasks (
  id,
  project_id,
  title,
  due_date,
  status
)
values
  (
    'f4000000-0000-4000-8000-000000000016',
    'f1000000-0000-4000-8000-000000000016',
    'Open dispute task',
    current_date,
    'disputed'
  ),
  (
    'f4000000-0000-4000-8000-000000000017',
    'f1000000-0000-4000-8000-000000000017',
    'Resolved dispute task',
    current_date,
    'rejected'
  );

insert into public.disputes (
  id,
  task_id,
  opened_by,
  reason,
  performer_explanation,
  reviewer_rejection_reason,
  final_resolution,
  status
)
values
  (
    'f5000000-0000-4000-8000-000000000016',
    'f4000000-0000-4000-8000-000000000016',
    'a2222222-2222-4222-8222-222222222222',
    'Open issue',
    'The work should be reconsidered.',
    'The proof is incomplete.',
    null,
    'open'
  ),
  (
    'f5000000-0000-4000-8000-000000000017',
    'f4000000-0000-4000-8000-000000000017',
    'a2222222-2222-4222-8222-222222222222',
    'Resolved issue',
    'The work was reconsidered.',
    'The proof was incomplete.',
    'reject',
    'resolved'
  );

select ok(
  has_function_privilege(
    'authenticated',
    'public.finalize_project(uuid,uuid,uuid,jsonb,text)',
    'EXECUTE'
  ),
  'authenticated callers can execute finalize_project'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.finalize_project(uuid,uuid,uuid,jsonb,text)',
    'EXECUTE'
  ),
  'anon cannot execute finalize_project'
);

select ok(
  not has_function_privilege(
    'public',
    'public.finalize_project(uuid,uuid,uuid,jsonb,text)',
    'EXECUTE'
  ),
  'PUBLIC cannot execute finalize_project'
);

select ok(
  not has_table_privilege(
    'authenticated',
    'public.final_decisions',
    'INSERT'
  ),
  'authenticated callers cannot insert final decisions directly'
);

select ok(
  not has_table_privilege('authenticated', 'public.pledges', 'UPDATE'),
  'authenticated callers cannot update pledge status directly'
);

select ok(
  not has_table_privilege('authenticated', 'public.disputes', 'UPDATE'),
  'authenticated callers cannot race finalization with a direct dispute update'
);

select ok(
  procedure.prosecdef
  and procedure.proconfig = array['search_path=""'],
  'finalize_project is SECURITY DEFINER with an empty search_path'
)
from pg_catalog.pg_proc as procedure
where procedure.oid =
  'public.finalize_project(uuid,uuid,uuid,jsonb,text)'::pg_catalog.regprocedure;

select throws_ok(
  $$
    insert into public.pledges (project_id, user_id, amount, currency)
    values (
      'f1000000-0000-4000-8000-000000000010',
      'a1111111-1111-4111-8111-111111111111',
      20,
      'POINTS'
    )
  $$,
  '23505',
  null,
  'the pledge unique constraint rejects duplicate project members'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '', true);

select throws_ok(
  $$
    select public.finalize_project(
      'f1000000-0000-4000-8000-000000000001',
      'f2000000-0000-4000-8000-000000000001',
      'f3000000-0000-4000-8000-000000000001',
      pg_temp.final_action(
        'f1000000-0000-4000-8000-000000000001'
      ),
      null
    )
  $$,
  'P0001',
  'Authentication required',
  'an unauthenticated request is rejected'
);

select set_config(
  'request.jwt.claim.sub',
  'a3333333-3333-4333-8333-333333333333',
  true
);

select throws_ok(
  $$
    select public.finalize_project(
      'f1000000-0000-4000-8000-000000000001',
      'f2000000-0000-4000-8000-000000000001',
      'f3000000-0000-4000-8000-000000000001',
      pg_temp.final_action(
        'f1000000-0000-4000-8000-000000000001'
      ),
      null
    )
  $$,
  'P0001',
  'Only the project owner can finalize this project',
  'a non-member cannot finalize the project'
);

select set_config(
  'request.jwt.claim.sub',
  'a2222222-2222-4222-8222-222222222222',
  true
);

select throws_ok(
  $$
    select public.finalize_project(
      'f1000000-0000-4000-8000-000000000001',
      'f2000000-0000-4000-8000-000000000001',
      'f3000000-0000-4000-8000-000000000001',
      pg_temp.final_action(
        'f1000000-0000-4000-8000-000000000001'
      ),
      null
    )
  $$,
  'P0001',
  'Only the project owner can finalize this project',
  'a regular project member cannot finalize the project'
);

select set_config(
  'request.jwt.claim.sub',
  'a4444444-4444-4444-8444-444444444444',
  true
);

select throws_ok(
  $$
    select public.finalize_project(
      'f1000000-0000-4000-8000-000000000001',
      'f2000000-0000-4000-8000-000000000001',
      'f3000000-0000-4000-8000-000000000001',
      pg_temp.final_action(
        'f1000000-0000-4000-8000-000000000001'
      ),
      null
    )
  $$,
  'P0001',
  'Only the project owner can finalize this project',
  'another team owner cannot finalize the project'
);

select set_config(
  'request.jwt.claim.sub',
  'a1111111-1111-4111-8111-111111111111',
  true
);

select is(
  (
    public.finalize_project(
      'f1000000-0000-4000-8000-000000000001',
      'f2000000-0000-4000-8000-000000000001',
      'f3000000-0000-4000-8000-000000000001',
      pg_temp.final_action(
        'f1000000-0000-4000-8000-000000000001'
      ),
      '  Human-confirmed virtual result.  '
    ) ->> 'project_status'
  ),
  'completed',
  'the project owner can finalize an active project'
);

select is(
  (
    select pg_catalog.count(*)::pg_catalog.int4
    from public.final_decisions
    where project_id = 'f1000000-0000-4000-8000-000000000001'
      and final_report_id =
        'f2000000-0000-4000-8000-000000000001'
      and confirmed_by =
        'a1111111-1111-4111-8111-111111111111'
      and confirmation_note = 'Human-confirmed virtual result.'
  ),
  1,
  'the decision records report, confirmer, and normalized note'
);

select is(
  (
    select status
    from public.projects
    where id = 'f1000000-0000-4000-8000-000000000001'
  ),
  'completed',
  'successful finalization completes the project'
);

select is(
  (
    select pg_catalog.count(*)::pg_catalog.int4
    from public.pledges
    where project_id = 'f1000000-0000-4000-8000-000000000001'
      and status = 'confirmed'
  ),
  2,
  'successful finalization confirms every project pledge'
);

select is(
  (
    select pg_catalog.sum(amount)
    from public.pledges
    where project_id = 'f1000000-0000-4000-8000-000000000001'
  ),
  40::pg_catalog.numeric,
  'finalization does not change pledge amounts'
);

select is(
  (
    select pg_catalog.count(*)::pg_catalog.int4
    from public.pledges
    where project_id = 'f1000000-0000-4000-8000-000000000001'
      and currency = 'POINTS'
  ),
  2,
  'finalization does not change pledge currency'
);

select is(
  (
    select pg_catalog.count(*)::pg_catalog.int4
    from public.audit_logs
    where project_id = 'f1000000-0000-4000-8000-000000000001'
      and action = 'final_decision_confirmed'
  ),
  1,
  'successful finalization writes one success audit'
);

select is(
  (
    public.finalize_project(
      'f1000000-0000-4000-8000-000000000001',
      'f2000000-0000-4000-8000-000000000001',
      'f3000000-0000-4000-8000-000000000001',
      pg_temp.final_action(
        'f1000000-0000-4000-8000-000000000001'
      ),
      'Human-confirmed virtual result.'
    ) ->> 'replayed'
  ),
  'true',
  'an exact retry returns the stored result'
);

select is(
  (
    select pg_catalog.count(*)::pg_catalog.int4
    from public.final_decisions
    where project_id = 'f1000000-0000-4000-8000-000000000001'
  ),
  1,
  'an exact retry does not duplicate the decision'
);

select is(
  (
    select pg_catalog.count(*)::pg_catalog.int4
    from public.audit_logs
    where project_id = 'f1000000-0000-4000-8000-000000000001'
      and action = 'final_decision_confirmed'
  ),
  1,
  'an exact retry does not duplicate the audit'
);

select throws_ok(
  $$
    select public.finalize_project(
      'f1000000-0000-4000-8000-000000000001',
      'f2000000-0000-4000-8000-000000000001',
      'f3000000-0000-4000-8000-000000000001',
      pg_temp.final_action(
        'f1000000-0000-4000-8000-000000000001',
        50
      ),
      'Human-confirmed virtual result.'
    )
  $$,
  'P0001',
  'Idempotency key was already used with different finalization data',
  'the same idempotency key with a different payload is rejected'
);

select throws_ok(
  $$
    select public.finalize_project(
      'f1000000-0000-4000-8000-000000000001',
      'f2000000-0000-4000-8000-000000000001',
      'f3000000-0000-4000-8000-000000000099',
      pg_temp.final_action(
        'f1000000-0000-4000-8000-000000000001'
      ),
      'Human-confirmed virtual result.'
    )
  $$,
  'P0001',
  'Project is already finalized',
  'a new key cannot create another decision for a completed project'
);

select throws_ok(
  $$
    select public.finalize_project(
      'f1000000-0000-4000-8000-000000000002',
      'f2000000-0000-4000-8000-000000000002',
      'f3000000-0000-4000-8000-000000000002',
      pg_temp.final_action(
        'f1000000-0000-4000-8000-000000000002'
      ),
      null
    )
  $$,
  'P0001',
  'Only active projects can be finalized',
  'a draft project cannot be finalized'
);

select throws_ok(
  $$
    select public.finalize_project(
      'f1000000-0000-4000-8000-000000000003',
      'f2000000-0000-4000-8000-000000000003',
      'f3000000-0000-4000-8000-000000000003',
      pg_temp.final_action(
        'f1000000-0000-4000-8000-000000000003'
      ),
      null
    )
  $$,
  'P0001',
  'Only active projects can be finalized',
  'a cancelled project cannot be finalized'
);

select throws_ok(
  $$
    select public.finalize_project(
      'f1000000-0000-4000-8000-000000000004',
      'f2000000-0000-4000-8000-000000000004',
      'f3000000-0000-4000-8000-000000000004',
      pg_temp.final_action(
        'f1000000-0000-4000-8000-000000000004'
      ),
      null
    )
  $$,
  'P0001',
  'Project is already finalized',
  'an already completed project cannot create a decision'
);

select throws_ok(
  $$
    select public.finalize_project(
      'f1000000-0000-4000-8000-000000000005',
      'f2000000-0000-4000-8000-000000000099',
      'f3000000-0000-4000-8000-000000000005',
      pg_temp.final_action(
        'f1000000-0000-4000-8000-000000000005'
      ),
      null
    )
  $$,
  'P0001',
  'A saved final report for this project is required',
  'a missing final report is rejected'
);

select throws_ok(
  $$
    select public.finalize_project(
      'f1000000-0000-4000-8000-000000000008',
      'f2000000-0000-4000-8000-000000000009',
      'f3000000-0000-4000-8000-000000000008',
      pg_temp.final_action(
        'f1000000-0000-4000-8000-000000000008'
      ),
      null
    )
  $$,
  'P0001',
  'A saved final report for this project is required',
  'a foreign-project final report is rejected'
);

select throws_ok(
  $$
    select public.finalize_project(
      'f1000000-0000-4000-8000-000000000006',
      'f2000000-0000-4000-8000-000000000006',
      'f3000000-0000-4000-8000-000000000006',
      pg_temp.final_action(
        'f1000000-0000-4000-8000-000000000006'
      ),
      null
    )
  $$,
  'P0001',
  'A saved final report for this project is required',
  'a non-final report is rejected'
);

select throws_ok(
  $$
    select public.finalize_project(
      'f1000000-0000-4000-8000-000000000007',
      'f2000000-0000-4000-8000-000000000007',
      'f3000000-0000-4000-8000-000000000007',
      pg_temp.final_action(
        'f1000000-0000-4000-8000-000000000007'
      ),
      null
    )
  $$,
  'P0001',
  'Saved final report output is invalid',
  'a malformed saved final report is rejected'
);

select throws_ok(
  $$
    select public.finalize_project(
      'f1000000-0000-4000-8000-000000000010',
      'f2000000-0000-4000-8000-000000000010',
      'f3000000-0000-4000-8000-000000000010',
      '[
        {
          "user_id":"a1111111-1111-4111-8111-111111111111",
          "return_percentage":100
        },
        {
          "user_id":"a3333333-3333-4333-8333-333333333333",
          "return_percentage":100
        }
      ]'::jsonb,
      null
    )
  $$,
  'P0001',
  'Final action must cover every project member exactly once',
  'a foreign member in the final action is rejected'
);

select throws_ok(
  $$
    select public.finalize_project(
      'f1000000-0000-4000-8000-000000000011',
      'f2000000-0000-4000-8000-000000000011',
      'f3000000-0000-4000-8000-000000000011',
      '[
        {
          "user_id":"a1111111-1111-4111-8111-111111111111",
          "return_percentage":100
        },
        {
          "user_id":"a1111111-1111-4111-8111-111111111111",
          "return_percentage":50
        }
      ]'::jsonb,
      null
    )
  $$,
  'P0001',
  'Final action contains a duplicate project member',
  'a duplicate member in the final action is rejected'
);

select throws_ok(
  $$
    select public.finalize_project(
      'f1000000-0000-4000-8000-000000000012',
      'f2000000-0000-4000-8000-000000000012',
      'f3000000-0000-4000-8000-000000000012',
      '[
        {
          "user_id":"a1111111-1111-4111-8111-111111111111",
          "return_percentage":100
        }
      ]'::jsonb,
      null
    )
  $$,
  'P0001',
  'Final action must cover every project member exactly once',
  'a missing project member in the final action is rejected'
);

select throws_ok(
  $$
    select public.finalize_project(
      'f1000000-0000-4000-8000-000000000013',
      'f2000000-0000-4000-8000-000000000013',
      'f3000000-0000-4000-8000-000000000013',
      pg_temp.final_action(
        'f1000000-0000-4000-8000-000000000013'
      ),
      null
    )
  $$,
  'P0001',
  'Every project member must have exactly one project pledge',
  'a missing project pledge is rejected fail-closed'
);

select throws_ok(
  $$
    select public.finalize_project(
      'f1000000-0000-4000-8000-000000000014',
      'f2000000-0000-4000-8000-000000000014',
      'f3000000-0000-4000-8000-000000000014',
      pg_temp.final_action(
        'f1000000-0000-4000-8000-000000000014'
      ),
      null
    )
  $$,
  'P0001',
  'Every project member must have exactly one project pledge',
  'a foreign project pledge is rejected fail-closed'
);

select is(
  (
    select status
    from public.pledges
    where project_id = 'f1000000-0000-4000-8000-000000000014'
      and user_id = 'a3333333-3333-4333-8333-333333333333'
  ),
  'declared',
  'a rejected foreign pledge remains unchanged'
);

select throws_ok(
  $$
    select public.finalize_project(
      'f1000000-0000-4000-8000-000000000015',
      'f2000000-0000-4000-8000-000000000015',
      'f3000000-0000-4000-8000-000000000015',
      '[
        {
          "user_id":"a1111111-1111-4111-8111-111111111111",
          "return_percentage":100,
          "status":"paid"
        },
        {
          "user_id":"a2222222-2222-4222-8222-222222222222",
          "return_percentage":100
        }
      ]'::jsonb,
      null
    )
  $$,
  'P0001',
  'Final action entries have missing or unsupported fields',
  'final action cannot supply a pledge status or unsupported fields'
);

select throws_ok(
  $$
    select public.finalize_project(
      'f1000000-0000-4000-8000-000000000016',
      'f2000000-0000-4000-8000-000000000016',
      'f3000000-0000-4000-8000-000000000016',
      pg_temp.final_action(
        'f1000000-0000-4000-8000-000000000016'
      ),
      null
    )
  $$,
  'P0001',
  'Resolve every project dispute before finalization',
  'an open dispute blocks project finalization'
);

select is(
  (
    public.finalize_project(
      'f1000000-0000-4000-8000-000000000017',
      'f2000000-0000-4000-8000-000000000017',
      'f3000000-0000-4000-8000-000000000017',
      pg_temp.final_action(
        'f1000000-0000-4000-8000-000000000017'
      ),
      null
    ) ->> 'project_status'
  ),
  'completed',
  'a resolved dispute does not block finalization'
);

select is(
  (
    select pg_catalog.count(*)::pg_catalog.int4
    from public.pledges
    where project_id = 'f1000000-0000-4000-8000-000000000018'
      and status = 'declared'
  ),
  2,
  'finalizing project A does not change another project pledges'
);

select throws_ok(
  $$
    insert into public.final_decisions (
      project_id,
      final_report_id,
      ai_recommendation,
      confirmed_by,
      final_action
    )
    values (
      'f1000000-0000-4000-8000-000000000018',
      'f2000000-0000-4000-8000-000000000018',
      '{}',
      'a1111111-1111-4111-8111-111111111111',
      '{}'
    )
  $$,
  '42501',
  'permission denied for table final_decisions',
  'direct final decision insert cannot bypass the RPC'
);

select throws_ok(
  $$
    update public.projects
    set status = 'completed'
    where id = 'f1000000-0000-4000-8000-000000000018'
  $$,
  '42501',
  'new row violates row-level security policy for table "projects"',
  'direct project completion cannot bypass the RPC'
);

select throws_ok(
  $$
    update public.pledges
    set status = 'confirmed'
    where project_id = 'f1000000-0000-4000-8000-000000000018'
  $$,
  '42501',
  'permission denied for table pledges',
  'direct pledge finalization cannot bypass the RPC'
);

select throws_ok(
  $$
    insert into public.audit_logs (project_id, user_id, action)
    values (
      'f1000000-0000-4000-8000-000000000018',
      'a1111111-1111-4111-8111-111111111111',
      'final_decision_confirmed'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "audit_logs"',
  'direct audit insert cannot forge finalization success'
);

reset role;

create function pg_temp.inject_final_decision_failure()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if pg_catalog.current_setting('commitbet.finalization_failure', true)
    = 'decision'
  then
    raise exception 'Injected final decision failure';
  end if;
  return new;
end;
$$;

create function pg_temp.inject_pledge_failure()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if pg_catalog.current_setting('commitbet.finalization_failure', true)
      = 'pledge_first'
    and new.project_id = 'f1000000-0000-4000-8000-000000000022'
  then
    raise exception 'Injected first pledge failure';
  end if;
  if pg_catalog.current_setting('commitbet.finalization_failure', true)
      = 'pledge_later'
    and new.project_id = 'f1000000-0000-4000-8000-000000000023'
    and new.user_id = 'a2222222-2222-4222-8222-222222222222'
  then
    raise exception 'Injected later pledge failure';
  end if;
  return new;
end;
$$;

create function pg_temp.inject_project_failure()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if pg_catalog.current_setting('commitbet.finalization_failure', true)
      = 'project'
    and new.status = 'completed'
  then
    raise exception 'Injected project completion failure';
  end if;
  return new;
end;
$$;

create function pg_temp.inject_audit_failure()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if pg_catalog.current_setting('commitbet.finalization_failure', true)
      = 'audit'
    and new.action = 'final_decision_confirmed'
  then
    raise exception 'Injected finalization audit failure';
  end if;
  return new;
end;
$$;

create function pg_temp.inject_idempotency_failure()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if pg_catalog.current_setting('commitbet.finalization_failure', true)
    = 'idempotency'
  then
    raise exception 'Injected finalization idempotency failure';
  end if;
  return new;
end;
$$;

create trigger inject_final_decision_failure
before insert on public.final_decisions
for each row execute function pg_temp.inject_final_decision_failure();

create trigger inject_pledge_failure
before update on public.pledges
for each row execute function pg_temp.inject_pledge_failure();

create trigger inject_project_failure
before update on public.projects
for each row execute function pg_temp.inject_project_failure();

create trigger inject_audit_failure
before insert on public.audit_logs
for each row execute function pg_temp.inject_audit_failure();

create trigger inject_idempotency_failure
before insert on private.project_finalization_requests
for each row execute function pg_temp.inject_idempotency_failure();

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'a1111111-1111-4111-8111-111111111111',
  true
);

select set_config('commitbet.finalization_failure', 'decision', true);
select throws_ok(
  $$
    select public.finalize_project(
      'f1000000-0000-4000-8000-000000000021',
      'f2000000-0000-4000-8000-000000000021',
      'f3000000-0000-4000-8000-000000000021',
      pg_temp.final_action(
        'f1000000-0000-4000-8000-000000000021'
      ),
      null
    )
  $$,
  'P0001',
  'Injected final decision failure',
  'an injected final decision insert failure aborts finalization'
);
select is(
  (select pg_catalog.count(*)::pg_catalog.int4 from public.final_decisions where project_id = 'f1000000-0000-4000-8000-000000000021'),
  0,
  'decision failure leaves no final decision'
);
select is(
  (select status from public.projects where id = 'f1000000-0000-4000-8000-000000000021'),
  'active',
  'decision failure leaves the project active'
);
select is(
  (select pg_catalog.count(*)::pg_catalog.int4 from public.pledges where project_id = 'f1000000-0000-4000-8000-000000000021' and status = 'confirmed'),
  0,
  'decision failure changes no pledges'
);
select is(
  (select pg_catalog.count(*)::pg_catalog.int4 from public.audit_logs where project_id = 'f1000000-0000-4000-8000-000000000021' and action = 'final_decision_confirmed'),
  0,
  'decision failure leaves no success audit'
);
select ok(
  pg_temp.no_finalization_request('f1000000-0000-4000-8000-000000000021'),
  'decision failure leaves no idempotency record'
);
select set_config('commitbet.finalization_failure', '', true);
select is(
  (public.finalize_project('f1000000-0000-4000-8000-000000000021', 'f2000000-0000-4000-8000-000000000021', 'f3000000-0000-4000-8000-000000000021', pg_temp.final_action('f1000000-0000-4000-8000-000000000021'), null) ->> 'project_status'),
  'completed',
  'decision-stage failure can be retried safely'
);

select set_config('commitbet.finalization_failure', 'pledge_first', true);
select throws_ok(
  $$select public.finalize_project('f1000000-0000-4000-8000-000000000022', 'f2000000-0000-4000-8000-000000000022', 'f3000000-0000-4000-8000-000000000022', pg_temp.final_action('f1000000-0000-4000-8000-000000000022'), null)$$,
  'P0001',
  'Injected first pledge failure',
  'an injected first pledge update failure aborts finalization'
);
select is((select pg_catalog.count(*)::pg_catalog.int4 from public.final_decisions where project_id = 'f1000000-0000-4000-8000-000000000022'), 0, 'first pledge failure rolls back the decision');
select is((select status from public.projects where id = 'f1000000-0000-4000-8000-000000000022'), 'active', 'first pledge failure leaves the project active');
select is((select pg_catalog.count(*)::pg_catalog.int4 from public.pledges where project_id = 'f1000000-0000-4000-8000-000000000022' and status = 'confirmed'), 0, 'first pledge failure rolls back every pledge');
select is((select pg_catalog.count(*)::pg_catalog.int4 from public.audit_logs where project_id = 'f1000000-0000-4000-8000-000000000022' and action = 'final_decision_confirmed'), 0, 'first pledge failure leaves no success audit');
select ok(pg_temp.no_finalization_request('f1000000-0000-4000-8000-000000000022'), 'first pledge failure leaves no idempotency record');
select set_config('commitbet.finalization_failure', '', true);
select is((public.finalize_project('f1000000-0000-4000-8000-000000000022', 'f2000000-0000-4000-8000-000000000022', 'f3000000-0000-4000-8000-000000000022', pg_temp.final_action('f1000000-0000-4000-8000-000000000022'), null) ->> 'project_status'), 'completed', 'first pledge-stage failure can be retried safely');

select set_config('commitbet.finalization_failure', 'pledge_later', true);
select throws_ok(
  $$select public.finalize_project('f1000000-0000-4000-8000-000000000023', 'f2000000-0000-4000-8000-000000000023', 'f3000000-0000-4000-8000-000000000023', pg_temp.final_action('f1000000-0000-4000-8000-000000000023'), null)$$,
  'P0001',
  'Injected later pledge failure',
  'an injected later pledge update failure aborts finalization'
);
select is((select pg_catalog.count(*)::pg_catalog.int4 from public.final_decisions where project_id = 'f1000000-0000-4000-8000-000000000023'), 0, 'later pledge failure rolls back the decision');
select is((select status from public.projects where id = 'f1000000-0000-4000-8000-000000000023'), 'active', 'later pledge failure leaves the project active');
select is((select pg_catalog.count(*)::pg_catalog.int4 from public.pledges where project_id = 'f1000000-0000-4000-8000-000000000023' and status = 'confirmed'), 0, 'later pledge failure rolls back earlier pledge updates');
select is((select pg_catalog.count(*)::pg_catalog.int4 from public.audit_logs where project_id = 'f1000000-0000-4000-8000-000000000023' and action = 'final_decision_confirmed'), 0, 'later pledge failure leaves no success audit');
select ok(pg_temp.no_finalization_request('f1000000-0000-4000-8000-000000000023'), 'later pledge failure leaves no idempotency record');
select set_config('commitbet.finalization_failure', '', true);
select is((public.finalize_project('f1000000-0000-4000-8000-000000000023', 'f2000000-0000-4000-8000-000000000023', 'f3000000-0000-4000-8000-000000000023', pg_temp.final_action('f1000000-0000-4000-8000-000000000023'), null) ->> 'project_status'), 'completed', 'later pledge-stage failure can be retried safely');

select set_config('commitbet.finalization_failure', 'project', true);
select throws_ok(
  $$select public.finalize_project('f1000000-0000-4000-8000-000000000024', 'f2000000-0000-4000-8000-000000000024', 'f3000000-0000-4000-8000-000000000024', pg_temp.final_action('f1000000-0000-4000-8000-000000000024'), null)$$,
  'P0001',
  'Injected project completion failure',
  'an injected project update failure aborts finalization'
);
select is((select pg_catalog.count(*)::pg_catalog.int4 from public.final_decisions where project_id = 'f1000000-0000-4000-8000-000000000024'), 0, 'project failure rolls back the decision');
select is((select status from public.projects where id = 'f1000000-0000-4000-8000-000000000024'), 'active', 'project failure leaves the project active');
select is((select pg_catalog.count(*)::pg_catalog.int4 from public.pledges where project_id = 'f1000000-0000-4000-8000-000000000024' and status = 'confirmed'), 0, 'project failure rolls back pledge updates');
select is((select pg_catalog.count(*)::pg_catalog.int4 from public.audit_logs where project_id = 'f1000000-0000-4000-8000-000000000024' and action = 'final_decision_confirmed'), 0, 'project failure leaves no success audit');
select ok(pg_temp.no_finalization_request('f1000000-0000-4000-8000-000000000024'), 'project failure leaves no idempotency record');
select set_config('commitbet.finalization_failure', '', true);
select is((public.finalize_project('f1000000-0000-4000-8000-000000000024', 'f2000000-0000-4000-8000-000000000024', 'f3000000-0000-4000-8000-000000000024', pg_temp.final_action('f1000000-0000-4000-8000-000000000024'), null) ->> 'project_status'), 'completed', 'project-stage failure can be retried safely');

select set_config('commitbet.finalization_failure', 'audit', true);
select throws_ok(
  $$select public.finalize_project('f1000000-0000-4000-8000-000000000025', 'f2000000-0000-4000-8000-000000000025', 'f3000000-0000-4000-8000-000000000025', pg_temp.final_action('f1000000-0000-4000-8000-000000000025'), null)$$,
  'P0001',
  'Injected finalization audit failure',
  'an injected audit insert failure aborts finalization'
);
select is((select pg_catalog.count(*)::pg_catalog.int4 from public.final_decisions where project_id = 'f1000000-0000-4000-8000-000000000025'), 0, 'audit failure rolls back the decision');
select is((select status from public.projects where id = 'f1000000-0000-4000-8000-000000000025'), 'active', 'audit failure rolls back project completion');
select is((select pg_catalog.count(*)::pg_catalog.int4 from public.pledges where project_id = 'f1000000-0000-4000-8000-000000000025' and status = 'confirmed'), 0, 'audit failure rolls back pledge updates');
select is((select pg_catalog.count(*)::pg_catalog.int4 from public.audit_logs where project_id = 'f1000000-0000-4000-8000-000000000025' and action = 'final_decision_confirmed'), 0, 'audit failure leaves no success audit');
select ok(pg_temp.no_finalization_request('f1000000-0000-4000-8000-000000000025'), 'audit failure leaves no idempotency record');
select set_config('commitbet.finalization_failure', '', true);
select is((public.finalize_project('f1000000-0000-4000-8000-000000000025', 'f2000000-0000-4000-8000-000000000025', 'f3000000-0000-4000-8000-000000000025', pg_temp.final_action('f1000000-0000-4000-8000-000000000025'), null) ->> 'project_status'), 'completed', 'audit-stage failure can be retried safely');

select set_config('commitbet.finalization_failure', 'idempotency', true);
select throws_ok(
  $$select public.finalize_project('f1000000-0000-4000-8000-000000000026', 'f2000000-0000-4000-8000-000000000026', 'f3000000-0000-4000-8000-000000000026', pg_temp.final_action('f1000000-0000-4000-8000-000000000026'), null)$$,
  'P0001',
  'Injected finalization idempotency failure',
  'an injected idempotency insert failure aborts finalization'
);
select is((select pg_catalog.count(*)::pg_catalog.int4 from public.final_decisions where project_id = 'f1000000-0000-4000-8000-000000000026'), 0, 'idempotency failure rolls back the decision');
select is((select status from public.projects where id = 'f1000000-0000-4000-8000-000000000026'), 'active', 'idempotency failure rolls back project completion');
select is((select pg_catalog.count(*)::pg_catalog.int4 from public.pledges where project_id = 'f1000000-0000-4000-8000-000000000026' and status = 'confirmed'), 0, 'idempotency failure rolls back pledge updates');
select is((select pg_catalog.count(*)::pg_catalog.int4 from public.audit_logs where project_id = 'f1000000-0000-4000-8000-000000000026' and action = 'final_decision_confirmed'), 0, 'idempotency failure rolls back the success audit');
select ok(pg_temp.no_finalization_request('f1000000-0000-4000-8000-000000000026'), 'idempotency failure leaves no partial request record');
select set_config('commitbet.finalization_failure', '', true);
select is((public.finalize_project('f1000000-0000-4000-8000-000000000026', 'f2000000-0000-4000-8000-000000000026', 'f3000000-0000-4000-8000-000000000026', pg_temp.final_action('f1000000-0000-4000-8000-000000000026'), null) ->> 'project_status'), 'completed', 'idempotency-stage failure can be retried safely');

select * from finish();
rollback;
