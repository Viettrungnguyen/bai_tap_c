-- Phase 2: problems, examples, hints and private test cases.

create type public.problem_status as enum ('draft', 'published', 'archived');
create type public.problem_difficulty as enum ('easy', 'medium', 'hard');

create table public.problems (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '',
  input_description text not null default '',
  output_description text not null default '',
  difficulty public.problem_difficulty not null default 'easy',
  time_limit_ms integer not null default 1000 check (time_limit_ms between 100 and 30000),
  memory_limit_kb integer not null default 131072 check (memory_limit_kb between 16384 and 1048576),
  allowed_languages text[] not null default array['c11', 'cpp17']::text[],
  status public.problem_status not null default 'draft',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (allowed_languages <@ array['c11', 'cpp17']::text[]),
  check (cardinality(allowed_languages) > 0)
);

create table public.problem_examples (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  input text not null default '',
  output text not null default '',
  explanation text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.problem_hints (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  content text not null check (char_length(content) > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.test_cases (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  input text not null default '',
  expected_output text not null default '',
  is_sample boolean not null default false,
  score numeric(6, 2) not null default 0 check (score >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index problems_status_created_at_idx
  on public.problems(status, created_at desc);
create index problem_examples_problem_id_idx
  on public.problem_examples(problem_id, sort_order);
create index problem_hints_problem_id_idx
  on public.problem_hints(problem_id, sort_order);
create index test_cases_problem_id_idx
  on public.test_cases(problem_id, sort_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger problems_set_updated_at
  before update on public.problems
  for each row execute procedure public.set_updated_at();

alter table public.problems enable row level security;
alter table public.problem_examples enable row level security;
alter table public.problem_hints enable row level security;
alter table public.test_cases enable row level security;

grant select, insert, update, delete on public.problems to authenticated;
grant select, insert, update, delete on public.problem_examples to authenticated;
grant select, insert, update, delete on public.problem_hints to authenticated;
grant select, insert, update, delete on public.test_cases to authenticated;

create policy "Published problems are visible to users"
on public.problems for select
to authenticated
using (status = 'published' or public.is_admin());

create policy "Admins create problems"
on public.problems for insert
to authenticated
with check (public.is_admin() and created_by = auth.uid());

create policy "Admins update problems"
on public.problems for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins delete problems"
on public.problems for delete
to authenticated
using (public.is_admin());

create policy "Examples follow problem visibility"
on public.problem_examples for select
to authenticated
using (
  exists (
    select 1 from public.problems
    where problems.id = problem_examples.problem_id
      and (problems.status = 'published' or public.is_admin())
  )
);

create policy "Admins manage examples"
on public.problem_examples for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Hints follow problem visibility"
on public.problem_hints for select
to authenticated
using (
  exists (
    select 1 from public.problems
    where problems.id = problem_hints.problem_id
      and (problems.status = 'published' or public.is_admin())
  )
);

create policy "Admins manage hints"
on public.problem_hints for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Intentionally no SELECT policy for normal users on test_cases.
create policy "Admins manage private test cases"
on public.test_cases for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
