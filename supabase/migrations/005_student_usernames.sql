-- Phase 5: student usernames, school metadata and first-login password change.

alter table public.profiles
  add column username text,
  add column school text,
  add column major text,
  add column must_change_password boolean not null default false;

alter table public.profiles
  add constraint profiles_username_format
  check (username is null or username ~ '^[a-z0-9]+$');

create unique index profiles_username_unique_idx
  on public.profiles (lower(username))
  where username is not null;

-- Backfill accounts that were created through the Admin API before this migration ran.
update public.profiles as profile
set
  username = nullif(auth_user.raw_user_meta_data ->> 'username', ''),
  school = nullif(auth_user.raw_user_meta_data ->> 'school', ''),
  major = nullif(auth_user.raw_user_meta_data ->> 'major', ''),
  must_change_password = coalesce(
    auth_user.raw_user_meta_data ->> 'must_change_password' = 'true',
    false
  )
from auth.users as auth_user
where auth_user.id = profile.id;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    username,
    school,
    major,
    must_change_password
  )
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'username', ''),
    nullif(new.raw_user_meta_data ->> 'school', ''),
    nullif(new.raw_user_meta_data ->> 'major', ''),
    coalesce(new.raw_user_meta_data ->> 'must_change_password' = 'true', false)
  );
  return new;
end;
$$;

create or replace function public.complete_password_change()
returns void
language sql
security definer set search_path = ''
as $$
  update public.profiles
  set must_change_password = false,
      updated_at = now()
  where id = auth.uid();
$$;

revoke all on function public.complete_password_change() from public;
grant execute on function public.complete_password_change() to authenticated;
