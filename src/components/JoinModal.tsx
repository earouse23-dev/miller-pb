import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { fetchTournamentByCode } from '@/lib/api';
import { cn } from '@/lib/utils';

interface JoinModalProps {
  open: boolean;
  onClose: () => void;
}

const LEN = 6;

export function JoinModal({ open, onClose }: JoinModalProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setCode('');
      setError(null);
      window.setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  const join = async () => {
    if (loading) return;
    if (code.length !== LEN) {
      setError('Enter all 6 characters.');
      setShake((s) => s + 1);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const tournament = await fetchTournamentByCode(code);
      if (!tournament) {
        setError('No tournament found with that code.');
        setShake((s) => s + 1);
        return;
      }
      // Don't remember this as the device's active tournament — only the host
      // auto-resumes (set in Tournament once we confirm host identity). A
      // joiner returns to Home next launch and re-enters the code.
      navigate(`/tournament/${tournament.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
      setShake((s) => s + 1);
    } finally {
      setLoading(false);
    }
  };

  const chars = code.padEnd(LEN, ' ').slice(0, LEN).split('');
  const focusIdx = Math.min(code.length, LEN - 1);

  return (
    <Modal open={open} onClose={onClose} variant="slide-up" title="Join" dismissable={!loading}>
      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-medium text-content-secondary">Invite code</label>

        <motion.div
          key={shake}
          animate={shake ? { x: [0, -8, 8, -8, 8, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="relative"
          onClick={() => inputRef.current?.focus()}
        >
          <input
            ref={inputRef}
            value={code}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={LEN}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, LEN));
              setError(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && join()}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          <div className="flex justify-between gap-2">
            {chars.map((c, i) => {
              const active = i === focusIdx && code.length < LEN;
              return (
                <div
                  key={i}
                  className={cn(
                    'grid aspect-[0.84] max-w-[48px] flex-1 place-items-center rounded-input border bg-surface-2',
                    'font-mono text-2xl font-medium text-content-primary transition-colors',
                    error ? 'border-danger' : active ? 'border-accent' : 'border-line',
                  )}
                >
                  {c.trim()}
                </div>
              );
            })}
          </div>
        </motion.div>

        {error ? (
          <span className="text-[12px] text-danger">{error}</span>
        ) : (
          <span className="text-[12px] text-content-secondary">
            Ask the host for the 6-character code.
          </span>
        )}
      </div>

      <Button fullWidth className="mt-5" onClick={join} loading={loading} disabled={code.length !== LEN}>
        Join Tournament
      </Button>
    </Modal>
  );
}
