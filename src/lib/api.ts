// Database operations for Miller Pickleball, built on the Supabase client.

import { supabase } from './supabase';
import {
  BRACKET_BASE,
  computeStandings,
  generateBracket,
  generateRoundRobin,
  isBracketRound,
  nextBracketSlot,
  type GeneratedMatch,
} from './tournament-logic';
import type {
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
  team1Score: number,
  team2Score: number,
  allMatches: Match[],
): Promise<void> {
  const { error } = await supabase
    .from('matches')
    .update({ team1_score: team1Score, team2_score: team2Score, status: 'completed' })
    .eq('id', match.id);
  if (error) throw new Error(error.message);

  // Advance the winner in a bracket.
  if (isBracketRound(match.round_number) && match.team1_id && match.team2_id) {
    const winnerTeamId = team1Score > team2Score ? match.team1_id : match.team2_id;
    const bracketMatches = allMatches.filter((m) => isBracketRound(m.round_number));
    const completedView: Match = {
      ...match,
      team1_score: team1Score,
      team2_score: team2Score,
      status: 'completed',
    };
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
export async function generateSeededBracket(
  bundle: TournamentBundle,
): Promise<void> {
  const { tournament, teams, matches, players } = bundle;
  if (tournament.format !== 'both') return;

  // Already generated?
  if (matches.some((m) => isBracketRound(m.round_number))) return;

  // All round-robin matches complete?
  const rr = matches.filter((m) => !isBracketRound(m.round_number));
  if (rr.length === 0 || rr.some((m) => m.status !== 'completed')) return;

  const playerMap = new Map(players.map((p) => [p.id, p]));
  const standings = computeStandings(teams, matches, playerMap);
  const seededTeamIds = standings.map((s) => s.team_id);

  const generated = generateBracket(seededTeamIds);
  await insertMatches(tournament.id, generated);
}

export const BRACKET_ROUND_BASE = BRACKET_BASE;

// ---------------------------------------------------------------------------
// End tournament — persist final standings + mark completed.
// ---------------------------------------------------------------------------
export async function endTournament(bundle: TournamentBundle): Promise<void> {
  const { tournament, teams, matches, players } = bundle;
  const playerMap = new Map(players.map((p) => [p.id, p]));
  const standings = computeStandings(teams, matches, playerMap);

  // Clear any prior results, then write fresh ones.
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
    }));
    const { error } = await supabase.from('tournament_results').insert(rows);
    if (error) throw new Error(error.message);
  }

  const { error } = await supabase
    .from('tournaments')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', tournament.id);
  if (error) throw new Error(error.message);
}
