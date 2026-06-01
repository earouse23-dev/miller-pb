import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, UserPlus, AlertTriangle } from 'lucide-react';
import { StepShell } from './StepShell';
import { Input, Field } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { Player } from '@/lib/types';

interface PlayerStepProps {
  players: Player[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onAddPlayer: (name: string) => Promise<void>;
  isDoubles: boolean;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function PlayerStep({ players, selected, onToggle, onAddPlayer, isDoubles }: PlayerStepProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const count = selected.size;
  const oddForDoubles = isDoubles && count % 2 === 1;

  const submitNew = async () => {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await onAddPlayer(trimmed);
      setName('');
      setAdding(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <StepShell label="Players" heading="Who's playing?">
      {/* sticky count */}
      <div className="sticky top-0 z-[5] -mt-1 flex items-center justify-between bg-bg-primary pb-3">
        <span className="text-[13px] font-medium text-content-secondary">
          {count} player{count === 1 ? '' : 's'} selected
        </span>
        <Badge tone="accent">Min {isDoubles ? '4 · even' : 2}</Badge>
      </div>

      {oddForDoubles && (
        <div className="flex items-center gap-2 rounded-input border border-danger/40 bg-danger-dim px-3 py-2 text-[13px] text-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Doubles needs an even number of players.
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {players.length === 0 && (
          <p className="py-6 text-center text-[14px] text-content-muted">
            No players yet. Add your first one below.
          </p>
        )}
        <AnimatePresence initial={false}>
          {players.map((p) => {
            const isSel = selected.has(p.id);
            return (
              <motion.button
                key={p.id}
                layout
                initial={{ y: 6 }}
                animate={{ y: 0 }}
                onClick={() => onToggle(p.id)}
                className={cn(
                  'flex min-h-[64px] items-center gap-3.5 rounded-card border px-4 py-3 text-left transition-colors',
                  isSel ? 'border-accent bg-surface' : 'border-line bg-surface hover:border-content-muted',
                )}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-surface-2 text-[13px] font-medium text-content-primary">
                  {initials(p.name)}
                </span>
                <span className="flex-1 text-[15px] font-medium text-content-primary">{p.name}</span>
                <span
                  className={cn(
                    'grid h-6 w-6 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors',
                    isSel ? 'border-accent bg-accent text-ink' : 'border-line text-transparent',
                  )}
                >
                  <Check className={cn('h-3.5 w-3.5', isSel ? 'opacity-100' : 'opacity-0')} strokeWidth={3} />
                </span>
              </motion.button>
            );
          })}
        </AnimatePresence>

        {/* Add player */}
        {adding ? (
          <div className="rounded-card border border-line bg-surface p-5 shadow-inset">
            <Field label="Player name">
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitNew();
                  if (e.key === 'Escape') {
                    setAdding(false);
                    setName('');
                  }
                }}
                placeholder="e.g. Jordan Miller"
                maxLength={40}
              />
            </Field>
            <div className="mt-3 flex gap-3">
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => {
                  setAdding(false);
                  setName('');
                }}
              >
                Cancel
              </Button>
              <Button size="md" className="flex-1" onClick={submitNew} loading={busy} disabled={!name.trim()}>
                Add
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex min-h-[64px] items-center gap-3.5 rounded-card border border-line bg-surface px-4 py-3 text-left transition-colors hover:border-content-muted"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-surface-2 text-content-secondary">
              <UserPlus className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="block font-display text-[20px] tracking-[0.03em] text-content-primary">Add Player</span>
              <span className="block text-[13px] text-content-secondary">Invite someone new</span>
            </span>
          </button>
        )}
      </div>
    </StepShell>
  );
}
