import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { Match, TeamWithPlayers } from '@/lib/types';
import { teamLabel } from '@/lib/utils';

interface ScoreModalProps {
  match: Match | null;
  team1: TeamWithPlayers | undefined;
  team2: TeamWithPlayers | undefined;
  onClose: () => void;
  onSubmit: (match: Match, team1Score: number, team2Score: number) => Promise<void>;
}

export function ScoreModal({ match, team1, team2, onClose, onSubmit }: ScoreModalProps) {
  const [s1, setS1] = useState('');
  const [s2, setS2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fully reset modal state whenever the target match changes (incl. close).
  useEffect(() => {
    setS1(match?.team1_score?.toString() ?? '');
    setS2(match?.team2_score?.toString() ?? '');
    setError(null);
    setSubmitting(false);
  }, [match]);

  const n1 = Number(s1);
  const n2 = Number(s2);
  const lead1 = s1 !== '' && s2 !== '' && n1 > n2;
  const lead2 = s1 !== '' && s2 !== '' && n2 > n1;

  const submit = async () => {
    if (!match || submitting) return;
    if (s1 === '' || s2 === '' || Number.isNaN(n1) || Number.isNaN(n2)) {
      setError('Enter a score for both teams.');
      return;
    }
    if (n1 < 0 || n2 < 0 || !Number.isInteger(n1) || !Number.isInteger(n2)) {
      setError('Scores must be whole numbers, zero or more.');
      return;
    }
    if (n1 === n2) {
      setError('Scores can’t be equal — there must be a winner.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(match, n1, n2);
      setSubmitting(false);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit score.');
      setSubmitting(false);
    }
  };

  return (
    <Modal open={Boolean(match)} onClose={onClose} variant="slide-up" title="Score Match" dismissable={!submitting}>
      <div className="flex flex-col gap-3">
        <ScoreField label={teamLabel(team1)} value={s1} onChange={setS1} lead={lead1} autoFocus />
        <ScoreField label={teamLabel(team2)} value={s2} onChange={setS2} lead={lead2} />
      </div>

      {error && <p className="mt-3 text-center text-[13px] font-medium text-danger">{error}</p>}

      <Button fullWidth className="mt-5" onClick={submit} loading={submitting}>
        Submit Score
      </Button>
    </Modal>
  );
}

function ScoreField({
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
    <div
      className={cn(
        'rounded-card border bg-surface p-5 shadow-inset transition-colors',
        lead ? 'border-accent' : 'border-line',
      )}
    >
      <p className="font-display text-[22px] tracking-[0.03em] text-content-primary">{label}</p>
      <input
        autoFocus={autoFocus}
        type="number"
        inputMode="numeric"
        min={0}
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="no-spinner font-display mt-2 h-16 w-full rounded-input border border-line bg-surface-2 text-center text-[56px] leading-none text-content-primary placeholder:text-content-muted focus:border-accent focus:outline-none"
      />
    </div>
  );
}
