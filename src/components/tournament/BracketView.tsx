import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn, teamLabel } from '@/lib/utils';
import type { Match, TeamWithPlayers } from '@/lib/types';
import type { RoundGroup } from '@/hooks/useTournament';

interface BracketViewProps {
  rounds: RoundGroup[]; // bracket rounds only, in order
  teams: Map<string, TeamWithPlayers>;
  onScore: (match: Match) => void;
  championTeamId?: string | null;
}

/** Standard single-elimination bracket laid out as columns per round. */
export function BracketView({ rounds, teams, onScore, championTeamId }: BracketViewProps) {
  if (rounds.length === 0) return null;

  return (
    <div className="-mx-1 overflow-x-auto pb-2">
      <div className="flex min-w-max gap-4 px-1">
        {rounds.map((group, colIdx) => (
          <div key={group.key} className="flex w-56 shrink-0 flex-col">
            <div className="mb-3 flex items-center gap-1.5">
              {group.label === 'FINAL' && <Trophy className="h-3.5 w-3.5 text-accent" />}
              <h4 className="text-[11px] font-bold uppercase tracking-label text-content-secondary">
                {group.label}
              </h4>
            </div>

            {/* Vertically distribute matches so later rounds sit centered. */}
            <div className="flex flex-1 flex-col justify-around gap-3">
              {group.matches.map((m) => (
                <BracketMatch
                  key={m.id}
                  match={m}
                  team1={m.team1_id ? teams.get(m.team1_id) : undefined}
                  team2={m.team2_id ? teams.get(m.team2_id) : undefined}
                  onScore={onScore}
                  isFinal={colIdx === rounds.length - 1}
                  championTeamId={championTeamId}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BracketMatch({
  match,
  team1,
  team2,
  onScore,
  isFinal,
  championTeamId,
}: {
  match: Match;
  team1?: TeamWithPlayers;
  team2?: TeamWithPlayers;
  onScore: (match: Match) => void;
  isFinal: boolean;
  championTeamId?: string | null;
}) {
  const completed = match.status === 'completed';
  const s1 = match.team1_score;
  const s2 = match.team2_score;
  const t1Won = completed && s1 != null && s2 != null && s1 > s2;
  const t2Won = completed && s1 != null && s2 != null && s2 > s1;
  const playable = !match.is_bye && Boolean(match.team1_id && match.team2_id) && !completed;

  const championWon = isFinal && completed && championTeamId;

  return (
    <motion.button
      layout
      onClick={() => playable && onScore(match)}
      disabled={!playable}
      className={cn(
        'overflow-hidden rounded-input border text-left transition-all duration-200',
        playable
          ? 'border-line bg-bg-card hover:border-accent/50 hover:shadow-glow'
          : 'cursor-default border-line bg-bg-card',
        championWon && 'border-accent shadow-glow',
      )}
    >
      <Slot
        label={teamLabel(team1)}
        score={s1}
        won={t1Won}
        isChampion={isFinal && t1Won}
        placeholder={!match.team1_id}
      />
      <div className="h-px bg-line" />
      {match.is_bye ? (
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm text-content-muted">—</span>
          <Badge tone="neutral">Bye</Badge>
        </div>
      ) : (
        <Slot
          label={teamLabel(team2)}
          score={s2}
          won={t2Won}
          isChampion={isFinal && t2Won}
          placeholder={!match.team2_id}
        />
      )}

      {playable && (
        <div className="bg-bg-secondary px-3 py-1 text-center text-[10px] font-bold uppercase tracking-label text-accent animate-pulse-soft">
          Tap to score
        </div>
      )}
    </motion.button>
  );
}

function Slot({
  label,
  score,
  won,
  isChampion,
  placeholder,
}: {
  label: string;
  score: number | null;
  won: boolean;
  isChampion: boolean;
  placeholder: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2">
      <span
        className={cn(
          'flex items-center gap-1 truncate text-sm font-semibold',
          placeholder ? 'text-content-muted' : won ? 'text-content-primary' : 'text-content-secondary',
        )}
      >
        {isChampion && <Trophy className="h-3.5 w-3.5 shrink-0 text-accent" />}
        {placeholder ? 'TBD' : label}
      </span>
      <span className={cn('font-mono text-sm font-bold', won ? 'text-accent' : 'text-content-muted')}>
        {score ?? ''}
      </span>
    </div>
  );
}
