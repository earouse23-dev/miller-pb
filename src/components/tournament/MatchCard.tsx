import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
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

  // Bye card -------------------------------------------------------------
  if (match.is_bye) {
    return (
      <div className="flex items-center justify-between rounded-card border border-line bg-bg-card/60 px-4 py-4">
        <span className="font-semibold text-content-secondary">{label1}</span>
        <Badge tone="neutral">Bye</Badge>
      </div>
    );
  }

  const completed = match.status === 'completed';
  const s1 = match.team1_score;
  const s2 = match.team2_score;
  const team1Won = completed && s1 != null && s2 != null && s1 > s2;
  const team2Won = completed && s1 != null && s2 != null && s2 > s1;

  // Completed card -------------------------------------------------------
  if (completed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-card border border-line bg-bg-card px-4 py-4"
      >
        <div className="flex items-center justify-between gap-3">
          <span
            className={cn('flex-1 font-semibold', team1Won ? 'text-content-primary' : 'text-content-secondary')}
          >
            {label1}
          </span>
          <div className="flex items-center gap-2 font-mono text-lg font-bold">
            <span className={team1Won ? 'text-accent' : 'text-content-secondary'}>{s1}</span>
            <span className="text-content-muted">·</span>
            <span className={team2Won ? 'text-accent' : 'text-content-secondary'}>{s2}</span>
          </div>
          <span
            className={cn(
              'flex-1 text-right font-semibold',
              team2Won ? 'text-content-primary' : 'text-content-secondary',
            )}
          >
            {label2}
          </span>
        </div>
        <div className="mt-2 flex justify-center">
          <Badge tone="success">Final</Badge>
        </div>
      </motion.div>
    );
  }

  // Pending card (tap to score) -----------------------------------------
  const playable = Boolean(match.team1_id && match.team2_id);
  return (
    <button
      onClick={() => playable && onScore(match)}
      disabled={!playable}
      className={cn(
        'group w-full rounded-card border bg-bg-card px-4 py-4 text-left transition-all duration-200',
        playable
          ? 'border-line hover:border-accent/50 hover:bg-bg-card-hover hover:shadow-glow'
          : 'cursor-default border-line/60 opacity-70',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex-1 font-semibold text-content-primary">{label1}</span>
        <span className="text-xs font-bold uppercase tracking-label text-content-muted">vs</span>
        <span className="flex-1 text-right font-semibold text-content-primary">{label2}</span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <Badge tone="neutral">Pending</Badge>
        {playable && (
          <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-label text-accent animate-pulse-soft">
            Tap to score <ArrowRight className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </button>
  );
}
