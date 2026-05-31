import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Trophy, Share2, ListOrdered, Save, Check, Home, Flag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
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

  useEffect(() => {
    setSaved(statsSaved);
  }, [statsSaved]);

  // Confetti burst when the celebration first appears.
  useEffect(() => {
    if (open) fireConfetti();
  }, [open]);

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
          className="fixed inset-0 z-[55] flex flex-col items-center justify-center overflow-y-auto bg-bg-primary/95 px-6 py-10 backdrop-blur-md bg-ambient"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="flex w-full max-w-sm flex-col items-center text-center"
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
              className="flex h-24 w-24 items-center justify-center rounded-full bg-accent/15 shadow-glow-lg"
            >
              <Trophy className="h-12 w-12 text-accent" />
            </motion.div>

            <p className="mt-6 label-eyebrow">Champion</p>
            <h1 className="mt-2 text-4xl font-extrabold leading-tight tracking-tight text-content-primary">
              {winnerLabel ?? 'Great games!'}
            </h1>
            <p className="mt-2 text-sm text-content-secondary">Miller Pickleball · code {code}</p>

            {/* Share */}
            <div className="mt-8 grid w-full grid-cols-2 gap-3">
              <Button variant="secondary" onClick={doShareWinner}>
                <Share2 className="h-4 w-4" /> Winner
              </Button>
              <Button variant="secondary" onClick={doShareStandings}>
                <ListOrdered className="h-4 w-4" /> Standings
              </Button>
            </div>

            {/* Host actions / completion */}
            <div className="mt-3 w-full">
              {ended ? (
                <Button fullWidth size="lg" onClick={onReturnHome}>
                  <Home className="h-4 w-4" /> Return to Home
                </Button>
              ) : isHost ? (
                <div className="flex flex-col gap-3">
                  {!saved ? (
                    <Button fullWidth size="lg" onClick={doSave} loading={saving}>
                      <Save className="h-4 w-4" /> Save results
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 rounded-input border border-success/40 bg-success/10 py-2.5 text-sm font-semibold text-success">
                      <Check className="h-4 w-4" /> Saved to lifetime stats
                    </div>
                  )}
                  <Button
                    variant={saved ? 'primary' : 'danger'}
                    fullWidth
                    size="lg"
                    onClick={doEnd}
                    loading={ending}
                  >
                    <Flag className="h-4 w-4" /> End tournament
                  </Button>
                </div>
              ) : (
                <p className="rounded-input border border-line bg-bg-card py-3 text-sm text-content-secondary">
                  Waiting for the host to finish…
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
