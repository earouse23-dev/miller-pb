// Standalone verification of the schedule generators. Run via esbuild bundle.
import {
  generateRoundRobin,
  generateBracket,
  isBracketRound,
  computeStandings,
  findChampion,
  finalBracketMatch,
  allMatchesComplete,
  BRACKET_BASE,
} from '../src/lib/tournament-logic';
import type { Match, Player, Team } from '../src/lib/types';

let failures = 0;
function check(name: string, cond: boolean, detail = '') {
  if (!cond) {
    failures++;
    console.log(`  ❌ ${name} ${detail}`);
  } else {
    console.log(`  ✅ ${name}`);
  }
}

function teamIds(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `T${i + 1}`);
}

function expectedRRGames(n: number): number {
  return (n * (n - 1)) / 2;
}

// ---- Round robin -----------------------------------------------------------
for (const n of [4, 6, 8, 5, 7]) {
  console.log(`\nRound robin · ${n} teams`);
  const ids = teamIds(n);
  const matches = generateRoundRobin(ids);
  const real = matches.filter((m) => !m.is_bye);
  const byes = matches.filter((m) => m.is_bye);

  check('correct number of real games', real.length === expectedRRGames(n), `got ${real.length}, want ${expectedRRGames(n)}`);

  // Every pair exactly once.
  const seen = new Map<string, number>();
  for (const m of real) {
    const key = [m.team1_id, m.team2_id].sort().join('|');
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  const allOnce = [...seen.values()].every((c) => c === 1);
  check('every pair plays exactly once', allOnce && seen.size === expectedRRGames(n));

  // Rounds = n-1 (even) or n (odd).
  const rounds = new Set(matches.map((m) => m.round_number));
  const expectedRounds = n % 2 === 0 ? n - 1 : n;
  check('round count', rounds.size === expectedRounds, `got ${rounds.size}, want ${expectedRounds}`);

  // Byes: odd => one bye per round; even => none.
  if (n % 2 === 1) {
    check('one bye per round', byes.length === n, `got ${byes.length}`);
    // Each team gets exactly one bye.
    const byeCounts = new Map<string, number>();
    for (const b of byes) byeCounts.set(b.team1_id!, (byeCounts.get(b.team1_id!) ?? 0) + 1);
    check('byes spread fairly (1 each)', ids.every((id) => byeCounts.get(id) === 1));
  } else {
    check('no byes for even count', byes.length === 0);
  }

  // Courts: within a round, real matches alternate 1/2 and only use 1 or 2.
  const courtsValid = real.every((m) => m.court_number === 1 || m.court_number === 2);
  check('courts are 1 or 2', courtsValid);

  // No team plays twice in the same round.
  let dupInRound = false;
  for (const r of rounds) {
    const inRound = real.filter((m) => m.round_number === r);
    const players: string[] = [];
    for (const m of inRound) {
      players.push(m.team1_id!, m.team2_id!);
    }
    if (new Set(players).size !== players.length) dupInRound = true;
  }
  check('no team plays twice in a round', !dupInRound);
}

// ---- Bracket ---------------------------------------------------------------
for (const n of [4, 6, 8, 5, 3]) {
  console.log(`\nBracket · ${n} teams`);
  const ids = teamIds(n);
  const matches = generateBracket(ids);

  check('all rounds are bracket rounds', matches.every((m) => isBracketRound(m.round_number)));

  const rounds = [...new Set(matches.map((m) => m.round_number))].sort((a, b) => a - b);
  const expectedRounds = Math.ceil(Math.log2(n));
  check('bracket round count', rounds.length === expectedRounds, `got ${rounds.length}, want ${expectedRounds}`);

  // Round 1 should cover the field: real matches*2 + byes == n.
  const r1 = matches.filter((m) => m.round_number === rounds[0]);
  const r1real = r1.filter((m) => !m.is_bye);
  const r1byes = r1.filter((m) => m.is_bye);
  const covered = r1real.length * 2 + r1byes.length;
  check('round 1 covers all teams', covered === n, `covered ${covered}`);

  // Final round has exactly one match.
  const finalRound = matches.filter((m) => m.round_number === rounds[rounds.length - 1]);
  check('exactly one final', finalRound.length === 1, `got ${finalRound.length}`);

  // Top seed gets a bye when not power of two (n not 2^k).
  const isPow2 = (n & (n - 1)) === 0;
  if (!isPow2) {
    check('byes exist for non-power-of-2', r1byes.length === (1 << expectedRounds) - n, `byes ${r1byes.length}`);
  } else {
    check('no byes for power-of-2', r1byes.length === 0);
  }
}

// ---- Standings -------------------------------------------------------------
console.log('\nStandings');
{
  const players: Player[] = [
    { id: 'p1', name: 'Alice', created_at: '' },
    { id: 'p2', name: 'Bob', created_at: '' },
    { id: 'p3', name: 'Cara', created_at: '' },
  ];
  const teams: Team[] = [
    { id: 'A', tournament_id: 't', player1_id: 'p1', player2_id: null },
    { id: 'B', tournament_id: 't', player1_id: 'p2', player2_id: null },
    { id: 'C', tournament_id: 't', player1_id: 'p3', player2_id: null },
  ];
  const mk = (id: string, t1: string, t2: string, s1: number, s2: number): Match => ({
    id,
    tournament_id: 't',
    round_number: 1,
    court_number: 1,
    team1_id: t1,
    team2_id: t2,
    team1_score: s1,
    team2_score: s2,
    is_bye: false,
    status: 'completed',
    created_at: '',
  });
  // A beats B 11-5, A beats C 11-7, B beats C 11-9
  const matches = [mk('m1', 'A', 'B', 11, 5), mk('m2', 'A', 'C', 11, 7), mk('m3', 'B', 'C', 11, 9)];
  const pm = new Map(players.map((p) => [p.id, p]));
  const standings = computeStandings(teams, matches, pm);

  check('A is rank 1', standings[0].team_id === 'A' && standings[0].rank === 1);
  check('A has 2 wins', standings.find((s) => s.team_id === 'A')!.wins === 2);
  check('A diff = +10', standings.find((s) => s.team_id === 'A')!.diff === 10, `diff ${standings.find((s) => s.team_id === 'A')!.diff}`);
  check('C is last', standings[2].team_id === 'C');
  check('B beats C on H2H/record', standings[1].team_id === 'B');
}

// ---- Champion detection ----------------------------------------------------
console.log('\nChampion detection');
{
  const players: Player[] = [
    { id: 'p1', name: 'Alice', created_at: '' },
    { id: 'p2', name: 'Bob', created_at: '' },
    { id: 'p3', name: 'Cara', created_at: '' },
    { id: 'p4', name: 'Dan', created_at: '' },
  ];
  const teams: Team[] = players.map((p) => ({
    id: p.id.replace('p', 'T'),
    tournament_id: 't',
    player1_id: p.id,
    player2_id: null,
  }));
  const pm = new Map(players.map((p) => [p.id, p]));

  const mk = (
    id: string,
    round: number,
    t1: string | null,
    t2: string | null,
    s1: number | null,
    s2: number | null,
  ): Match => ({
    id,
    tournament_id: 't',
    round_number: round,
    court_number: 1,
    team1_id: t1,
    team2_id: t2,
    team1_score: s1,
    team2_score: s2,
    is_bye: false,
    status: s1 != null && s2 != null ? 'completed' : 'pending',
    created_at: id,
  });

  // All 6 round-robin match rows exist; champion only once every one is scored.
  const rrAll = (lastScored: boolean): Match[] => [
    mk('a', 1, 'T1', 'T2', 11, 4),
    mk('b', 1, 'T3', 'T4', 11, 9),
    mk('c', 2, 'T1', 'T3', 11, 7),
    mk('d', 2, 'T2', 'T4', 5, 11),
    mk('e', 3, 'T1', 'T4', 11, 8),
    mk('f', 3, 'T2', 'T3', lastScored ? 11 : null, lastScored ? 6 : null),
  ];
  check('RR champion null while a match is unscored', findChampion(teams, rrAll(false), pm) === null);
  const rrChamp = findChampion(teams, rrAll(true), pm);
  check('RR champion = T1 (Alice)', rrChamp?.teamId === 'T1' && rrChamp?.label === 'Alice', JSON.stringify(rrChamp));

  // Bracket: two semis + final. Champion only once final is scored.
  const semi1 = mk('s1', BRACKET_BASE + 1, 'T1', 'T4', 11, 6);
  const semi2 = mk('s2', BRACKET_BASE + 1, 'T2', 'T3', 8, 11);
  const finalPending = mk('fin', BRACKET_BASE + 2, 'T1', 'T3', null, null);
  const bracketMid = [semi1, semi2, finalPending];
  check('bracket champion null before final', findChampion(teams, bracketMid, pm) === null);
  check('finalBracketMatch picks the final', finalBracketMatch(bracketMid)?.id === 'fin');

  const finalDone = mk('fin', BRACKET_BASE + 2, 'T1', 'T3', 9, 11);
  const bracketDone = [semi1, semi2, finalDone];
  const bChamp = findChampion(teams, bracketDone, pm);
  check('bracket champion = T3 (Cara)', bChamp?.teamId === 'T3' && bChamp?.label === 'Cara', JSON.stringify(bChamp));
  check('allMatchesComplete true when scored', allMatchesComplete(bracketDone));
}

console.log(`\n${failures === 0 ? '🎉 ALL PASSED' : `💥 ${failures} FAILURES`}`);
process.exit(failures === 0 ? 0 : 1);
