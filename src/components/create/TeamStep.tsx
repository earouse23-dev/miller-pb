import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Users } from 'lucide-react';
import { StepShell } from './StepShell';
import type { Player } from '@/lib/types';

interface TeamStepProps {
  selectedPlayers: Player[];
  /** Emits complete teams (each a pair) whenever pairing changes. */
  onChange: (teams: Array<[string, string]>) => void;
}

export function TeamStep({ selectedPlayers, onChange }: TeamStepProps) {
  // partnerOf[a] = b and partnerOf[b] = a for a formed team.
  const [partnerOf, setPartnerOf] = useState<Record<string, string>>({});

  // Reset pairing if the selected roster changes.
  const rosterKey = selectedPlayers.map((p) => p.id).sort().join(',');
  useEffect(() => {
    setPartnerOf({});
  }, [rosterKey]);

  const byId = useMemo(() => {
    const m = new Map<string, Player>();
    selectedPlayers.forEach((p) => m.set(p.id, p));
    return m;
  }, [selectedPlayers]);

  // Emit completed teams up.
  useEffect(() => {
    const seen = new Set<string>();
    const teams: Array<[string, string]> = [];
    for (const p of selectedPlayers) {
      const partner = partnerOf[p.id];
      if (partner && !seen.has(p.id) && !seen.has(partner)) {
        teams.push([p.id, partner]);
        seen.add(p.id);
        seen.add(partner);
      }
    }
    onChange(teams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerOf, rosterKey]);

  const pair = (a: string, b: string) => {
    setPartnerOf((prev) => ({ ...prev, [a]: b, [b]: a }));
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

  const unpaired = selectedPlayers.filter((p) => !partnerOf[p.id]);
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

  return (
    <StepShell
      label="Teams"
      heading="Form your teams."
      subtext={`${teams.length} team${teams.length === 1 ? '' : 's'} formed · ${unpaired.length} player${
        unpaired.length === 1 ? '' : 's'
      } left.`}
    >
      <div className="flex flex-col gap-4">
        {/* Formed teams */}
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

        {/* Unpaired players, each with a partner dropdown */}
        {unpaired.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="label-eyebrow">Unpaired</p>
            {unpaired.map((p) => {
              const options = unpaired.filter((o) => o.id !== p.id);
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-input border border-line bg-bg-card px-4 py-3"
                >
                  <span className="flex-1 font-medium text-content-primary">{p.name}</span>
                  <select
                    value=""
                    onChange={(e) => e.target.value && pair(p.id, e.target.value)}
                    className="h-9 rounded-input border border-line bg-bg-secondary px-3 text-sm text-content-primary focus:border-accent focus:outline-none"
                  >
                    <option value="">Partner…</option>
                    {options.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StepShell>
  );
}
