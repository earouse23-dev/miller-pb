// Schedule generation + standings math for Miller Pickleball.
//
// Round robin: every team plays every other team exactly once (circle method),
// matches distributed across Court 1 / Court 2, byes rotated fairly for an odd
// number of teams.
//
// Bracket: standard single elimination. Non-power-of-2 fields get byes at the
// top seeds; the full bracket (all rounds) is generated up front and winners
// advance into later-round slots as scores come in.

import type { Match, Player, StandingRow, Team, TeamWithPlayers } from './types';
import { resolveTeam, teamLabel } from './utils';

/** Bracket rounds are offset so they never collide with round-robin round
 *  numbers in the "both" format. round_number >= BRACKET_BASE => bracket. */
export const BRACKET_BASE = 1000;

export function isBracketRound(roundNumber: number): boolean {
  return roundNumber >= BRACKET_BASE;
}

/** A schedule row before it gets a tournament_id / persisted id. */
export interface GeneratedMatch {
  round_number: number;
  court_number: number | null;
  team1_id: string | null;
  team2_id: string | null;
  is_bye: boolean;
  status: 'pending' | 'completed';
  /** Global ordering used to set created_at so DB order is deterministic. */
  order: number;
}

// ---------------------------------------------------------------------------
// Round robin (circle method)
// ---------------------------------------------------------------------------
const BYE = '__BYE__';

export function generateRoundRobin(teamIds: string[]): GeneratedMatch[] {
  const teams = [...teamIds];
  if (teams.length < 2) return [];

  // Pad with a sentinel for an odd count so every round has a clean pairing.
  if (teams.length % 2 === 1) teams.push(BYE);

  const n = teams.length;
  const rounds = n - 1;
  const half = n / 2;
  const out: GeneratedMatch[] = [];
  let order = 0;

  let arr = [...teams];
  for (let r = 0; r < rounds; r++) {
    let courtToggle = 0;
    for (let i = 0; i < half; i++) {
      const t1 = arr[i];
      const t2 = arr[n - 1 - i];

      if (t1 === BYE || t2 === BYE) {
        const real = t1 === BYE ? t2 : t1;
        out.push({
          round_number: r + 1,
          court_number: null,
          team1_id: real,
          team2_id: null,
          is_bye: true,
          status: 'completed',
          order: order++,
        });
      } else {
        out.push({
          round_number: r + 1,
          court_number: (courtToggle % 2) + 1,
          team1_id: t1,
          team2_id: t2,
          is_bye: false,
          status: 'pending',
          order: order++,
        });
        courtToggle++;
      }
    }
    // Rotate: fix arr[0], move the last element to the front of the rest.
    arr = [arr[0], arr[n - 1], ...arr.slice(1, n - 1)];
  }

  return out;
}

// ---------------------------------------------------------------------------
// Bracket (single elimination)
// ---------------------------------------------------------------------------
function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

/** Standard bracket seeding order for a bracket of `size` (power of 2).
 *  Returns 1-indexed seed numbers so that 1 plays the weakest, etc. */
export function seedOrder(size: number): number[] {
  let seeds = [1, 2];
  while (seeds.length < size) {
    const sum = seeds.length * 2 + 1;
    const next: number[] = [];
    for (const s of seeds) {
      next.push(s);
      next.push(sum - s);
    }
    seeds = next;
  }
  return seeds;
}

/** Build the full bracket. `seeds` is the team id list already in seed order
 *  (index 0 = top seed). Round 1 byes are pre-advanced into round 2. */
export function generateBracket(seeds: string[]): GeneratedMatch[] {
  const n = seeds.length;
  if (n < 2) return [];

  const size = nextPow2(n);
  const rounds = Math.log2(size);
  const order = seedOrder(size);
  const seedTeam = (seedNum: number): string | null => (seedNum <= n ? seeds[seedNum - 1] : null);

  // matchesByRound[r][m] = { t1, t2 } — round 0 is round 1.
  const matchesByRound: Array<Array<{ t1: string | null; t2: string | null }>> = [];

  const r1: Array<{ t1: string | null; t2: string | null }> = [];
  for (let i = 0; i < size; i += 2) {
    r1.push({ t1: seedTeam(order[i]), t2: seedTeam(order[i + 1]) });
  }
  matchesByRound.push(r1);
  for (let r = 1; r < rounds; r++) {
    const count = size >> (r + 1);
    matchesByRound.push(Array.from({ length: count }, () => ({ t1: null as string | null, t2: null as string | null })));
  }

  // Pre-advance round-1 byes (a slot is null only because that seed is absent).
  if (rounds >= 2) {
    r1.forEach((m, idx) => {
      const lone = m.t1 && !m.t2 ? m.t1 : !m.t1 && m.t2 ? m.t2 : null;
      if (lone) {
        const parent = matchesByRound[1][idx >> 1];
        if (idx % 2 === 0) parent.t1 = lone;
        else parent.t2 = lone;
      }
    });
  }

  const out: GeneratedMatch[] = [];
  let globalOrder = 0;
  matchesByRound.forEach((roundMatches, r) => {
    let courtToggle = 0;
    roundMatches.forEach((m) => {
      const isByeMatch = r === 0 && ((!!m.t1 && !m.t2) || (!m.t1 && !!m.t2));
      let court: number | null = null;
      if (!isByeMatch) {
        court = (courtToggle % 2) + 1;
        courtToggle++;
      }
      out.push({
        round_number: BRACKET_BASE + r + 1,
        court_number: court,
        team1_id: m.t1,
        team2_id: m.t2,
        is_bye: isByeMatch,
        status: isByeMatch ? 'completed' : 'pending',
        order: globalOrder++,
      });
    });
  });

  return out;
}

/** Given all bracket matches and a just-completed one, find where the winner
 *  advances. Returns null for the final. Matches are ordered within a round by
 *  created_at then id (insertion order), matching how they were generated. */
export function nextBracketSlot(
  bracketMatches: Match[],
  completed: Match,
  winnerTeamId: string,
): { targetId: string; slot: 'team1_id' | 'team2_id'; winnerTeamId: string } | null {
  const round = completed.round_number;
  const sortRound = (rn: number) =>
    bracketMatches
      .filter((m) => m.round_number === rn)
      .sort((a, b) => {
        const t = a.created_at.localeCompare(b.created_at);
        return t !== 0 ? t : a.id.localeCompare(b.id);
      });

  const thisRound = sortRound(round);
  const idx = thisRound.findIndex((m) => m.id === completed.id);
  if (idx < 0) return null;

  const nextRound = sortRound(round + 1);
  if (nextRound.length === 0) return null; // this was the final

  const target = nextRound[idx >> 1];
  if (!target) return null;
  return {
    targetId: target.id,
    slot: idx % 2 === 0 ? 'team1_id' : 'team2_id',
    winnerTeamId,
  };
}

// ---------------------------------------------------------------------------
// Standings
// ---------------------------------------------------------------------------
export function computeStandings(
  teams: Team[],
  matches: Match[],
  players: Map<string, Player>,
): StandingRow[] {
  const resolved = new Map<string, TeamWithPlayers>();
  for (const t of teams) resolved.set(t.id, resolveTeam(t, players));

  const acc = new Map<string, Omit<StandingRow, 'rank' | 'label' | 'diff'>>();
  for (const t of teams) {
    acc.set(t.id, { team_id: t.id, wins: 0, losses: 0, points_for: 0, points_against: 0 });
  }

  for (const m of matches) {
    if (m.is_bye || m.status !== 'completed') continue;
    if (!m.team1_id || !m.team2_id) continue;
    if (m.team1_score == null || m.team2_score == null) continue;

    const a = acc.get(m.team1_id);
    const b = acc.get(m.team2_id);
    if (!a || !b) continue;

    a.points_for += m.team1_score;
    a.points_against += m.team2_score;
    b.points_for += m.team2_score;
    b.points_against += m.team1_score;

    if (m.team1_score > m.team2_score) {
      a.wins += 1;
      b.losses += 1;
    } else if (m.team2_score > m.team1_score) {
      b.wins += 1;
      a.losses += 1;
    }
  }

  const rows: StandingRow[] = [...acc.values()].map((r) => ({
    ...r,
    label: teamLabel(resolved.get(r.team_id)),
    diff: r.points_for - r.points_against,
    rank: 0,
  }));

  rows.sort(
    (x, y) =>
      y.wins - x.wins ||
      y.diff - x.diff ||
      y.points_for - x.points_for ||
      x.label.localeCompare(y.label),
  );
  rows.forEach((r, i) => (r.rank = i + 1));

  return rows;
}
