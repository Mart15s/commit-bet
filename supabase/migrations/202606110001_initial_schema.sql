create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  owner_id uuid not null references public.profiles(id),
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique(team_id, user_id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  title text not null,
  description text not null default '',
  goal text not null,
  success_criteria jsonb not null default '[]'::jsonb,
  start_date date not null,
  end_date date not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'completed', 'cancelled')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table public.project_member_profiles (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  strengths text[] not null default '{}',
  weaknesses text[] not null default '{}',
  availability_minutes_per_day integer not null check (availability_minutes_per_day between 15 and 1440),
  preferred_work_types text[] not null default '{}',
  notes text not null default '',
  unique(project_id, user_id)
);

create table public.pledges (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null check (currency in ('POINTS', 'EUR_DECLARED')),
  status text not null default 'declared' check (status in ('declared', 'confirmed')),
  unique(project_id, user_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text not null default '',
  acceptance_criteria jsonb not null default '[]'::jsonb,
  expected_evidence_types text[] not null default '{}',
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  due_date date not null,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'submitted', 'approved', 'needs_changes', 'rejected', 'disputed')),
  ai_generated boolean not null default false,
  submitted_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.task_assignments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  assigned_reason text not null default '',
  unique(task_id)
);

create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null default current_date,
  summary text not null,
  time_spent_minutes integer not null check (time_spent_minutes between 0 and 1440),
  blockers text not null default '',
  next_steps text not null default '',
  created_at timestamptz not null default now(),
  unique(project_id, user_id, log_date)
);

create table public.daily_log_tasks (
  id uuid primary key default gen_random_uuid(),
  daily_log_id uuid not null references public.daily_logs(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  unique(daily_log_id, task_id)
);

create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('screenshot', 'document', 'github', 'video', 'link', 'demo', 'other')),
  url text,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (url is not null or char_length(description) > 0)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('approved', 'needs_changes', 'rejected')),
  comment text not null default '',
  created_at timestamptz not null default now(),
  check (status = 'approved' or char_length(trim(comment)) > 0)
);

create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  opened_by uuid not null references public.profiles(id),
  reason text not null,
  performer_explanation text not null,
  reviewer_rejection_reason text not null,
  ai_recommendation jsonb,
  final_resolution text,
  status text not null default 'open' check (status in ('open', 'resolved', 'escalated')),
  created_at timestamptz not null default now()
);

create unique index one_open_dispute_per_task on public.disputes(task_id) where status = 'open';

create table public.ai_reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  type text not null check (type in ('plan', 'dispute', 'final')),
  input_snapshot jsonb not null default '{}'::jsonb,
  output jsonb not null,
  model text not null,
  created_at timestamptz not null default now()
);

create table public.final_decisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  ai_recommendation jsonb not null,
  confirmed_by uuid not null references public.profiles(id),
  final_action jsonb not null,
  confirmed_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index team_members_user_idx on public.team_members(user_id);
create index projects_team_idx on public.projects(team_id);
create index tasks_project_status_idx on public.tasks(project_id, status);
create index assignments_user_idx on public.task_assignments(user_id);
create index evidence_task_idx on public.evidence(task_id);
create index reviews_task_idx on public.reviews(task_id);
create index logs_project_date_idx on public.daily_logs(project_id, log_date desc);
create index audit_project_date_idx on public.audit_logs(project_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email, 'Member'), '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_team_member(check_team_id uuid, check_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.team_members
    where team_id = check_team_id and user_id = check_user_id
  );
$$;

create or replace function public.is_project_member(check_project_id uuid, check_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    join public.team_members tm on tm.team_id = p.team_id
    where p.id = check_project_id and tm.user_id = check_user_id
  );
$$;

create or replace function public.is_project_owner(check_project_id uuid, check_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.projects
    where id = check_project_id and created_by = check_user_id
  );
$$;

create or replace function public.create_team(team_name text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  new_team_id uuid;
begin
  insert into public.teams(name, owner_id, invite_code)
  values (team_name, auth.uid(), upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8)))
  returning id into new_team_id;

  insert into public.team_members(team_id, user_id, role)
  values (new_team_id, auth.uid(), 'owner');

  return new_team_id;
end;
$$;

create or replace function public.join_team(code text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  found_team_id uuid;
begin
  select id into found_team_id from public.teams where invite_code = upper(trim(code));
  if found_team_id is null then raise exception 'Invalid invite code'; end if;
  if (select count(*) from public.team_members where team_id = found_team_id) >= 5 then
    raise exception 'This team already has 5 members';
  end if;

  insert into public.team_members(team_id, user_id, role)
  values (found_team_id, auth.uid(), 'member')
  on conflict (team_id, user_id) do nothing;
  return found_team_id;
end;
$$;

create or replace function public.touch_task_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger task_updated_at before update on public.tasks
for each row execute procedure public.touch_task_updated_at();

insert into storage.buckets (id, name, public, file_size_limit)
values ('evidence', 'evidence', false, 10485760)
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.projects enable row level security;
alter table public.project_member_profiles enable row level security;
alter table public.pledges enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignments enable row level security;
alter table public.daily_logs enable row level security;
alter table public.daily_log_tasks enable row level security;
alter table public.evidence enable row level security;
alter table public.reviews enable row level security;
alter table public.disputes enable row level security;
alter table public.ai_reports enable row level security;
alter table public.final_decisions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;

create policy "authenticated profiles visible" on public.profiles for select to authenticated using (true);
create policy "users update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "members view teams" on public.teams for select to authenticated using (public.is_team_member(id));
create policy "members view memberships" on public.team_members for select to authenticated using (public.is_team_member(team_id));

create policy "members view projects" on public.projects for select to authenticated using (public.is_team_member(team_id));
create policy "members create draft projects" on public.projects for insert to authenticated with check (created_by = auth.uid() and public.is_team_member(team_id));
create policy "owner updates projects" on public.projects for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());

create policy "members view project profiles" on public.project_member_profiles for select to authenticated using (public.is_project_member(project_id));
create policy "owner manages project profiles" on public.project_member_profiles for all to authenticated using (public.is_project_owner(project_id)) with check (public.is_project_owner(project_id));
create policy "members view pledges" on public.pledges for select to authenticated using (public.is_project_member(project_id));
create policy "owner manages pledges" on public.pledges for all to authenticated using (public.is_project_owner(project_id)) with check (public.is_project_owner(project_id));

create policy "members view tasks" on public.tasks for select to authenticated using (public.is_project_member(project_id));
create policy "owner creates tasks" on public.tasks for insert to authenticated with check (public.is_project_owner(project_id));
create policy "owner or assignee updates tasks" on public.tasks for update to authenticated using (
  public.is_project_owner(project_id) or exists (
    select 1 from public.task_assignments ta where ta.task_id = id and ta.user_id = auth.uid()
  )
);
create policy "owner deletes draft tasks" on public.tasks for delete to authenticated using (public.is_project_owner(project_id));

create policy "members view assignments" on public.task_assignments for select to authenticated using (
  exists (select 1 from public.tasks t where t.id = task_id and public.is_project_member(t.project_id))
);
create policy "owner manages assignments" on public.task_assignments for all to authenticated using (
  exists (select 1 from public.tasks t where t.id = task_id and public.is_project_owner(t.project_id))
) with check (
  exists (select 1 from public.tasks t where t.id = task_id and public.is_project_owner(t.project_id))
);

create policy "members view logs" on public.daily_logs for select to authenticated using (public.is_project_member(project_id));
create policy "users create own logs" on public.daily_logs for insert to authenticated with check (user_id = auth.uid() and public.is_project_member(project_id));
create policy "users update own logs" on public.daily_logs for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "members view log tasks" on public.daily_log_tasks for select to authenticated using (
  exists (select 1 from public.daily_logs l where l.id = daily_log_id and public.is_project_member(l.project_id))
);
create policy "users manage own log tasks" on public.daily_log_tasks for all to authenticated using (
  exists (select 1 from public.daily_logs l where l.id = daily_log_id and l.user_id = auth.uid())
) with check (
  exists (select 1 from public.daily_logs l where l.id = daily_log_id and l.user_id = auth.uid())
);

create policy "members view evidence" on public.evidence for select to authenticated using (
  exists (select 1 from public.tasks t where t.id = task_id and public.is_project_member(t.project_id))
);
create policy "users add own evidence" on public.evidence for insert to authenticated with check (
  user_id = auth.uid() and exists (select 1 from public.tasks t where t.id = task_id and public.is_project_member(t.project_id))
);
create policy "users manage own evidence" on public.evidence for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users delete own evidence" on public.evidence for delete to authenticated using (user_id = auth.uid());

create policy "members view reviews" on public.reviews for select to authenticated using (
  exists (select 1 from public.tasks t where t.id = task_id and public.is_project_member(t.project_id))
);
create policy "other members add reviews" on public.reviews for insert to authenticated with check (
  reviewer_id = auth.uid()
  and exists (
    select 1 from public.tasks t
    where t.id = task_id and public.is_project_member(t.project_id)
    and not exists (select 1 from public.task_assignments ta where ta.task_id = t.id and ta.user_id = auth.uid())
  )
);

create policy "members view disputes" on public.disputes for select to authenticated using (
  exists (select 1 from public.tasks t where t.id = task_id and public.is_project_member(t.project_id))
);
create policy "assignee opens disputes" on public.disputes for insert to authenticated with check (
  opened_by = auth.uid() and exists (select 1 from public.task_assignments ta where ta.task_id = task_id and ta.user_id = auth.uid())
);
create policy "owner resolves disputes" on public.disputes for update to authenticated using (
  exists (select 1 from public.tasks t where t.id = task_id and public.is_project_owner(t.project_id))
);

create policy "members view ai reports" on public.ai_reports for select to authenticated using (public.is_project_member(project_id));
create policy "owner creates ai reports" on public.ai_reports for insert to authenticated with check (public.is_project_owner(project_id));
create policy "members view decisions" on public.final_decisions for select to authenticated using (public.is_project_member(project_id));
create policy "owner confirms decisions" on public.final_decisions for insert to authenticated with check (confirmed_by = auth.uid() and public.is_project_owner(project_id));

create policy "members view audit" on public.audit_logs for select to authenticated using (project_id is null or public.is_project_member(project_id));
create policy "members add audit" on public.audit_logs for insert to authenticated with check (user_id = auth.uid() and (project_id is null or public.is_project_member(project_id)));
create policy "users view notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "users update notifications" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "project members read evidence files" on storage.objects for select to authenticated using (
  bucket_id = 'evidence'
  and public.is_project_member(((storage.foldername(name))[1])::uuid)
);
create policy "users upload evidence files" on storage.objects for insert to authenticated with check (
  bucket_id = 'evidence'
  and (storage.foldername(name))[2] = auth.uid()::text
  and public.is_project_member(((storage.foldername(name))[1])::uuid)
);
create policy "users delete own evidence files" on storage.objects for delete to authenticated using (
  bucket_id = 'evidence' and owner_id = auth.uid()::text
);

grant execute on function public.create_team(text) to authenticated;
grant execute on function public.join_team(text) to authenticated;

