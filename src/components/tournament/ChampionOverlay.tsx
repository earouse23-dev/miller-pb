import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Trophy, Share2, ListOrdered, Save, Check, Home, Flag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { Counter } from '@/components/ui/animated-counter';
import { fireConfetti } from '@/lib/confetti';
import { shareStandings, shareWinner } from '@/lib/share';
import { toast } from '@/store/useToastStore';
import type { StandingRow } from '@/lib/types';

interface ChampionOverlayProps {
  open: boolean;
  winnerLabel: string | null;
  standings: StandingRow[];
  code: string;
  isHost: boolean;
  ended: boolean;
  statsSaved: boolean;
  onSave: () => Promise<void>;
  onEnd: () => Promise<void>;
  onReturnHome: () => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.22, ease: EASE, delay }}>
      {children}
    </motion.div>
  );
}

export function ChampionOverlay({
  open,
  winnerLabel,
  standings,
  code,
  isHost,
  ended,
  statsSaved,
  onSave,
  onEnd,
  onReturnHome,
}: ChampionOverlayProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(statsSaved);
  const [ending, setEnding] = useState(false);

  useEffect(() => setSaved(statsSaved), [statsSaved]);

  // Keep the confetti celebration (per product decision).
  useEffect(() => {
    if (open) fireConfetti();
  }, [open]);

  const champ = standings.find((s) => s.label === winnerLabel) ?? standings[0];

  const doShareWinner = async () => {
    if (!winnerLabel) return;
    const r = await shareWinner(winnerLabel, code);
    if (r === 'copied') toast.success('Winner copied!');
    else if (r === 'failed') toast.error('Could not share.');
  };
  const doShareStandings = async () => {
    const r = await shareStandings(standings, code);
    if (r === 'copied') toast.success('Standings copied!');
    else if (r === 'failed') toast.error('Could not share.');
  };
  const doSave = async () => {
    setSaving(true);
    try {
      await onSave();
      setSaved(true);
      toast.success('Saved!');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  };
  const doEnd = async () => {
    setEnding(true);
    try {
      await onEnd();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not end tournament.');
      setEnding(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[55] flex flex-col overflow-y-auto bg-bg-primary px-5 pb-[calc(env(safe-area-inset-bottom)+28px)] pt-[56px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <FadeUp>
              <div className="grid h-24 w-24 place-items-center rounded-full border border-accent bg-accent-dim text-accent">
                <Trophy className="h-11 w-11" />
              </div>
            </FadeUp>
            <FadeUp delay={0.08}>
              <p className="eyebrow mt-6">Champion</p>
            </FadeUp>
            <FadeUp delay={0.16}>
              <h1 className="font-display mt-3 text-[64px] uppercase leading-[0.92] tracking-[0.02em] text-accent">
                {winnerLabel ?? 'Great games!'}
              </h1>
            </FadeUp>
            <FadeUp delay={0.24}>
              <p className="mt-2 text-[15px] text-content-secondary">Miller Pickleball · code {code}</p>
            </FadeUp>
          </div>

          {/* Stat card */}
          {champ && (
            <FadeUp delay={0.32}>
              <SpotlightCard className="p-5" spotlightColor="rgba(74,222,128,0.18)">
                <StatRow k="Record" v={`${champ.wins}–${champ.losses}`} accent />
                <StatRow k="Points for" v={`${champ.points_for}`} count={champ.points_for} />
                <StatRow k="Point differential" v={`${champ.diff > 0 ? '+' : ''}${champ.diff}`} />
              </SpotlightCard>
            </FadeUp>
          )}

          {/* Actions */}
          <FadeUp delay={0.4}>
            <div className="mt-4 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" size="md" onClick={doShareWinner}>
                  <Share2 className="h-4 w-4" /> Winner
                </Button>
                <Button variant="secondary" size="md" onClick={doShareStandings}>
                  <ListOrdered className="h-4 w-4" /> Standings
                </Button>
              </div>

              {ended ? (
                <Button fullWidth onClick={onReturnHome}>
                  <Home className="h-4 w-4" /> Back to Home
                </Button>
              ) : isHost ? (
                <>
                  {!saved ? (
                    <Button fullWidth onClick={doSave} loading={saving}>
                      <Save className="h-4 w-4" /> Save results
                    </Button>
                  ) : (
                    <div className="flex h-[52px] items-center justify-center gap-2 rounded-input border border-accent/40 bg-accent-dim text-[14px] font-medium text-accent">
                      <Check className="h-4 w-4" /> Saved to lifetime stats
                    </div>
                  )}
                  <Button variant={saved ? 'primary' : 'danger'} fullWidth onClick={doEnd} loading={ending}>
                    <Flag className="h-4 w-4" /> End Tournament
                  </Button>
                </>
              ) : (
                <p className="rounded-input border border-line bg-surface py-3 text-center text-[14px] text-content-secondary">
                  Waiting for the host to finish…
                </p>
              )}
            </div>
          </FadeUp>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StatRow({ k, v, accent, count }: { k: string; v: string; accent?: boolean; count?: number }) {
  return (
    <div className="flex items-center justify-between border-line py-2.5 [&:not(:first-child)]:border-t">
      <span className="text-[14px] text-content-secondary">{k}</span>
      {count != null ? (
        <Counter
          end={count}
          duration={1}
          fontSize={22}
          className={`!px-0 font-display tracking-[0.02em] ${accent ? '!text-accent' : '!text-content-primary'}`}
        />
      ) : (
        <span className={`font-display text-[22px] tracking-[0.02em] ${accent ? 'text-accent' : 'text-content-primary'}`}>
          {v}
        </span>
      )}
    </div>
  );
}
