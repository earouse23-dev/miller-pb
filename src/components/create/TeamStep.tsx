import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Users } from 'lucide-react';
import { StepShell } from './StepShell';
import { cn } from '@/lib/utils';
import type { Player } from '@/lib/types';

interface TeamStepProps {
  selectedPlayers: Player[];
  /** Emits complete teams (each a pair) whenever pairing changes. */
  onChange: (teams: Array<[string, string]>) => void;
}

export function TeamStep({ selectedPlayers, onChange }: TeamStepProps) {
  // partnerOf[a] = b and partnerOf[b] = a for a formed team.
  const [partnerOf, setPartnerOf] = useState<Record<string, string>>({});
  // The player currently armed for tap-to-pair (tap again to deselect).
  const [picked, setPicked] = useState<string | null>(null);
  // The player being dragged (desktop drag-and-drop).
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  // Reset pairing if the selected roster changes.
  const rosterKey = selectedPlayers.map((p) => p.id).sort().join(',');
  useEffect(() => {
    setPartnerOf({});
    setPicked(null);
  }, [rosterKey]);

  const byId = useMemo(() => {
    const m = new Map<string, Player>();
    selectedPlayers.forEach((p) => m.set(p.id, p));
    return m;
  }, [selectedPlayers]);

  const teams: Array<[string, string]> = [];
  const seen = new Set<string>();
  for (const p of selectedPlayers) {
    const partner = partnerOf[p.id];
    if (partner && !seen.has(p.id) && !seen.has(partner)) {
      teams.push([p.id, partner]);
      seen.add(p.id);
      seen.add(partner);
    }
  }

  // Emit completed teams up.
  useEffect(() => {
    onChange(teams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerOf, rosterKey]);

  const pair = (a: string, b: string) => {
    if (a === b) return;
    setPartnerOf((prev) => ({ ...prev, [a]: b, [b]: a }));
    setPicked(null);
  };

  const unpair = (a: string) => {
    setPartnerOf((prev) => {
      const next = { ...prev };
      const b = next[a];
      delete next[a];
      if (b) delete next[b];
      return next;
    });
  };

  const onChipTap = (id: string) => {
    if (picked === null) setPicked(id);
    else if (picked === id) setPicked(null);
    else pair(picked, id);
  };

  const unpaired = selectedPlayers.filter((p) => !partnerOf[p.id]);

  return (
    <StepShell
      label="Teams"
      heading="Form your teams."
      subtext={
        unpaired.length > 0
          ? 'Tap two players to pair them — or drag one onto another.'
          : `${teams.length} team${teams.length === 1 ? '' : 's'} formed.`
      }
    >
      <div className="flex flex-col gap-5">
        {/* Formed teams */}
        {teams.length > 0 && (
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {teams.map(([a, b]) => (
                <motion.div
                  key={`${a}-${b}`}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="flex items-center gap-3 rounded-card border border-accent/40 bg-accent/[0.06] p-4 shadow-glow"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <Users className="h-5 w-5" />
                  </div>
                  <p className="flex-1 font-bold text-content-primary">
                    {byId.get(a)?.name} <span className="text-content-muted">&</span> {byId.get(b)?.name}
                  </p>
                  <button
                    onClick={() => unpair(a)}
                    aria-label="Break up team"
                    className="text-content-muted transition-colors hover:text-danger"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Unpaired pool — tap to pair, or drag one chip onto another. */}
        {unpaired.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <p className="label-eyebrow">Unpaired · {unpaired.length}</p>
            <div className="grid grid-cols-2 gap-2.5">
              {unpaired.map((p) => {
                const isPicked = picked === p.id;
                const isDropTarget = dropTarget === p.id && dragId !== null && dragId !== p.id;
                return (
                  <button
                    key={p.id}
                    draggable
                    onClick={() => onChipTap(p.id)}
                    onDragStart={() => {
                      setDragId(p.id);
                      setPicked(null);
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setDropTarget(null);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragId && dragId !== p.id) setDropTarget(p.id);
                    }}
                    onDragLeave={() => setDropTarget((t) => (t === p.id ? null : t))}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragId && dragId !== p.id) pair(dragId, p.id);
                      setDragId(null);
                      setDropTarget(null);
                    }}
                    className={cn(
                      'flex min-h-[52px] items-center justify-center rounded-card border px-3 py-3 text-center font-medium transition-colors active:scale-[0.98]',
                      isPicked
                        ? 'border-accent bg-accent text-ink'
                        : isDropTarget
                          ? 'border-accent bg-surface-2 text-content-primary'
                          : 'border-line bg-surface text-content-primary hover:border-content-muted',
                      dragId === p.id && 'opacity-40',
                    )}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
            {picked && (
              <p className="text-center text-[13px] text-content-secondary">
                Pairing <span className="font-semibold text-content-primary">{byId.get(picked)?.name}</span> — tap a
                partner.
              </p>
            )}
          </div>
        )}
      </div>
    </StepShell>
  );
}
