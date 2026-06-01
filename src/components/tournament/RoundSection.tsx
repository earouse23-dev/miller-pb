import { MatchCard } from './MatchCard';
import type { Match, TeamWithPlayers } from '@/lib/types';
import type { RoundGroup } from '@/hooks/useTournament';

interface RoundSectionProps {
  group: RoundGroup;
  teams: Map<string, TeamWithPlayers>;
  onScore: (match: Match) => void;
}

export function RoundSection({ group, teams, onScore }: RoundSectionProps) {
  const stage = group.isBracket ? 'Bracket' : 'Round Robin';

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-2xl uppercase tracking-[0.04em] text-content-primary">{group.label}</h3>
        <span className="text-[13px] font-medium text-content-secondary">{stage}</span>
      </div>

      <div className="flex flex-col gap-3">
        {group.matches.map((m) => (
          <MatchCard
            key={m.id}
            match={m}
            team1={m.team1_id ? teams.get(m.team1_id) : undefined}
            team2={m.team2_id ? teams.get(m.team2_id) : undefined}
            onScore={onScore}
          />
        ))}
      </div>
    </section>
  );
}
