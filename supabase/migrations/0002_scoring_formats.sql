-- Miller Pickleball — scoring formats (play-to target + best-of per phase).
-- Run once in the Supabase dashboard:
--   SQL Editor → New query → paste this whole file → Run.
-- Idempotent: safe to re-run.

-- Tournament-level scoring config.
alter table public.tournaments add column if not exists score_target   integer; -- 11 | 15 | 21
alter table public.tournaments add column if not exists rr_format      text;    -- 'single' | 'best_of_3' | 'best_of_5'
alter table public.tournaments add column if not exists bracket_format text;    -- 'single' | 'best_of_3' | 'best_of_5'

-- Per-match results for best-of play.
-- team1_score / team2_score keep their meaning: TOTAL points across games (PF).
-- team1_games / team2_games hold games won — the match winner is the majority.
-- games holds the per-game detail so the score sheet can be re-opened/edited.
alter table public.matches add column if not exists team1_games integer not null default 0;
alter table public.matches add column if not exists team2_games integer not null default 0;
alter table public.matches add column if not exists games       jsonb;

notify pgrst, 'reload schema';
