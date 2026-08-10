-- v3 cloud snapshot is additive; the beta v2 tables remain readable for rollback.
create table if not exists public.progress_v3 (
  user_id uuid primary key references auth.users(id) on delete cascade,
  version integer not null default 3 check (version = 3),
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.progress_v3 enable row level security;
create policy "progress v3 is private" on public.progress_v3 for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
