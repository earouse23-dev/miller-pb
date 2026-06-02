import { AnimatePresence, motion } from 'framer-motion';
import { Minimize2 } from 'lucide-react';
import { Brand } from '@/components/layout/Brand';
import { Badge } from '@/components/ui/Badge';
import { cn, teamLabel } from '@/lib/utils';
import { isBracketRound, matchWinnerSide } from '@/lib/tournament-logic';
import type { Match, TeamWithPlayers } from '@/lib/types';

interface CourtDisplayProps {
  open: boolean;
  onClose: () => void;
  code: string;
  matches: Match[];
  teams: Map<string, TeamWithPlayers>;
}

/** The match "up now" on a given court: earliest pending, non-bye, playable. */
function currentMatchForCourt(matches: Match[], court: number): Match | null {
  const candidates = matches
    .filter((m) => !m.is_bye && m.team1_id && m.team2_id && m.court_number === court)
    .sort((a, b) => a.round_number - b.round_number || a.created_at.localeCompare(b.created_at));
  return candidates.find((m) => m.status === 'pending') ?? candidates[candidates.length - 1] ?? null;
}

export function CourtDisplay({ open, onClose, code, matches, teams }: CourtDisplayProps) {
  const m1 = currentMatchForCourt(matches, 1);
  const m2 = currentMatchForCourt(matches, 2);
  const anyBracket = matches.some((m) => isBracketRound(m.round_number) && m.status !== 'completed');
  const stage = anyBracket ? 'Bracket' : 'Round Robin';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[50] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.97 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex aspect-[16/9] max-h-[92vh] w-[min(1180px,96vw)] flex-col overflow-hidden rounded-[20px] border border-line bg-bg-primary p-6 sm:p-10"
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full text-content-secondary transition-colors hover:bg-surface hover:text-content-primary"
            >
              <Minimize2 className="h-5 w-5" />
            </button>

            <div className="flex items-center justify-between">
              <Brand size="sm" align="left" />
              <div className="text-center">
                <div className="font-display text-[clamp(20px,3vw,30px)] tracking-[0.03em] text-content-primary">
                  Miller Pickleball
                </div>
                <div className="mt-1 font-mono text-[12px] uppercase tracking-[0.14em] text-content-secondary">
                  {stage}
                </div>
              </div>
              <Badge tone="live">Live</Badge>
            </div>

            <div className="mt-6 grid flex-1 grid-cols-2 gap-4 sm:gap-6">
              <CourtPanel courtNo={1} match={m1} teams={teams} />
              <CourtPanel courtNo={2} match={m2} teams={teams} />
            </div>

            <div className="mt-4 flex items-center justify-between text-[13px] text-content-muted">
              <span className="whitespace-nowrap">Tap a match to score in the app</span>
              <span className="whitespace-nowrap font-mono tracking-[0.14em]">JOIN · CODE {code}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CourtPanel({
  courtNo,
  match,
  teams,
}: {
  courtNo: number;
  match: Match | null;
  teams: Map<string, TeamWithPlayers>;
}) {
  const t1 = match?.team1_id ? teams.get(match.team1_id) : undefined;
  const t2 = match?.team2_id ? teams.get(match.team2_id) : undefined;
  const s1 = match?.team1_score ?? 0;
  const s2 = match?.team2_score ?? 0;
  // For a finished best-of match the winner is decided by games, not points.
  const winner = match && match.status === 'completed' ? matchWinnerSide(match) : null;
  const lead1 = winner ? winner === 'team1' : s1 > s2;
  const lead2 = winner ? winner === 'team2' : s2 > s1;
  const live = match?.status === 'pending';

  return (
    <div className={cn('flex flex-col rounded-2xl border bg-surface p-4 sm:p-6', live ? 'border-accent' : 'border-line')}>
      <div className="flex items-center justify-between">
        <span className="font-display text-[20px] tracking-[0.06em] text-content-primary">Court {courtNo}</span>
        {live ? <Badge tone="live">Live</Badge> : <Badge tone="neutral">{match ? 'Final' : 'Open'}</Badge>}
      </div>

      <div className="flex flex-1 flex-col justify-center">
        {match ? (
          <>
            <CourtTeam name={teamLabel(t1)} score={s1} lead={lead1} />
            <div className="h-px bg-line" />
            <CourtTeam name={teamLabel(t2)} score={s2} lead={lead2} />
          </>
        ) : (
          <p className="py-8 text-center text-[15px] text-content-muted">No match on this court</p>
        )}
      </div>
    </div>
  );
}

function CourtTeam({ name, score, lead }: { name: string; score: number; lead: boolean }) {
  return (
    <div className={cn('flex items-center justify-between border-l-[3px] pl-3', lead ? 'border-l-accent' : 'border-l-transparent')}>
      <span
        className={cn(
          'font-display text-[clamp(20px,2.6vw,32px)] tracking-[0.03em]',
          lead ? 'text-content-primary' : 'text-content-secondary',
        )}
      >
        {name}
      </span>
      <span
        className={cn(
          'font-display text-[clamp(36px,5vw,72px)] leading-none tracking-[0.02em]',
          lead ? 'text-accent' : 'text-content-muted',
        )}
      >
        {score}
      </span>
    </div>
  );
}
