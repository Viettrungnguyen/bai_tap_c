-- Phase 6: multi-course/class architecture and generic assignment files.
-- Keeps problems and legacy submission columns during the transition.

create type public.course_status as enum ('draft', 'published', 'archived');
create type public.class_status as enum ('active', 'archived');
create type public.course_member_role as enum ('student', 'instructor');
create type public.assignment_type as enum ('coding', 'file', 'text');
create type public.assignment_status as enum ('draft', 'published', 'archived');

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '',
  subject text not null default '',
  status public.course_status not null default 'draft',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.course_classes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 160),
  code text not null check (code ~ '^[A-Za-z0-9_-]+$'),
  description text not null default '',
  starts_on date,
  ends_on date,
  status public.class_status not null default 'active',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, code),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create table public.course_members (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.course_classes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.course_member_role not null default 'student',
  joined_at timestamptz not null default now(),
  unique (class_id, user_id)
);

alter table public.course_weeks add column course_id uuid references public.courses(id);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  class_id uuid references public.course_classes(id) on delete cascade,
  week_id uuid references public.course_weeks(id) on delete set null,
  problem_id uuid references public.problems(id) on delete set null,
  title text not null check (char_length(title) between 3 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '',
  instructions text not null default '',
  assignment_type public.assignment_type not null default 'file',
  status public.assignment_status not null default 'draft',
  due_at timestamptz,
  allowed_extensions text[] not null default array[]::text[],
  max_files integer not null default 1 check (max_files between 1 and 10),
  max_file_size bigint not null default 10485760 check (max_file_size between 1024 and 52428800),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (assignment_type <> 'coding' or problem_id is not null)
);

alter table public.submissions
  add column assignment_id uuid references public.assignments(id) on delete cascade;

alter table public.submissions alter column problem_id drop not null;
alter table public.submissions alter column language drop not null;
alter table public.submissions alter column file_name drop not null;
alter table public.submissions alter column source_code drop not null;

create table public.submission_files (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  file_name text not null check (char_length(file_name) between 1 and 255),
  storage_path text not null unique,
  mime_type text not null default 'application/octet-stream',
  file_size bigint not null check (file_size between 1 and 52428800),
  uploaded_at timestamptz not null default now()
);

create or replace function public.validate_submission_file()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  allowed text[];
  maximum_files integer;
  maximum_size bigint;
  extension text;
  current_count integer;
  stored_size bigint;
begin
  select assignments.allowed_extensions, assignments.max_files, assignments.max_file_size
  into allowed, maximum_files, maximum_size
  from public.submissions
  join public.assignments on assignments.id = submissions.assignment_id
  where submissions.id = new.submission_id;

  if maximum_files is null then
    raise exception 'Submission does not belong to a valid assignment';
  end if;

  select nullif(objects.metadata ->> 'size', '')::bigint into stored_size
  from storage.objects as objects
  where objects.bucket_id = 'assignment-submissions'
    and objects.name = new.storage_path;

  if stored_size is null then
    raise exception 'Uploaded storage object was not found';
  end if;

  new.file_size := stored_size;

  if stored_size > maximum_size then
    raise exception 'File exceeds assignment size limit';
  end if;

  select count(*) into current_count
  from public.submission_files
  where submission_id = new.submission_id;

  if current_count >= maximum_files then
    raise exception 'Submission exceeds assignment file count';
  end if;

  extension := case
    when position('.' in reverse(new.file_name)) > 0
      then lower(right(new.file_name, position('.' in reverse(new.file_name))))
    else ''
  end;

  if cardinality(allowed) > 0 and not (extension = any(allowed)) then
    raise exception 'File extension is not allowed for this assignment';
  end if;

  return new;
end;
$$;

create trigger submission_files_validate
  before insert or update on public.submission_files
  for each row execute procedure public.validate_submission_file();

create index courses_status_created_idx on public.courses(status, created_at desc);
create index course_classes_course_status_idx on public.course_classes(course_id, status);
create index course_members_user_idx on public.course_members(user_id, class_id);
create index course_weeks_course_number_idx on public.course_weeks(course_id, week_number);
create index assignments_course_status_idx on public.assignments(course_id, status, created_at desc);
create index assignments_class_status_idx on public.assignments(class_id, status, due_at);
create index assignments_problem_idx on public.assignments(problem_id) where problem_id is not null;
create index submissions_assignment_user_idx on public.submissions(assignment_id, user_id, submitted_at desc);
create index submission_files_submission_idx on public.submission_files(submission_id, uploaded_at);

create trigger courses_set_updated_at before update on public.courses
  for each row execute procedure public.set_updated_at();
create trigger course_classes_set_updated_at before update on public.course_classes
  for each row execute procedure public.set_updated_at();
create trigger assignments_set_updated_at before update on public.assignments
  for each row execute procedure public.set_updated_at();

create or replace function public.validate_assignment_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.class_id is not null and not exists (
    select 1 from public.course_classes
    where id = new.class_id and course_id = new.course_id
  ) then
    raise exception 'Assignment class must belong to its course';
  end if;

  if new.week_id is not null and not exists (
    select 1 from public.course_weeks
    where id = new.week_id and course_id = new.course_id
  ) then
    raise exception 'Assignment week must belong to its course';
  end if;

  return new;
end;
$$;

create trigger assignments_validate_scope
  before insert or update on public.assignments
  for each row execute procedure public.validate_assignment_scope();

-- Create a transition course/class and connect all existing content and users.
do $$
declare
  owner_id uuid;
  legacy_course_id uuid;
  legacy_class_id uuid;
begin
  select id into owner_id
  from public.profiles
  order by (role = 'admin') desc, created_at
  limit 1;

  if owner_id is not null then
    insert into public.courses (title, slug, description, subject, status, created_by)
    values (
      'Lập trình C/C++',
      'lap-trinh-c-cpp',
      'Khóa học được tạo tự động từ dữ liệu hiện có.',
      'Lập trình',
      'published',
      owner_id
    )
    on conflict (slug) do update set title = excluded.title
    returning id into legacy_course_id;

    insert into public.course_classes (course_id, name, code, description, status, created_by)
    values (legacy_course_id, 'Lớp mặc định', 'DEFAULT', 'Lớp chuyển đổi cho học viên hiện có.', 'active', owner_id)
    on conflict (course_id, code) do update set name = excluded.name
    returning id into legacy_class_id;

    update public.course_weeks
    set course_id = legacy_course_id
    where course_id is null;

    insert into public.course_members (class_id, user_id, role)
    select legacy_class_id, id,
      case when role = 'admin' then 'instructor'::public.course_member_role
           else 'student'::public.course_member_role end
    from public.profiles
    on conflict (class_id, user_id) do nothing;

    insert into public.assignments (
      course_id, class_id, problem_id, title, slug, description, instructions,
      assignment_type, status, allowed_extensions, max_files, max_file_size, created_by
    )
    select
      legacy_course_id,
      legacy_class_id,
      problem.id,
      problem.title,
      problem.slug,
      problem.description,
      concat_ws(E'\n\n', problem.input_description, problem.output_description),
      'coding',
      case problem.status
        when 'published' then 'published'::public.assignment_status
        when 'archived' then 'archived'::public.assignment_status
        else 'draft'::public.assignment_status
      end,
      array['.c', '.cc', '.cpp', '.cxx']::text[],
      1,
      262144,
      problem.created_by
    from public.problems as problem
    where not exists (
      select 1 from public.assignments where assignments.problem_id = problem.id
    );

    update public.submissions as submission
    set assignment_id = assignment.id
    from public.assignments as assignment
    where assignment.problem_id = submission.problem_id
      and submission.assignment_id is null;
  end if;
end $$;

alter table public.course_weeks alter column course_id set not null;
alter table public.course_weeks drop constraint if exists course_weeks_week_number_key;
alter table public.course_weeks add constraint course_weeks_course_week_unique unique (course_id, week_number);
alter table public.submissions alter column assignment_id set not null;

create or replace function public.is_course_member(requested_course_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select public.is_admin() or exists (
    select 1
    from public.course_members
    join public.course_classes on course_classes.id = course_members.class_id
    where course_classes.course_id = requested_course_id
      and course_members.user_id = auth.uid()
      and course_classes.status = 'active'
  );
$$;

create or replace function public.is_class_member(requested_class_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select public.is_admin() or exists (
    select 1
    from public.course_members
    where course_members.class_id = requested_class_id
      and course_members.user_id = auth.uid()
  );
$$;

create or replace function public.can_upload_assignment_object(object_name text, object_size bigint)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select
    (storage.foldername(object_name))[1] = auth.uid()::text
    and exists (
      select 1
      from public.submissions
      join public.assignments on assignments.id = submissions.assignment_id
      where submissions.id::text = (storage.foldername(object_name))[2]
        and submissions.user_id = auth.uid()
        and submissions.status = 'pending'
        and object_size between 1 and assignments.max_file_size
        and (
          cardinality(assignments.allowed_extensions) = 0
          or lower(right(object_name, position('.' in reverse(object_name)))) = any(assignments.allowed_extensions)
        )
        and (
          select count(*)
          from storage.objects
          where bucket_id = 'assignment-submissions'
            and name like auth.uid()::text || '/' || submissions.id::text || '/%'
        ) < assignments.max_files
    );
$$;

revoke all on function public.is_course_member(uuid) from public;
revoke all on function public.is_class_member(uuid) from public;
revoke all on function public.can_upload_assignment_object(text, bigint) from public;
grant execute on function public.is_course_member(uuid) to authenticated;
grant execute on function public.is_class_member(uuid) to authenticated;
grant execute on function public.can_upload_assignment_object(text, bigint) to authenticated;

alter table public.courses enable row level security;
alter table public.course_classes enable row level security;
alter table public.course_members enable row level security;
alter table public.assignments enable row level security;
alter table public.submission_files enable row level security;

grant select, insert, update, delete on public.courses to authenticated;
grant select, insert, update, delete on public.course_classes to authenticated;
grant select, insert, update, delete on public.course_members to authenticated;
grant select, insert, update, delete on public.assignments to authenticated;
grant select, insert, delete on public.submission_files to authenticated;
grant delete on public.submissions to authenticated;

create policy "Members read their courses" on public.courses for select to authenticated
using (public.is_admin() or (status = 'published' and public.is_course_member(id)));
create policy "Admins manage courses" on public.courses for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Members read their classes" on public.course_classes for select to authenticated
using (
  public.is_admin()
  or (
    status = 'active'
    and public.is_course_member(course_id)
    and exists (select 1 from public.courses where courses.id = course_classes.course_id and courses.status = 'published')
  )
);
create policy "Admins manage classes" on public.course_classes for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Members read class rosters" on public.course_members for select to authenticated
using (user_id = auth.uid() or public.is_admin());
create policy "Admins manage class members" on public.course_members for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Members read published assignments" on public.assignments for select to authenticated
using (
  public.is_admin()
  or (
    status = 'published'
    and public.is_course_member(course_id)
    and exists (select 1 from public.courses where courses.id = assignments.course_id and courses.status = 'published')
    and (class_id is null or public.is_class_member(class_id))
  )
);
create policy "Admins manage assignments" on public.assignments for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Published problems are visible to users" on public.problems;
create policy "Assigned problems are visible to course members" on public.problems for select to authenticated
using (
  public.is_admin()
  or (
    status = 'published'
    and exists (
      select 1
      from public.assignments
      join public.courses on courses.id = assignments.course_id
      where assignments.problem_id = problems.id
        and assignments.status = 'published'
        and courses.status = 'published'
        and public.is_course_member(assignments.course_id)
        and (assignments.class_id is null or public.is_class_member(assignments.class_id))
    )
  )
);

drop policy if exists "Published weeks are visible to users" on public.course_weeks;
create policy "Course members read published weeks" on public.course_weeks for select to authenticated
using (
  public.is_admin()
  or (
    status = 'published'
    and public.is_course_member(course_id)
    and exists (select 1 from public.courses where courses.id = course_weeks.course_id and courses.status = 'published')
  )
);

drop policy if exists "Published lessons are visible to users" on public.lessons;
create policy "Course members read published lessons" on public.lessons for select to authenticated
using (
  public.is_admin()
  or (
    status = 'published'
    and exists (
      select 1 from public.course_weeks
      where course_weeks.id = lessons.week_id
        and course_weeks.status = 'published'
        and public.is_course_member(course_weeks.course_id)
    )
  )
);

drop policy if exists "Published lesson resources are visible to users" on public.lesson_resources;
create policy "Course members read published lesson resources" on public.lesson_resources for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.lessons
    join public.course_weeks on course_weeks.id = lessons.week_id
    where lessons.id = lesson_resources.lesson_id
      and lessons.status = 'published'
      and course_weeks.status = 'published'
      and public.is_course_member(course_weeks.course_id)
  )
);

drop policy if exists "Authenticated users download published lesson files" on storage.objects;
create policy "Course members download published lesson files" on storage.objects for select to authenticated
using (
  bucket_id = 'lesson-resources'
  and (
    public.is_admin()
    or exists (
      select 1
      from public.lesson_resources
      join public.lessons on lessons.id = lesson_resources.lesson_id
      join public.course_weeks on course_weeks.id = lessons.week_id
      join public.courses on courses.id = course_weeks.course_id
      where lesson_resources.storage_path = storage.objects.name
        and lessons.status = 'published'
        and course_weeks.status = 'published'
        and courses.status = 'published'
        and public.is_course_member(course_weeks.course_id)
    )
  )
);

drop policy if exists "Users read their own submissions" on public.submissions;
drop policy if exists "Users submit their own source files" on public.submissions;
drop policy if exists "Admins review submissions" on public.submissions;

create policy "Users read their own submissions" on public.submissions for select to authenticated
using (user_id = auth.uid() or public.is_admin());
create policy "Users create assignment submissions" on public.submissions for insert to authenticated
with check (
  user_id = auth.uid()
  and status = 'pending'
  and score is null and review_note is null and reviewed_by is null and reviewed_at is null
  and exists (
    select 1 from public.assignments
    where assignments.id = submissions.assignment_id
      and assignments.status = 'published'
      and public.is_course_member(assignments.course_id)
      and exists (select 1 from public.courses where courses.id = assignments.course_id and courses.status = 'published')
      and (assignments.class_id is null or public.is_class_member(assignments.class_id))
  )
);
create policy "Users remove incomplete submissions" on public.submissions for delete to authenticated
using (user_id = auth.uid() and status = 'pending' and reviewed_by is null);
create policy "Admins review submissions" on public.submissions for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Users read submission files" on public.submission_files for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.submissions
    where submissions.id = submission_files.submission_id
      and submissions.user_id = auth.uid()
  )
);
create policy "Users add their submission files" on public.submission_files for insert to authenticated
with check (
  exists (
    select 1 from public.submissions
    where submissions.id = submission_files.submission_id
      and submissions.user_id = auth.uid()
      and submissions.status = 'pending'
  )
);
create policy "Users remove their submission files" on public.submission_files for delete to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.submissions
    where submissions.id = submission_files.submission_id
      and submissions.user_id = auth.uid()
      and submissions.status = 'pending'
  )
);

insert into storage.buckets (id, name, public, file_size_limit)
values ('assignment-submissions', 'assignment-submissions', false, 52428800)
on conflict (id) do update
set public = excluded.public, file_size_limit = excluded.file_size_limit;

create policy "Users upload assignment files" on storage.objects for insert to authenticated
with check (
  bucket_id = 'assignment-submissions'
  and public.can_upload_assignment_object(name, nullif(metadata ->> 'size', '')::bigint)
);
create policy "Users download their assignment files" on storage.objects for select to authenticated
using (
  bucket_id = 'assignment-submissions'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);
create policy "Users remove their assignment files" on storage.objects for delete to authenticated
using (
  bucket_id = 'assignment-submissions'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);
