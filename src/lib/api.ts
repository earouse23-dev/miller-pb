// Database operations for Miller Pickleball, built on the Supabase client.

import { supabase } from './supabase';
import {
  BRACKET_BASE,
  computeStandings,
  findChampion,
  generateBracket,
  generateRoundRobin,
  isBracketRound,
  matchWinnerSide,
  nextBracketSlot,
  summarizeGames,
  type GeneratedMatch,
} from './tournament-logic';
import type {
  GameFormat,
  GameScore,
  LeaderboardRow,
  LifetimeStats,
  Match,
  MatchType,
  Player,
  Team,
  Tournament,
  TournamentFormat,
} from './types';
import { generateInviteCode } from './utils';

export interface CreateTournamentParams {
  format: TournamentFormat;
  matchType: MatchType;
  hostIdentity: string;
  /** Each team is one player (singles) or two players (doubles). */
  teams: Array<[string] | [string, string]>;
  /** Points each game is played to (11 | 15 | 21). */
  scoreTarget: number;
  /** Game format for the round-robin phase (null when there is none). */
  rrFormat: GameFormat | null;
  /** Game format for the bracket phase (null when there is none). */
  bracketFormat: GameFormat | null;
}

function throwOn<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  if (res.data == null) throw new Error('No data returned from Supabase.');
  return res.data;
}

async function uniqueInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const code = generateInviteCode(6);
    const { data, error } = await supabase
      .from('tournaments')
      .select('id')
      .eq('invite_code', code)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return code;
  }
  throw new Error('Could not generate a unique invite code. Try again.');
}

/** Persist generated matches with deterministic created_at ordering so bracket
 *  advancement can rely on insertion order. */
async function insertMatches(tournamentId: string, generated: GeneratedMatch[]): Promise<void> {
  const base = Date.now();
  const rows = generated
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((m) => ({
      tournament_id: tournamentId,
      round_number: m.round_number,
      court_number: m.court_number,
      team1_id: m.team1_id,
      team2_id: m.team2_id,
      team1_score: null,
      team2_score: null,
      team1_games: 0,
      team2_games: 0,
      games: null,
      is_bye: m.is_bye,
      status: m.status,
      created_at: new Date(base + m.order * 5).toISOString(),
    }));
  const { error } = await supabase.from('matches').insert(rows);
  if (error) throw new Error(error.message);
}

export async function createTournament(
  params: CreateTournamentParams,
): Promise<Tournament> {
  const invite_code = await uniqueInviteCode();

  const tournament = throwOn(
    await supabase
      .from('tournaments')
      .insert({
        invite_code,
        host_identity: params.hostIdentity,
        format: params.format,
        match_type: params.matchType,
        status: 'active',
        score_target: params.scoreTarget,
        rr_format: params.rrFormat,
        bracket_format: params.bracketFormat,
      })
      .select()
      .single(),
  ) as Tournament;

  // Insert teams, preserving order (seed order for brackets).
  const teamRows = params.teams.map((t) => ({
    tournament_id: tournament.id,
    player1_id: t[0],
    player2_id: t.length > 1 ? t[1] : null,
  }));
  const insertedTeams = throwOn(
    await supabase.from('teams').insert(teamRows).select(),
  ) as Team[];

  // Map back to creation order (Supabase preserves insert order in returned rows,
  // but be safe: align by player signature).
  const teamIds = orderTeamIds(params.teams, insertedTeams);

  // Generate matches. For "both" the bracket is generated later, once the round
  // robin completes (seeded by standings).
  const generated =
    params.format === 'bracket'
      ? generateBracket(teamIds)
      : generateRoundRobin(teamIds);

  await insertMatches(tournament.id, generated);

  return tournament;
}

/** Align inserted team ids back to the original team ordering. */
function orderTeamIds(
  original: Array<[string] | [string, string]>,
  inserted: Team[],
): string[] {
  const used = new Set<string>();
  return original.map((t) => {
    const p1 = t[0];
    const p2 = t.length > 1 ? t[1] : null;
    const match = inserted.find(
      (it) =>
        !used.has(it.id) &&
        it.player1_id === p1 &&
        (it.player2_id ?? null) === (p2 ?? null),
    );
    if (match) {
      used.add(match.id);
      return match.id;
    }
    // Fallback: first unused.
    const fallback = inserted.find((it) => !used.has(it.id));
    if (fallback) {
      used.add(fallback.id);
      return fallback.id;
    }
    throw new Error('Team insert/order mismatch.');
  });
}

// ---------------------------------------------------------------------------
// Players
// ---------------------------------------------------------------------------
export async function fetchPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addPlayer(name: string): Promise<Player> {
  const trimmed = name.trim();
  // Reuse an existing player with the same name (names are unique).
  const existing = await supabase
    .from('players')
    .select('*')
    .ilike('name', trimmed)
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return existing.data;

  return throwOn(
    await supabase.from('players').insert({ name: trimmed }).select().single(),
  ) as Player;
}

// ---------------------------------------------------------------------------
// Tournament loading
// ---------------------------------------------------------------------------
export interface TournamentBundle {
  tournament: Tournament;
  teams: Team[];
  matches: Match[];
  players: Player[];
}

export async function fetchTournamentById(id: string): Promise<Tournament | null> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchTournamentByCode(code: string): Promise<Tournament | null> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('invite_code', code.toUpperCase())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchBundle(tournamentId: string): Promise<TournamentBundle> {
  const tournament = await fetchTournamentById(tournamentId);
  if (!tournament) throw new Error('Tournament not found.');

  const [teamsRes, matchesRes] = await Promise.all([
    supabase.from('teams').select('*').eq('tournament_id', tournamentId),
    supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('round_number', { ascending: true })
      .order('created_at', { ascending: true }),
  ]);
  if (teamsRes.error) throw new Error(teamsRes.error.message);
  if (matchesRes.error) throw new Error(matchesRes.error.message);

  const teams = teamsRes.data ?? [];
  const matches = matchesRes.data ?? [];

  // Fetch the players referenced by these teams.
  const playerIds = new Set<string>();
  for (const t of teams) {
    playerIds.add(t.player1_id);
    if (t.player2_id) playerIds.add(t.player2_id);
  }
  let players: Player[] = [];
  if (playerIds.size > 0) {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .in('id', [...playerIds]);
    if (error) throw new Error(error.message);
    players = data ?? [];
  }

  return { tournament, teams, matches, players };
}

// ---------------------------------------------------------------------------
// Scoring + bracket advancement
// ---------------------------------------------------------------------------
export async function submitScore(
  match: Match,
  games: GameScore[],
  allMatches: Match[],
): Promise<void> {
  const { team1Points, team2Points, team1Games, team2Games } = summarizeGames(games);

  const { error } = await supabase
    .from('matches')
    .update({
      team1_score: team1Points,
      team2_score: team2Points,
      team1_games: team1Games,
      team2_games: team2Games,
      games,
      status: 'completed',
    })
    .eq('id', match.id);
  if (error) throw new Error(error.message);

  // Advance the winner in a bracket.
  if (isBracketRound(match.round_number) && match.team1_id && match.team2_id) {
    const completedView: Match = {
      ...match,
      team1_score: team1Points,
      team2_score: team2Points,
      team1_games: team1Games,
      team2_games: team2Games,
      games,
      status: 'completed',
    };
    const winnerSide = matchWinnerSide(completedView);
    const winnerTeamId = winnerSide === 'team2' ? match.team2_id : match.team1_id;
    const bracketMatches = allMatches.filter((m) => isBracketRound(m.round_number));
    const next = nextBracketSlot(bracketMatches, completedView, winnerTeamId);
    if (next) {
      const update =
        next.slot === 'team1_id'
          ? { team1_id: next.winnerTeamId }
          : { team2_id: next.winnerTeamId };
      const { error: advErr } = await supabase
        .from('matches')
        .update(update)
        .eq('id', next.targetId);
      if (advErr) throw new Error(advErr.message);
    }
  }
}

// ---------------------------------------------------------------------------
// "Both" format: generate the bracket once the round robin completes.
// ---------------------------------------------------------------------------
// In-flight guard: a second caller (React StrictMode double-effect, or a
// realtime-triggered re-render before the first insert lands) must not generate
// the bracket again — that produced a duplicated bracket. This guards the
// trigger only; the generation algorithm is unchanged.
const bracketGenerationInFlight = new Set<string>();

export async function generateSeededBracket(
  bundle: TournamentBundle,
): Promise<void> {
  const { tournament, teams, matches, players } = bundle;
  if (tournament.format !== 'both') return;

  // Already generated, or generation already running for this tournament?
  if (matches.some((m) => isBracketRound(m.round_number))) return;
  if (bracketGenerationInFlight.has(tournament.id)) return;

  // All round-robin matches complete?
  const rr = matches.filter((m) => !isBracketRound(m.round_number));
  if (rr.length === 0 || rr.some((m) => m.status !== 'completed')) return;

  bracketGenerationInFlight.add(tournament.id);
  try {
    const playerMap = new Map(players.map((p) => [p.id, p]));
    const standings = computeStandings(teams, matches, playerMap);
    const seededTeamIds = standings.map((s) => s.team_id);

    const generated = generateBracket(seededTeamIds);
    await insertMatches(tournament.id, generated);
  } finally {
    bracketGenerationInFlight.delete(tournament.id);
  }
}

export const BRACKET_ROUND_BASE = BRACKET_BASE;

// ---------------------------------------------------------------------------
// Save results — final standings (+ tournament_wins) and lifetime stats.
// Idempotent w.r.t. lifetime stats via tournaments.stats_saved so re-saving or
// ending later never double-counts a player's career totals.
// ---------------------------------------------------------------------------
export async function saveTournamentResults(bundle: TournamentBundle): Promise<void> {
  const { tournament, teams, matches, players } = bundle;
  const playerMap = new Map(players.map((p) => [p.id, p]));
  const standings = computeStandings(teams, matches, playerMap);
  const champion = findChampion(teams, matches, playerMap);

  // Rewrite this tournament's results (delete + insert keeps it a clean snapshot).
  await supabase.from('tournament_results').delete().eq('tournament_id', tournament.id);
  if (standings.length > 0) {
    const rows = standings.map((s) => ({
      tournament_id: tournament.id,
      team_id: s.team_id,
      wins: s.wins,
      losses: s.losses,
      points_for: s.points_for,
      points_against: s.points_against,
      rank: s.rank,
      tournament_wins: champion && s.team_id === champion.teamId ? 1 : 0,
    }));
    const { error } = await supabase.from('tournament_results').insert(rows);
    if (error) throw new Error(error.message);
  }

  // Accumulate lifetime stats exactly once per tournament.
  if (!tournament.stats_saved) {
    await applyLifetimeStats(bundle, champion?.teamId ?? null);
    const { error } = await supabase
      .from('tournaments')
      .update({ stats_saved: true })
      .eq('id', tournament.id);
    if (error) throw new Error(error.message);
  }
}

/** Add this tournament's per-player contribution to lifetime_stats. */
async function applyLifetimeStats(
  bundle: TournamentBundle,
  championTeamId: string | null,
): Promise<void> {
  const { teams, matches, players } = bundle;
  const playerMap = new Map(players.map((p) => [p.id, p]));
  const standings = computeStandings(teams, matches, playerMap);
  const standingByTeam = new Map(standings.map((s) => [s.team_id, s]));

  type Delta = {
    total_wins: number;
    total_losses: number;
    total_points_for: number;
    total_points_against: number;
    tournament_wins: number;
    tournaments_played: number;
  };
  const deltas = new Map<string, Delta>();
  const bump = (pid: string): Delta => {
    let d = deltas.get(pid);
    if (!d) {
      d = {
        total_wins: 0,
        total_losses: 0,
        total_points_for: 0,
        total_points_against: 0,
        tournament_wins: 0,
        tournaments_played: 0,
      };
      deltas.set(pid, d);
    }
    return d;
  };

  for (const team of teams) {
    const s = standingByTeam.get(team.id);
    if (!s) continue;
    const isChamp = championTeamId != null && team.id === championTeamId;
    const teamPlayerIds = [team.player1_id, team.player2_id].filter(Boolean) as string[];
    for (const pid of teamPlayerIds) {
      const d = bump(pid);
      d.total_wins += s.wins;
      d.total_losses += s.losses;
      d.total_points_for += s.points_for;
      d.total_points_against += s.points_against;
      d.tournaments_played += 1;
      if (isChamp) d.tournament_wins += 1;
    }
  }

  const ids = [...deltas.keys()];
  if (ids.length === 0) return;

  const { data: existingRows, error: fetchErr } = await supabase
    .from('lifetime_stats')
    .select('*')
    .in('player_id', ids);
  if (fetchErr) throw new Error(fetchErr.message);
  const existing = new Map((existingRows ?? []).map((r) => [r.player_id, r]));

  const upserts = ids.map((pid) => {
    const d = deltas.get(pid)!;
    const prev = existing.get(pid);
    return {
      player_id: pid,
      total_wins: (prev?.total_wins ?? 0) + d.total_wins,
      total_losses: (prev?.total_losses ?? 0) + d.total_losses,
      total_points_for: (prev?.total_points_for ?? 0) + d.total_points_for,
      total_points_against: (prev?.total_points_against ?? 0) + d.total_points_against,
      tournament_wins: (prev?.tournament_wins ?? 0) + d.tournament_wins,
      tournaments_played: (prev?.tournaments_played ?? 0) + d.tournaments_played,
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase.from('lifetime_stats').upsert(upserts, { onConflict: 'player_id' });
  if (error) throw new Error(error.message);
}

/** Flip the tournament to completed — broadcasts the end to all devices. */
export async function completeTournament(tournamentId: string): Promise<void> {
  const { error } = await supabase
    .from('tournaments')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', tournamentId);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// End tournament — save results + lifetime stats, then mark completed.
// Used by the host's manual "End tournament" button.
// ---------------------------------------------------------------------------
export async function endTournament(bundle: TournamentBundle): Promise<void> {
  await saveTournamentResults(bundle);
  await completeTournament(bundle.tournament.id);
}

// ---------------------------------------------------------------------------
// Lifetime stats reads — player profile + leaderboard.
// ---------------------------------------------------------------------------
export async function fetchLifetimeStats(playerId: string): Promise<LifetimeStats | null> {
  const { data, error } = await supabase
    .from('lifetime_stats')
    .select('*')
    .eq('player_id', playerId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchLeaderboard(): Promise<LeaderboardRow[]> {
  const { data: stats, error } = await supabase.from('lifetime_stats').select('*');
  if (error) throw new Error(error.message);
  const rows = stats ?? [];
  if (rows.length === 0) return [];

  const { data: playerRows, error: pErr } = await supabase
    .from('players')
    .select('*')
    .in('id', rows.map((r) => r.player_id));
  if (pErr) throw new Error(pErr.message);
  const names = new Map((playerRows ?? []).map((p) => [p.id, p.name]));

  const out: LeaderboardRow[] = rows.map((r) => ({ ...r, name: names.get(r.player_id) ?? 'Unknown' }));
  out.sort(
    (a, b) =>
      b.tournament_wins - a.tournament_wins ||
      b.total_wins - a.total_wins ||
      a.name.localeCompare(b.name),
  );
  return out;
}
