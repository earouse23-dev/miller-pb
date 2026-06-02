import { StepShell } from './StepShell';
import { cn } from '@/lib/utils';
import type { GameFormat, ScoreTarget, TournamentFormat } from '@/lib/types';

interface ScoringStepProps {
  /** The structure chosen on the Format step — decides which phases need a format. */
  structure: TournamentFormat;
  target: ScoreTarget | null;
  onTargetChange: (t: ScoreTarget) => void;
  rrFormat: GameFormat | null;
  onRrFormatChange: (f: GameFormat) => void;
  bracketFormat: GameFormat | null;
  onBracketFormatChange: (f: GameFormat) => void;
}

const TARGETS: ScoreTarget[] = [11, 15, 21];

const FORMAT_OPTIONS: Array<{ id: GameFormat; title: string; sub: (t: number) => string }> = [
  { id: 'single', title: 'Single game', sub: (t) => `One game to ${t}` },
  { id: 'best_of_3', title: 'Best of 3', sub: (t) => `First to 2 games, each to ${t}` },
  { id: 'best_of_5', title: 'Best of 5', sub: (t) => `First to 3 games, each to ${t}` },
];

export function ScoringStep({
  structure,
  target,
  onTargetChange,
  rrFormat,
  onRrFormatChange,
  bracketFormat,
  onBracketFormatChange,
}: ScoringStepProps) {
  const needsRr = structure === 'round_robin' || structure === 'both';
  const needsBracket = structure === 'bracket' || structure === 'both';
  const t = target ?? 11;

  return (
    <StepShell label="Scoring" heading="How do you score?">
      <div className="flex flex-col gap-6">
        {/* Play-to target */}
        <Section title="Play to">
          <div className="grid grid-cols-3 gap-2.5">
            {TARGETS.map((v) => (
              <button
                key={v}
                onClick={() => onTargetChange(v)}
                aria-pressed={target === v}
                className={cn(
                  'flex h-16 flex-col items-center justify-center rounded-card border transition-colors active:scale-[0.99]',
                  target === v ? 'border-accent bg-surface-2' : 'border-line bg-surface hover:border-content-muted',
                )}
              >
                <span className={cn('font-display text-[28px] tracking-[0.02em]', target === v ? 'text-accent' : 'text-content-primary')}>
                  {v}
                </span>
                <span className="text-[11px] uppercase tracking-[0.08em] text-content-muted">points</span>
              </button>
            ))}
          </div>
        </Section>

        {/* Per-phase game format. "Both" shows two labelled sections. */}
        {needsRr && (
          <Section title={structure === 'both' ? 'Round robin format' : 'Match format'}>
            <FormatPicker target={t} value={rrFormat} onChange={onRrFormatChange} />
          </Section>
        )}
        {needsBracket && (
          <Section title={structure === 'both' ? 'Bracket format' : 'Match format'}>
            <FormatPicker target={t} value={bracketFormat} onChange={onBracketFormatChange} />
          </Section>
        )}
      </div>
    </StepShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="label-eyebrow">{title}</p>
      {children}
    </div>
  );
}

function FormatPicker({
  target,
  value,
  onChange,
}: {
  target: number;
  value: GameFormat | null;
  onChange: (f: GameFormat) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {FORMAT_OPTIONS.map((o) => {
        const selected = value === o.id;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            role="radio"
            aria-checked={selected}
            className={cn(
              'flex items-center justify-between rounded-card border px-4 py-3.5 text-left transition-colors active:scale-[0.99]',
              selected ? 'border-accent bg-surface-2' : 'border-line bg-surface hover:border-content-muted',
            )}
          >
            <span>
              <span className="block font-display text-[19px] tracking-[0.03em] text-content-primary">{o.title}</span>
              <span className="block text-[13px] text-content-secondary">{o.sub(target)}</span>
            </span>
            <span
              className={cn(
                'h-3.5 w-3.5 shrink-0 rounded-full border-[1.5px] transition-colors',
                selected ? 'border-accent bg-accent' : 'border-line',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
