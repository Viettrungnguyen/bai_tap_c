-- Phase 7: scope the coding problem bank by course.

alter table public.problems
  add column course_id uuid references public.courses(id) on delete cascade;

-- Existing problems created by migration 006 already have assignments. Use the
-- oldest linked assignment as their owning course.
update public.problems as problem
set course_id = linked.course_id
from (
  select distinct on (problem_id) problem_id, course_id
  from public.assignments
  where problem_id is not null
  order by problem_id, created_at
) as linked
where linked.problem_id = problem.id
  and problem.course_id is null;

-- Defensive fallback for old draft problems that have never been assigned.
update public.problems
set course_id = (select id from public.courses order by created_at limit 1)
where course_id is null;

do $$
begin
  if exists (select 1 from public.problems where course_id is null) then
    raise exception 'Cannot assign existing problems because no course exists';
  end if;
end $$;

alter table public.problems alter column course_id set not null;

create index problems_course_status_idx
  on public.problems(course_id, status, created_at desc);

create or replace function public.validate_problem_course_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.course_id is distinct from old.course_id and exists (
    select 1 from public.assignments
    where problem_id = old.id and course_id <> new.course_id
  ) then
    raise exception 'Problem is used by an assignment in another course';
  end if;

  return new;
end;
$$;

create trigger problems_validate_course_change
  before update of course_id on public.problems
  for each row execute procedure public.validate_problem_course_change();

-- Keep assignments, classes, weeks and coding problems inside the same course.
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

  if new.problem_id is not null and not exists (
    select 1 from public.problems
    where id = new.problem_id and course_id = new.course_id
  ) then
    raise exception 'Assignment problem must belong to its course';
  end if;

  return new;
end;
$$;
