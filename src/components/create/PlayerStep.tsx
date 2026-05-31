import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Plus, AlertTriangle } from 'lucide-react';
import { StepShell } from './StepShell';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { Player } from '@/lib/types';

interface PlayerStepProps {
  players: Player[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onAddPlayer: (name: string) => Promise<void>;
  isDoubles: boolean;
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
    <StepShell
      label="Players"
      heading="Who's playing?"
      subtext={
        <span>
          {count} selected · need at least {isDoubles ? '4 (even)' : '2'}.
        </span>
      }
    >
      <div className="flex flex-col gap-3">
        {/* Add player */}
        <div>
          {!adding ? (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-2 text-sm font-semibold text-accent transition-opacity hover:opacity-80"
            >
              <Plus className="h-4 w-4" /> Add player
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-2"
            >
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
                placeholder="Player name"
                maxLength={40}
              />
              <Button size="md" onClick={submitNew} loading={busy} disabled={!name.trim()}>
                Add
              </Button>
            </motion.div>
          )}
        </div>

        {oddForDoubles && (
          <div className="flex items-center gap-2 rounded-input border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Doubles needs an even number of players.
          </div>
        )}

        {/* Player list */}
        <div className="flex flex-col gap-2">
          {players.length === 0 && (
            <p className="py-6 text-center text-sm text-content-muted">
              No players yet. Add your first one above.
            </p>
          )}
          <AnimatePresence initial={false}>
            {players.map((p) => {
              const isSel = selected.has(p.id);
              return (
                <motion.button
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => onToggle(p.id)}
                  className={cn(
                    'flex items-center gap-3 rounded-input border px-4 py-3 text-left transition-colors',
                    isSel
                      ? 'border-accent/50 bg-accent/[0.06]'
                      : 'border-line bg-bg-card hover:bg-bg-card-hover',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors',
                      isSel ? 'border-accent bg-accent text-bg-primary' : 'border-line',
                    )}
                  >
                    {isSel && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <span className="font-medium text-content-primary">{p.name}</span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </StepShell>
  );
}
