alter table public.profiles
add column if not exists preferred_language text not null default 'en'
check (preferred_language in ('en', 'lt'));

grant update (name, avatar_url, preferred_language) on public.profiles to authenticated;
