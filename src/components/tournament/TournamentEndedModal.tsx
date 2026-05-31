import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { fireConfetti } from '@/lib/confetti';

interface TournamentEndedModalProps {
  open: boolean;
  winnerLabel: string | null;
  onReturnHome: () => void;
}

export function TournamentEndedModal({ open, winnerLabel, onReturnHome }: TournamentEndedModalProps) {
  // Fire confetti the moment the modal opens.
  useEffect(() => {
    if (open) fireConfetti();
  }, [open]);

  return (
    <Modal open={open} onClose={() => {}} variant="scale" dismissable={false} showClose={false}>
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/15 shadow-glow-lg"
        >
          <Trophy className="h-10 w-10 text-accent" />
        </motion.div>

        <div>
          <p className="label-eyebrow">Tournament Ended</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-content-primary">
            {winnerLabel ?? 'Great games!'}
          </h2>
          {winnerLabel && <p className="mt-1 text-sm text-content-secondary">takes the crown 🏆</p>}
        </div>

        <Button fullWidth size="lg" onClick={onReturnHome} className="mt-2">
          Return to Home
        </Button>
      </div>
    </Modal>
  );
}
