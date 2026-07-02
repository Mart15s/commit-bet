alter table public.project_member_profiles
  add column if not exists roles text[] not null default '{}',
  add column if not exists evidence_types text[] not null default '{}',
  add column if not exists experience_level text not null default 'Beginner',
  add column if not exists best_work_time text not null default 'Flexible',
  add column if not exists custom_notes text not null default '';

alter table public.projects
  add column if not exists project_type text not null default 'Other',
  add column if not exists selected_success_criteria text[] not null default '{}',
  add column if not exists custom_success_criteria text[] not null default '{}',
  add column if not exists pledge_amount numeric(12,2) not null default 20,
  add column if not exists pledge_amount_is_custom boolean not null default false;
