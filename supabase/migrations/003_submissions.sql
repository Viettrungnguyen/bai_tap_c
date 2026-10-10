-- Phase 3 (no code execution): source-file submissions and manual review.

create type public.submission_status as enum ('pending', 'correct', 'incorrect');
create type public.submission_language as enum ('c11', 'cpp17');

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  problem_id uuid not null references public.problems(id) on delete cascade,
  language public.submission_language not null,
  file_name text not null check (char_length(file_name) between 1 and 255),
  source_code text not null check (char_length(source_code) between 1 and 262144),
  status public.submission_status not null default 'pending',
  score numeric(6, 2) check (score is null or score between 0 and 100),
  review_note text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'pending' and reviewed_by is null and reviewed_at is null)
    or
    (status in ('correct', 'incorrect') and reviewed_by is not null and reviewed_at is not null)
  )
);

create index submissions_user_submitted_idx
  on public.submissions(user_id, submitted_at desc);
create index submissions_problem_submitted_idx
  on public.submissions(problem_id, submitted_at desc);
create index submissions_status_submitted_idx
  on public.submissions(status, submitted_at desc);

create trigger submissions_set_updated_at
  before update on public.submissions
  for each row execute procedure public.set_updated_at();

alter table public.submissions enable row level security;

grant select, insert, update on public.submissions to authenticated;

create policy "Users read their own submissions"
on public.submissions for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy "Users submit their own source files"
on public.submissions for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'pending'
  and score is null
  and review_note is null
  and reviewed_by is null
  and reviewed_at is null
  and exists (
    select 1 from public.problems
    where problems.id = submissions.problem_id
      and problems.status = 'published'
  )
);

create policy "Admins review submissions"
on public.submissions for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
