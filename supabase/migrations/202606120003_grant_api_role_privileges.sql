grant usage on schema public to anon, authenticated, service_role;

grant select on public.profiles to authenticated;
grant update (name, avatar_url) on public.profiles to authenticated;

grant select on all tables in schema public to authenticated;
grant insert, update, delete on public.projects to authenticated;
grant insert, update, delete on public.project_member_profiles to authenticated;
grant insert, update, delete on public.pledges to authenticated;
grant insert, update, delete on public.tasks to authenticated;
grant insert, update, delete on public.task_assignments to authenticated;
grant insert, update, delete on public.daily_logs to authenticated;
grant insert, update, delete on public.daily_log_tasks to authenticated;
grant insert, update, delete on public.evidence to authenticated;
grant insert on public.reviews to authenticated;
grant insert, update on public.disputes to authenticated;
grant insert on public.ai_reports to authenticated;
grant insert on public.final_decisions to authenticated;
grant insert on public.audit_logs to authenticated;
grant update on public.notifications to authenticated;

grant all privileges on all tables in schema public to service_role;
grant all privileges on all routines in schema public to service_role;

