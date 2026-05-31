-- Miller Pickleball — lifetime stats + tournament-win tracking (Round 2).
-- Run once in the Supabase dashboard SQL Editor. Idempotent.

-- Champion + idempotency tracking on existing tables.
alter table public.tournaments
  add column if not exists stats_saved boolean not null default false;

alter table public.tournament_results
  add column if not exists tournament_wins integer not null default 0;

-- Per-player lifetime aggregates, accumulated when a tournament is saved.
create table if not exists public.lifetime_stats (
  player_id            uuid primary key references public.players(id) on delete cascade,
  total_wins           integer not null default 0,
  total_losses         integer not null default 0,
  total_points_for     integer not null default 0,
  total_points_against integer not null default 0,
  tournament_wins      integer not null default 0,
  tournaments_played   integer not null default 0,
  updated_at           timestamptz not null default now()
);

notify pgrst, 'reload schema';

-- Access: same anonymous full-access model as the rest of the app.
grant all on public.lifetime_stats to anon, authenticated;
alter table public.lifetime_stats enable row level security;

drop policy if exists anon_all on public.lifetime_stats;
create policy anon_all on public.lifetime_stats
  for all to anon, authenticated using (true) with check (true);
