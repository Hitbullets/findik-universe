-- Fındık Universe beta: local-first client can sync only after explicit magic-link sign in.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  version integer not null default 2,
  xp integer not null default 0 check (xp >= 0),
  completed jsonb not null default '[]'::jsonb,
  boops integer not null default 0 check (boops >= 0),
  wardrobe jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.memories (
  user_id uuid not null references auth.users(id) on delete cascade,
  adventure_id text not null check (adventure_id in ('tram','bike','cafe','park','night')),
  completed_at timestamptz not null default now(),
  caption text not null check (char_length(caption) <= 280),
  primary key (user_id, adventure_id)
);

create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  user_id uuid default auth.uid() references auth.users(id) on delete set null,
  body text not null check (char_length(body) between 1 and 500),
  rating smallint check (rating between 1 and 5),
  app_version text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.progress enable row level security;
alter table public.memories enable row level security;
alter table public.feedback enable row level security;

create policy "profiles are private" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "progress is private" on public.progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "memories are private" on public.memories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "signed-in users can send feedback" on public.feedback for insert to authenticated with check (auth.uid() = user_id);
create policy "users can read their own feedback" on public.feedback for select to authenticated using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
