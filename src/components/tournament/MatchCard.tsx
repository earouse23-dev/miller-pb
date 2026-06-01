import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Match, TeamWithPlayers } from '@/lib/types';
import { teamLabel } from '@/lib/utils';

interface MatchCardProps {
  match: Match;
  team1: TeamWithPlayers | undefined;
  team2: TeamWithPlayers | undefined;
  onScore: (match: Match) => void;
}

export function MatchCard({ match, team1, team2, onScore }: MatchCardProps) {
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
  const s1 = match.team1_score;
  const s2 = match.team2_score;
  const t1Won = completed && s1 != null && s2 != null && s1 > s2;
  const t2Won = completed && s1 != null && s2 != null && s2 > s1;
  const playable = Boolean(match.team1_id && match.team2_id) && !completed;
  const court = match.court_number;

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
        {playable && (
          <span className="inline-flex items-center gap-1 text-[12px] font-medium tracking-[0.04em] text-accent">
            Score <ArrowRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </>
  );

  if (completed) {
    return (
      <motion.div
        initial={{ y: 6 }}
        animate={{ y: 0 }}
        className="overflow-hidden rounded-card border border-line bg-surface shadow-inset"
      >
        {inner}
      </motion.div>
    );
  }

  return (
    <button
      onClick={() => playable && onScore(match)}
      disabled={!playable}
      className={cn(
        'w-full overflow-hidden rounded-card border bg-surface text-left shadow-inset transition-colors duration-200 ease-smooth',
        playable ? 'border-line hover:border-content-muted' : 'cursor-default border-line opacity-70',
      )}
    >
      {inner}
    </button>
  );
}
