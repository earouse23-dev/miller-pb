import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
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

  // Reset when a new match opens.
  useEffect(() => {
    if (match) {
      setS1(match.team1_score?.toString() ?? '');
      setS2(match.team2_score?.toString() ?? '');
      setError(null);
    }
  }, [match]);

  const submit = async () => {
    if (!match || submitting) return;
    const n1 = Number(s1);
    const n2 = Number(s2);

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
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit score.');
      setSubmitting(false);
    }
  };

  return (
    <Modal open={Boolean(match)} onClose={onClose} variant="scale" dismissable={!submitting}>
      <p className="label-eyebrow">Enter Score</p>

      <div className="mt-5 flex flex-col gap-4">
        <ScoreField label={teamLabel(team1)} value={s1} onChange={setS1} autoFocus />
        <div className="text-center text-xs font-bold uppercase tracking-label text-content-muted">vs</div>
        <ScoreField label={teamLabel(team2)} value={s2} onChange={setS2} />
      </div>

      {error && <p className="mt-3 text-center text-sm font-medium text-danger">{error}</p>}

      <div className="mt-6 flex items-center justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={submit} loading={submitting}>
          Submit Score <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Modal>
  );
}

function ScoreField({
  label,
  value,
  onChange,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <p className="mb-2 text-center font-bold text-content-primary">{label}</p>
      <input
        autoFocus={autoFocus}
        type="number"
        inputMode="numeric"
        min={0}
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="no-spinner h-16 w-full rounded-input border border-line bg-bg-secondary text-center text-3xl font-bold text-content-primary placeholder:text-content-muted focus:border-accent focus:shadow-glow focus:outline-none"
      />
    </div>
  );
}
