-- Phase 4: course weeks, lessons and downloadable lesson resources.

create type public.lesson_status as enum ('draft', 'published');

create table public.course_weeks (
  id uuid primary key default gen_random_uuid(),
  week_number integer not null unique check (week_number between 1 and 999),
  title text not null check (char_length(title) between 3 and 160),
  description text not null default '',
  status public.lesson_status not null default 'draft',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.course_weeks(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  summary text not null default '',
  content text not null default '',
  sort_order integer not null default 0 check (sort_order >= 0),
  status public.lesson_status not null default 'draft',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lesson_resources (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  file_name text not null check (char_length(file_name) between 1 and 255),
  storage_path text not null unique,
  mime_type text not null default 'application/octet-stream',
  file_size bigint not null check (file_size between 1 and 10485760),
  sort_order integer not null default 0 check (sort_order >= 0),
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index course_weeks_status_number_idx
  on public.course_weeks(status, week_number);
create index lessons_week_status_order_idx
  on public.lessons(week_id, status, sort_order);
create index lesson_resources_lesson_order_idx
  on public.lesson_resources(lesson_id, sort_order);

create trigger course_weeks_set_updated_at
  before update on public.course_weeks
  for each row execute procedure public.set_updated_at();

create trigger lessons_set_updated_at
  before update on public.lessons
  for each row execute procedure public.set_updated_at();

alter table public.course_weeks enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_resources enable row level security;

grant select, insert, update, delete on public.course_weeks to authenticated;
grant select, insert, update, delete on public.lessons to authenticated;
grant select, insert, update, delete on public.lesson_resources to authenticated;

create policy "Published weeks are visible to users"
on public.course_weeks for select
to authenticated
using (status = 'published' or public.is_admin());

create policy "Admins manage course weeks"
on public.course_weeks for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Published lessons are visible to users"
on public.lessons for select
to authenticated
using (
  public.is_admin()
  or (
    status = 'published'
    and exists (
      select 1 from public.course_weeks
      where course_weeks.id = lessons.week_id
        and course_weeks.status = 'published'
    )
  )
);

create policy "Admins manage lessons"
on public.lessons for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Published lesson resources are visible to users"
on public.lesson_resources for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.lessons
    join public.course_weeks on course_weeks.id = lessons.week_id
    where lessons.id = lesson_resources.lesson_id
      and lessons.status = 'published'
      and course_weeks.status = 'published'
  )
);

create policy "Admins manage lesson resources"
on public.lesson_resources for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit)
values ('lesson-resources', 'lesson-resources', false, 10485760)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

create policy "Authenticated users download published lesson files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'lesson-resources'
  and (
    public.is_admin()
    or exists (
      select 1
      from public.lesson_resources
      join public.lessons on lessons.id = lesson_resources.lesson_id
      join public.course_weeks on course_weeks.id = lessons.week_id
      where lesson_resources.storage_path = storage.objects.name
        and lessons.status = 'published'
        and course_weeks.status = 'published'
    )
  )
);

create policy "Admins upload lesson files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'lesson-resources' and public.is_admin());

create policy "Admins update lesson files"
on storage.objects for update
to authenticated
using (bucket_id = 'lesson-resources' and public.is_admin())
with check (bucket_id = 'lesson-resources' and public.is_admin());

create policy "Admins delete lesson files"
on storage.objects for delete
to authenticated
using (bucket_id = 'lesson-resources' and public.is_admin());
