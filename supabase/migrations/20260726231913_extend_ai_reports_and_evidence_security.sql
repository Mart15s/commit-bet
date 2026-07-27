alter table public.ai_reports
  drop constraint if exists ai_reports_type_check;

alter table public.ai_reports
  add constraint ai_reports_type_check
  check (type in ('enhance_text', 'plan', 'evidence_review', 'dispute', 'final'));

alter table public.ai_reports
  add column if not exists created_by pg_catalog.uuid
    references public.profiles(id) on delete set null,
  add column if not exists task_id pg_catalog.uuid
    references public.tasks(id) on delete cascade,
  add column if not exists duration_ms pg_catalog.int4
    check (duration_ms is null or duration_ms between 0 and 300000),
  add column if not exists status pg_catalog.text not null default 'succeeded'
    check (status in ('succeeded', 'failed')),
  add column if not exists error_code pg_catalog.text
    check (
      error_code is null
      or (
        pg_catalog.char_length(error_code) between 1 and 80
        and error_code ~ '^[a-z0-9_]+$'
      )
    );

create index if not exists ai_reports_project_type_created_idx
  on public.ai_reports(project_id, type, created_at desc);

create index if not exists ai_reports_task_created_idx
  on public.ai_reports(task_id, created_at desc)
  where task_id is not null;

create unique index if not exists ai_reports_one_final_per_project_idx
  on public.ai_reports(project_id)
  where type = 'final';

update storage.buckets
set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/csv'
  ]::pg_catalog.text[]
where id = 'evidence';

revoke update, delete on table public.ai_reports from anon, authenticated;
