import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cn, teamLabel } from '@/lib/utils';
import { gamesToWin, totalGames } from '@/lib/tournament-logic';
import type { GameFormat, GameScore, Match, TeamWithPlayers } from '@/lib/types';

interface ScoreModalProps {
  match: Match | null;
  team1: TeamWithPlayers | undefined;
  team2: TeamWithPlayers | undefined;
  /** Points a single game is played to. */
  target: number;
  /** Single game or best-of-N for this match's phase. */
  format: GameFormat;
  onClose: () => void;
  onSubmit: (match: Match, games: GameScore[]) => Promise<void>;
}

type Row = { a: string; b: string };
const emptyRow = (): Row => ({ a: '', b: '' });

/** A game is final once a side reaches the target AND leads by 2 (win by 2). */
function gameValid(a: number, b: number, target: number): boolean {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) return false;
  if (a === b) return false;
  return Math.max(a, b) >= target && Math.abs(a - b) >= 2;
}

export function ScoreModal({ match, team1, team2, target, format, onClose, onSubmit }: ScoreModalProps) {
  const maxGames = totalGames(format);
  const needGames = gamesToWin(format);

  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const editing = match?.status === 'completed';

  // Reset whenever the target match changes (incl. close). Pre-fill from any
  // previously recorded games, falling back to a legacy single-game score.
  useEffect(() => {
    const existing = match?.games;
    if (existing && existing.length > 0) {
      setRows(existing.map((g) => ({ a: String(g.a), b: String(g.b) })));
    } else if (match?.status === 'completed' && match.team1_score != null && match.team2_score != null) {
      setRows([{ a: String(match.team1_score), b: String(match.team2_score) }]);
    } else {
      setRows([emptyRow()]);
    }
    setError(null);
    setSubmitting(false);
  }, [match]);

  // Walk the rows in order, tallying games until a side clinches the match.
  const evald = useMemo(() => {
    let w1 = 0;
    let w2 = 0;
    const games: GameScore[] = [];
    let decidedAt = -1;
    let invalidAt = -1;
    for (let i = 0; i < maxGames; i++) {
      const r = rows[i];
      if (!r || r.a === '' || r.b === '') break; // stop at first unfilled game
      const a = Number(r.a);
      const b = Number(r.b);
      if (!gameValid(a, b, target)) {
        invalidAt = i;
        break;
      }
      games.push({ a, b });
      if (a > b) w1 += 1;
      else w2 += 1;
      if (w1 === needGames || w2 === needGames) {
        decidedAt = i;
        break;
      }
    }
    return { w1, w2, games, decidedAt, invalidAt };
  }, [rows, maxGames, needGames, target]);

  // How many game rows to show. Reveal the next game only once the prior ones
  // are valid, and never past the deciding game.
  const visibleCount = useMemo(() => {
    if (evald.decidedAt >= 0) return evald.decidedAt + 1;
    if (evald.invalidAt >= 0) return evald.invalidAt + 1;
    return Math.min(evald.games.length + 1, maxGames);
  }, [evald, maxGames]);

  const setCell = (i: number, side: 'a' | 'b', v: string) => {
    setError(null);
    setRows((prev) => {
      const next = prev.slice();
      while (next.length <= i) next.push(emptyRow());
      next[i] = { ...next[i], [side]: v };
      return next;
    });
  };

  const decided = evald.decidedAt >= 0;
  const winnerLabel = decided
    ? evald.w1 > evald.w2
      ? teamLabel(team1)
      : teamLabel(team2)
    : null;

  const submit = async () => {
    if (!match || submitting) return;
    if (evald.invalidAt >= 0) {
      setError(`Game ${evald.invalidAt + 1}: a team must reach ${target} and win by 2.`);
      return;
    }
    if (!decided) {
      setError(
        format === 'single'
          ? `Enter a final score (to ${target}, win by 2).`
          : `Finish the match — a team needs to win ${needGames} games.`,
      );
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(match, evald.games);
      setSubmitting(false);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit score.');
      setSubmitting(false);
    }
  };

  const single = format === 'single';
  const subtitle = single
    ? `One game to ${target}, win by 2`
    : `${format === 'best_of_5' ? 'Best of 5' : 'Best of 3'} · games to ${target}, win by 2`;

  return (
    <Modal open={Boolean(match)} onClose={onClose} variant="slide-up" title={editing ? 'Edit Score' : 'Score Match'} dismissable={!submitting}>
      <p className="-mt-1 mb-4 text-center text-[13px] text-content-secondary">{subtitle}</p>

      {!single && (
        <div className="mb-4 flex items-center justify-center gap-4 text-center">
          <Tally label={teamLabel(team1)} games={evald.w1} lead={evald.w1 > evald.w2} />
          <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-content-muted">games</span>
          <Tally label={teamLabel(team2)} games={evald.w2} lead={evald.w2 > evald.w1} />
        </div>
      )}

      <div className="flex flex-col gap-3">
        {Array.from({ length: visibleCount }).map((_, i) => {
          const r = rows[i] ?? emptyRow();
          const a = Number(r.a);
          const b = Number(r.b);
          const both = r.a !== '' && r.b !== '';
          const lead1 = both && a > b;
          const lead2 = both && b > a;
          const bad = both && !gameValid(a, b, target);
          return (
            <div key={i} className="rounded-card border border-line bg-surface p-3.5 shadow-inset">
              {!single && (
                <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-content-muted">Game {i + 1}</p>
              )}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <GameInput
                  label={teamLabel(team1)}
                  value={r.a}
                  onChange={(v) => setCell(i, 'a', v)}
                  lead={lead1}
                  autoFocus={i === 0}
                />
                <span className="font-mono text-[12px] text-content-muted">vs</span>
                <GameInput label={teamLabel(team2)} value={r.b} onChange={(v) => setCell(i, 'b', v)} lead={lead2} />
              </div>
              {bad && (
                <p className="mt-2 text-center text-[12px] text-danger">Reach {target} and win by 2.</p>
              )}
            </div>
          );
        })}
      </div>

      {decided && winnerLabel && (
        <p className="mt-4 text-center text-[14px] font-semibold text-accent">
          {winnerLabel} {single ? 'wins' : `wins the match ${Math.max(evald.w1, evald.w2)}–${Math.min(evald.w1, evald.w2)}`}
        </p>
      )}

      {error && <p className="mt-3 text-center text-[13px] font-medium text-danger">{error}</p>}

      <Button fullWidth className="mt-5" onClick={submit} loading={submitting} disabled={!decided}>
        {editing ? 'Update Score' : 'Submit Score'}
      </Button>
    </Modal>
  );
}

function Tally({ label, games, lead }: { label: string; games: number; lead: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <span className={cn('font-display text-[32px] leading-none tracking-[0.02em]', lead ? 'text-accent' : 'text-content-muted')}>
        {games}
      </span>
      <span className="mt-0.5 max-w-[120px] truncate text-[12px] text-content-secondary">{label}</span>
    </div>
  );
}

function GameInput({
  label,
  value,
  onChange,
  lead,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  lead: boolean;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <p className="mb-1 truncate text-[12px] font-medium text-content-secondary">{label}</p>
      <input
        autoFocus={autoFocus}
        type="number"
        inputMode="numeric"
        min={0}
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'no-spinner font-display h-14 w-full rounded-input border bg-surface-2 text-center text-[40px] leading-none text-content-primary placeholder:text-content-muted focus:outline-none',
          lead ? 'border-accent' : 'border-line focus:border-accent',
        )}
      />
    </div>
  );
}
