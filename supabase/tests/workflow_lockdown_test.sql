begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(16);

select ok(
  not has_table_privilege('authenticated', 'public.projects', 'UPDATE'),
  'projects cannot be updated directly'
);
select ok(
  not has_table_privilege('authenticated', 'public.projects', 'DELETE'),
  'projects cannot be deleted directly'
);
select ok(
  not has_table_privilege('authenticated', 'public.reviews', 'INSERT'),
  'reviews can only be created by the review RPC'
);
select ok(
  not has_table_privilege('authenticated', 'public.disputes', 'INSERT'),
  'disputes can only be opened by the dispute RPC'
);
select ok(
  not has_table_privilege('authenticated', 'public.disputes', 'UPDATE'),
  'disputes cannot be resolved through direct updates'
);
select ok(
  not has_table_privilege('authenticated', 'public.evidence', 'UPDATE'),
  'evidence cannot be moved to another task through direct updates'
);
select ok(
  not has_table_privilege('authenticated', 'public.ai_reports', 'INSERT'),
  'authenticated clients cannot forge AI reports'
);

select ok(
  has_function_privilege('authenticated', 'public.start_project(uuid)', 'EXECUTE'),
  'authenticated owners can call the narrow start function'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.open_project_dispute(uuid,text,text,text)',
    'EXECUTE'
  ),
  'authenticated assignees can call the narrow dispute function'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.delete_draft_project(uuid)',
    'EXECUTE'
  ),
  'authenticated owners can call safe draft deletion'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.attach_dispute_recommendation_server(uuid,uuid,jsonb)',
    'EXECUTE'
  ),
  'authenticated clients cannot forge server AI mediation'
);
select ok(
  has_function_privilege(
    'service_role',
    'public.attach_dispute_recommendation_server(uuid,uuid,jsonb)',
    'EXECUTE'
  ),
  'the server role can persist validated AI mediation'
);

select is(
  (select public from storage.buckets where id = 'evidence'),
  false,
  'evidence storage is private'
);
select is(
  (select file_size_limit from storage.buckets where id = 'evidence'),
  10485760::bigint,
  'evidence storage enforces the 10 MB file limit'
);
select ok(
  not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and cmd = 'INSERT'
      and roles @> array['authenticated']::name[]
  ),
  'browser clients cannot create orphaned evidence objects'
);
select ok(
  (select allowed_mime_types from storage.buckets where id = 'evidence')
    @> array['image/png', 'application/pdf', 'text/plain']::text[],
  'evidence storage has the intended narrow MIME allowlist'
);

select * from finish();
rollback;
