import { Grid3x3, GitFork } from 'lucide-react';
import { MatchCard } from './MatchCard';
import { Badge } from '@/components/ui/Badge';
import type { Match, TeamWithPlayers } from '@/lib/types';
import type { RoundGroup } from '@/hooks/useTournament';

interface RoundSectionProps {
  group: RoundGroup;
  teams: Map<string, TeamWithPlayers>;
  onScore: (match: Match) => void;
}

export function RoundSection({ group, teams, onScore }: RoundSectionProps) {
  const Icon = group.isBracket ? GitFork : Grid3x3;
  const stage = group.isBracket ? 'Bracket' : 'Round Robin';

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2 px-0.5">
        <Icon className="h-4 w-4 text-content-muted" />
        <h3 className="text-[11px] font-bold uppercase tracking-label text-content-secondary">
          {stage} · {group.label}
        </h3>
      </div>

      <div className="flex flex-col gap-2.5">
        {group.matches.map((m) => (
          <div key={m.id} className="flex flex-col gap-1.5">
            {!m.is_bye && m.court_number != null && (
              <div className="flex justify-end">
                <Badge tone={m.court_number === 1 ? 'court1' : 'court2'}>Court {m.court_number}</Badge>
              </div>
            )}
            <MatchCard
              match={m}
              team1={m.team1_id ? teams.get(m.team1_id) : undefined}
              team2={m.team2_id ? teams.get(m.team2_id) : undefined}
              onScore={onScore}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
