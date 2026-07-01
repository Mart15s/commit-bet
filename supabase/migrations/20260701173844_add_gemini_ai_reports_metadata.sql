alter table public.ai_reports
  alter column project_id drop not null;

alter table public.ai_reports
  add column if not exists task_id uuid references public.tasks(id) on delete cascade,
  add column if not exists dispute_id uuid references public.disputes(id) on delete cascade,
  add column if not exists created_by uuid references public.profiles(id);

update public.ai_reports report
set created_by = project.created_by
from public.projects project
where report.created_by is null
  and report.project_id = project.id;

alter table public.ai_reports
  alter column created_by set not null;

alter table public.ai_reports
  drop constraint if exists ai_reports_type_check;

alter table public.ai_reports
  add constraint ai_reports_type_check
  check (type in ('enhance_text', 'plan', 'evidence_review', 'dispute', 'final'));

create index if not exists ai_reports_project_type_created_idx
  on public.ai_reports(project_id, type, created_at desc);

create index if not exists ai_reports_task_type_created_idx
  on public.ai_reports(task_id, type, created_at desc);

create index if not exists ai_reports_dispute_type_created_idx
  on public.ai_reports(dispute_id, type, created_at desc);

drop policy if exists "members view ai reports" on public.ai_reports;
drop policy if exists "owner creates ai reports" on public.ai_reports;

create policy "members view scoped ai reports"
on public.ai_reports
for select
to authenticated
using (
  (project_id is not null and (select private.is_project_member(project_id)))
  or (project_id is null and created_by = (select auth.uid()))
);

create policy "members create scoped ai reports"
on public.ai_reports
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (
    project_id is null
    or (select private.is_project_member(project_id))
  )
);
