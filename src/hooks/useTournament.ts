import { useEffect, useMemo, useRef } from 'react';
import { useTournamentStore } from '@/store/useTournamentStore';
import { useRealtime } from './useRealtime';
import { generateSeededBracket } from '@/lib/api';
import { computeStandings, isBracketRound } from '@/lib/tournament-logic';
import type { Match, Player, StandingRow, TeamWithPlayers, Tournament } from '@/lib/types';
import { getUserIdentity, resolveTeam } from '@/lib/utils';

export interface RoundGroup {
  key: string;
  roundNumber: number;
  isBracket: boolean;
  label: string;
  matches: Match[];
}

export interface UseTournamentResult {
  loading: boolean;
  error: string | null;
  tournament: Tournament | null;
  players: Map<string, Player>;
  teams: Map<string, TeamWithPlayers>;
  matches: Match[];
  rounds: RoundGroup[];
  standings: StandingRow[];
  progress: { completed: number; total: number };
  isHost: boolean;
  winnerLabel: string | null;
}

function bracketLabel(totalBracketRounds: number, indexFromStart: number): string {
  const remaining = totalBracketRounds - indexFromStart;
  if (remaining === 1) return 'FINAL';
  if (remaining === 2) return 'SEMIFINALS';
  if (remaining === 3) return 'QUARTERFINALS';
  return `BRACKET · ROUND ${indexFromStart + 1}`;
}

export function useTournament(id: string | null): UseTournamentResult {
  const { bundle, loading, error, load, reset } = useTournamentStore();
  const generatingRef = useRef(false);

  useEffect(() => {
    if (id) load(id);
    return () => reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useRealtime(id);

  const identity = getUserIdentity();

  const players = useMemo(() => {
    const map = new Map<string, Player>();
    bundle?.players.forEach((p) => map.set(p.id, p));
    return map;
  }, [bundle?.players]);

  const teams = useMemo(() => {
    const map = new Map<string, TeamWithPlayers>();
    bundle?.teams.forEach((t) => map.set(t.id, resolveTeam(t, players)));
    return map;
  }, [bundle?.teams, players]);

  const matches = bundle?.matches ?? [];

  const standings = useMemo(
    () => (bundle ? computeStandings(bundle.teams, bundle.matches, players) : []),
    [bundle, players],
  );

  const rounds = useMemo<RoundGroup[]>(() => {
    if (!bundle) return [];
    const byRound = new Map<number, Match[]>();
    for (const m of bundle.matches) {
      const arr = byRound.get(m.round_number) ?? [];
      arr.push(m);
      byRound.set(m.round_number, arr);
    }
    const roundNumbers = [...byRound.keys()].sort((a, b) => a - b);
    const bracketRounds = roundNumbers.filter(isBracketRound);

    return roundNumbers.map((rn) => {
      const isBracket = isBracketRound(rn);
      const ms = (byRound.get(rn) ?? []).sort((a, b) => a.created_at.localeCompare(b.created_at));
      let label: string;
      if (isBracket) {
        const idxFromStart = bracketRounds.indexOf(rn);
        label = bracketLabel(bracketRounds.length, idxFromStart);
      } else {
        label = `ROUND ${rn}`;
      }
      return { key: `r-${rn}`, roundNumber: rn, isBracket, label, matches: ms };
    });
  }, [bundle]);

  const progress = useMemo(() => {
    const playable = matches.filter((m) => !m.is_bye);
    const completed = playable.filter((m) => m.status === 'completed').length;
    return { completed, total: playable.length };
  }, [matches]);

  const isHost = bundle ? bundle.tournament.host_identity === identity : false;

  const winnerLabel = standings.length > 0 ? standings[0].label : null;

  // "Both" format: once the round robin completes, the host generates the
  // bracket seeded by standings. Guarded so it only fires once.
  useEffect(() => {
    if (!bundle || !isHost) return;
    if (bundle.tournament.format !== 'both') return;
    if (bundle.tournament.status !== 'active') return;
    if (generatingRef.current) return;

    const hasBracket = bundle.matches.some((m) => isBracketRound(m.round_number));
    const rr = bundle.matches.filter((m) => !isBracketRound(m.round_number));
    const rrDone = rr.length > 0 && rr.every((m) => m.status === 'completed');

    if (!hasBracket && rrDone) {
      generatingRef.current = true;
      generateSeededBracket(bundle)
        .then(() => useTournamentStore.getState().refresh())
        .catch(() => {})
        .finally(() => {
          generatingRef.current = false;
        });
    }
  }, [bundle, isHost]);

  return {
    loading,
    error,
    tournament: bundle?.tournament ?? null,
    players,
    teams,
    matches,
    rounds,
    standings,
    progress,
    isHost,
    winnerLabel,
  };
}
