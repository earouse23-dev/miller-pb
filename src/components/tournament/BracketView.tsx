import { forwardRef, useLayoutEffect, useRef, useState } from 'react';
import { cn, teamLabel } from '@/lib/utils';
import { isMultiGame, matchWinnerSide } from '@/lib/tournament-logic';
import type { Match, TeamWithPlayers } from '@/lib/types';
import type { RoundGroup } from '@/hooks/useTournament';

interface BracketViewProps {
  rounds: RoundGroup[]; // bracket rounds only, in order
  teams: Map<string, TeamWithPlayers>;
  onScore: (match: Match) => void;
  championTeamId?: string | null;
  /** Completed matches whose score can still be re-entered. */
  editableMatchIds?: Set<string>;
}

interface Conn {
  key: string;
  d: string;
}

/** Single-elimination bracket as columns per round with connector lines. */
export function BracketView({ rounds, teams, onScore, championTeamId, editableMatchIds }: BracketViewProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [conns, setConns] = useState<Conn[]>([]);
  const [svg, setSvg] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const measure = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const crect = wrap.getBoundingClientRect();
      const lines: Conn[] = [];
      for (let r = 0; r < rounds.length - 1; r++) {
        rounds[r].matches.forEach((m, i) => {
          const child = nodeRefs.current[m.id];
          const parentMatch = rounds[r + 1].matches[Math.floor(i / 2)];
          const parent = parentMatch && nodeRefs.current[parentMatch.id];
          if (!child || !parent) return;
          const a = child.getBoundingClientRect();
          const b = parent.getBoundingClientRect();
          const x1 = a.right - crect.left;
          const y1 = a.top - crect.top + a.height / 2;
          const x2 = b.left - crect.left;
          const y2 = b.top - crect.top + b.height / 2;
          const mx = x1 + (x2 - x1) / 2;
          lines.push({ key: m.id, d: `M ${x1} ${y1} H ${mx} V ${y2} H ${x2}` });
        });
      }
      setSvg({ w: wrap.scrollWidth, h: wrap.scrollHeight });
      setConns(lines);
    };
    measure();
    const t = window.setTimeout(measure, 80);
    window.addEventListener('resize', measure);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', measure);
    };
  }, [rounds, teams]);

  if (rounds.length === 0) return null;

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-7">
      <div ref={wrapRef} className="relative flex min-w-max gap-7">
        <svg
          className="pointer-events-none absolute inset-0 overflow-visible"
          style={{ width: svg.w, height: svg.h }}
          viewBox={`0 0 ${svg.w} ${svg.h}`}
        >
          {conns.map((c) => (
            <path key={c.key} d={c.d} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={1.5} />
          ))}
        </svg>

        {rounds.map((group, colIdx) => {
          const isFinalCol = colIdx === rounds.length - 1;
          return (
            <div key={group.key} className="flex min-w-[192px] flex-col justify-around gap-4">
              <div className="font-display mb-0.5 text-center text-[16px] tracking-[0.06em] text-content-muted">
                {group.label}
              </div>
              {group.matches.map((m) => (
                <BracketMatch
                  key={m.id}
                  ref={(el) => (nodeRefs.current[m.id] = el)}
                  match={m}
                  team1={m.team1_id ? teams.get(m.team1_id) : undefined}
                  team2={m.team2_id ? teams.get(m.team2_id) : undefined}
                  onScore={onScore}
                  isFinal={isFinalCol}
                  championTeamId={championTeamId}
                  editable={editableMatchIds?.has(m.id)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const BracketMatch = forwardRef<
  HTMLDivElement,
  {
    match: Match;
    team1?: TeamWithPlayers;
    team2?: TeamWithPlayers;
    onScore: (match: Match) => void;
    isFinal: boolean;
    championTeamId?: string | null;
    editable?: boolean;
  }
>(function BracketMatch({ match, team1, team2, onScore, isFinal, championTeamId, editable }, ref) {
  const completed = match.status === 'completed';
  const multi = isMultiGame(match);
  // Headline = games won for best-of, total points for a single game.
  const s1 = completed ? (multi ? match.team1_games : match.team1_score) : match.team1_score;
  const s2 = completed ? (multi ? match.team2_games : match.team2_score) : match.team2_score;
  const winner = completed ? matchWinnerSide(match) : null;
  const t1Won = winner === 'team1';
  const t2Won = winner === 'team2';
  const playable = !match.is_bye && Boolean(match.team1_id && match.team2_id) && !completed;
  const clickable = playable || (completed && Boolean(editable));
  const champWon = isFinal && completed && Boolean(championTeamId);

  const Team = ({ id, label, score, won, lose }: { id: string | null; label: string; score: number | null; won: boolean; lose: boolean }) => (
    <div
      className={cn(
        'flex items-center justify-between gap-2.5 border-l-[3px] px-3 py-2.5',
        won ? 'border-l-accent' : 'border-l-transparent',
        lose && 'opacity-50',
      )}
    >
      <span className={cn('truncate text-[13px] font-medium', id ? 'text-content-primary' : 'text-content-muted')}>
        {id ? label : 'TBD'}
      </span>
      <span className="font-display shrink-0 text-[18px] text-content-primary">{score != null ? score : ''}</span>
    </div>
  );

  return (
    <div
      ref={ref}
      onClick={() => clickable && onScore(match)}
      className={cn(
        'overflow-hidden rounded-sm border bg-surface',
        clickable ? 'cursor-pointer hover:border-content-muted' : 'cursor-default',
        champWon ? 'border-accent' : 'border-line',
      )}
    >
      <Team id={match.team1_id} label={teamLabel(team1)} score={s1} won={t1Won} lose={t2Won} />
      <div className="h-px bg-line" />
      {match.is_bye ? (
        <div className="flex items-center justify-between px-3 py-2.5">
          <span className="text-[13px] text-content-muted">—</span>
          <span className="text-[11px] uppercase italic text-content-muted">Bye</span>
        </div>
      ) : (
        <Team id={match.team2_id} label={teamLabel(team2)} score={s2} won={t2Won} lose={t1Won} />
      )}
      <div className="flex items-center justify-between border-t border-line px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-content-muted">
        <span>{completed ? 'Final' : playable ? 'Upcoming' : 'TBD'}</span>
        {playable && <span className="text-accent">Score</span>}
        {completed && editable && <span className="text-content-secondary">Edit</span>}
      </div>
    </div>
  );
});
