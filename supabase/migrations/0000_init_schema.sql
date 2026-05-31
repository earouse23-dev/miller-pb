-- Miller Pickleball — schema bootstrap.
-- Run once in the Supabase dashboard:
--   SQL Editor → New query → paste this whole file → Run.
-- Idempotent: safe on a fresh project and safe to re-run.

create extension if not exists pgcrypto; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.players (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.tournaments (
  id            uuid primary key default gen_random_uuid(),
  invite_code   text not null unique,
  host_identity text not null,
  format        text not null,             -- 'round_robin' | 'bracket' | 'both'
  match_type    text not null,             -- 'singles' | 'doubles_fixed' | 'doubles_random'
  status        text not null default 'active', -- 'active' | 'completed'
  created_at    timestamptz not null default now(),
  completed_at  timestamptz
);

create table if not exists public.teams (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  player1_id    uuid not null references public.players(id) on delete cascade,
  player2_id    uuid references public.players(id) on delete cascade  -- null for singles
);

create table if not exists public.matches (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round_number  integer not null,
  court_number  integer,                   -- 1 or 2 (null for byes)
  team1_id      uuid references public.teams(id) on delete cascade,
  team2_id      uuid references public.teams(id) on delete cascade,
  team1_score   integer,
  team2_score   integer,
  is_bye        boolean not null default false,
  status        text not null default 'pending', -- 'pending' | 'completed'
  created_at    timestamptz not null default now()
);

create table if not exists public.tournament_results (
  id             uuid primary key default gen_random_uuid(),
  tournament_id  uuid not null references public.tournaments(id) on delete cascade,
  team_id        uuid not null references public.teams(id) on delete cascade,
  wins           integer not null default 0,
  losses         integer not null default 0,
  points_for     integer not null default 0,
  points_against integer not null default 0,
  rank           integer
);

-- Reconcile columns if an older version of a table already existed.
alter table public.matches add column if not exists court_number integer;
alter table public.tournaments add column if not exists completed_at timestamptz;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists teams_tournament_id_idx              on public.teams(tournament_id);
create index if not exists matches_tournament_id_idx            on public.matches(tournament_id);
create index if not exists tournament_results_tournament_id_idx on public.tournament_results(tournament_id);
create index if not exists tournaments_invite_code_idx          on public.tournaments(invite_code);

-- ---------------------------------------------------------------------------
-- Access: no login. Anyone with the invite code / device gets full access.
-- Enable RLS and allow anonymous full access on every table.
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;

alter table public.players            enable row level security;
alter table public.tournaments        enable row level security;
alter table public.teams              enable row level security;
alter table public.matches            enable row level security;
alter table public.tournament_results enable row level security;

do $$
declare tname text;
begin
  foreach tname in array array[
    'players','tournaments','teams','matches','tournament_results'
  ] loop
    execute format('drop policy if exists anon_all on public.%I', tname);
    execute format(
      'create policy anon_all on public.%I for all to anon, authenticated using (true) with check (true)',
      tname
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Realtime: the tournament page subscribes to live changes.
-- replica identity full so UPDATE/DELETE events carry the full row.
-- ---------------------------------------------------------------------------
alter table public.matches     replica identity full;
alter table public.tournaments replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'matches'
  ) then
    alter publication supabase_realtime add table public.matches;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tournaments'
  ) then
    alter publication supabase_realtime add table public.tournaments;
  end if;
end $$;
