import { ArrowRight, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { isMultiGame, matchWinnerSide } from '@/lib/tournament-logic';
import type { Match, TeamWithPlayers } from '@/lib/types';
import { teamLabel } from '@/lib/utils';

interface MatchCardProps {
  match: Match;
  team1: TeamWithPlayers | undefined;
  team2: TeamWithPlayers | undefined;
  onScore: (match: Match) => void;
  /** Completed match whose score can still be re-entered. */
  editable?: boolean;
}

export function MatchCard({ match, team1, team2, onScore, editable }: MatchCardProps) {
  const label1 = teamLabel(team1);
  const label2 = teamLabel(team2);

  // Bye -----------------------------------------------------------------
  if (match.is_bye) {
    return (
      <div className="flex items-center justify-between rounded-card border border-line bg-surface px-4 py-4 shadow-inset">
        <span className="text-[15px] font-medium text-content-secondary">{label1}</span>
        <span className="text-[13px] uppercase italic tracking-[0.06em] text-content-muted">Bye</span>
      </div>
    );
  }

  const completed = match.status === 'completed';
  const multi = isMultiGame(match);
  // Headline = games won for best-of, total points for a single game.
  const s1 = completed ? (multi ? match.team1_games : match.team1_score) : match.team1_score;
  const s2 = completed ? (multi ? match.team2_games : match.team2_score) : match.team2_score;
  const winner = completed ? matchWinnerSide(match) : null;
  const t1Won = winner === 'team1';
  const t2Won = winner === 'team2';
  const playable = Boolean(match.team1_id && match.team2_id) && !completed;
  const court = match.court_number;
  const gamesDetail =
    completed && multi && match.games ? match.games.map((g) => `${g.a}–${g.b}`).join('  ') : null;

  const Row = ({ label, score, won, lose }: { label: string; score: number | null; won: boolean; lose: boolean }) => (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-l-[3px] px-4 py-3.5',
        won ? 'border-l-accent' : 'border-l-transparent',
        lose && 'opacity-50',
      )}
    >
      <span className="text-[15px] font-medium text-content-primary">{label}</span>
      {(completed || score != null) && (
        <span className="font-display min-w-[30px] text-right text-[28px] leading-none tracking-[0.02em] text-content-primary">
          {score}
        </span>
      )}
    </div>
  );

  const inner = (
    <>
      <Row label={label1} score={s1} won={t1Won} lose={t2Won} />
      <div className="flex items-center gap-2.5 px-4 py-1">
        <span className="h-px flex-1 bg-line" />
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-content-muted">vs</span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <Row label={label2} score={s2} won={t2Won} lose={t1Won} />
      <div className="flex items-center justify-between border-t border-line bg-surface px-4 py-2.5">
        <span
          className={cn(
            'inline-flex h-6 items-center gap-1.5 rounded-pill px-2.5 text-[11px] font-medium uppercase tracking-[0.08em]',
            completed ? 'bg-surface-2 text-content-secondary' : 'bg-surface-2 text-content-secondary',
          )}
        >
          {completed ? 'Final' : court ? `Court ${court}` : 'Pending'}
        </span>
        {gamesDetail && (
          <span className="font-mono text-[11px] tracking-[0.04em] text-content-muted">{gamesDetail}</span>
        )}
        {playable && (
          <span className="inline-flex items-center gap-1 text-[12px] font-medium tracking-[0.04em] text-accent">
            Score <ArrowRight className="h-4 w-4" />
          </span>
        )}
        {completed && editable && (
          <span className="inline-flex items-center gap-1 text-[12px] font-medium tracking-[0.04em] text-content-secondary">
            Edit <Pencil className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </>
  );

  const interactive = playable || (completed && Boolean(editable));

  return (
    <SpotlightCard
      spotlightColor="rgba(74,222,128,0.13)"
      onClick={interactive ? () => onScore(match) : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onScore(match);
              }
            }
          : undefined
      }
      className={cn(
        'text-left',
        interactive && 'cursor-pointer',
        !playable && !completed && 'opacity-70',
      )}
    >
      {inner}
    </SpotlightCard>
  );
}
