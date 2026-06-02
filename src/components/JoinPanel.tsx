import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { fetchTournamentByCode } from '@/lib/api';
import { cn } from '@/lib/utils';

interface JoinPanelProps {
  onCancel: () => void;
}

const LEN = 6;

/** Inline invite-code entry that lives in the Home button stack (above Create),
 *  rather than a floating modal — so the mobile keyboard scrolls it into view
 *  instead of burying it off-screen. */
export function JoinPanel({ onCancel }: JoinPanelProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 80);
    return () => window.clearTimeout(t);
  }, []);

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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-card border border-line bg-surface p-4 shadow-inset"
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-2xl uppercase tracking-[0.03em] text-content-primary">Join</span>
        <button
          onClick={onCancel}
          aria-label="Cancel"
          disabled={loading}
          className="grid h-9 w-9 place-items-center rounded-full text-content-secondary transition-colors hover:bg-surface-2 hover:text-content-primary"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <motion.div
        key={shake}
        animate={shake ? { x: [0, -8, 8, -8, 8, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="relative mt-3"
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
        <span className="mt-2 block text-[12px] text-danger">{error}</span>
      ) : (
        <span className="mt-2 block text-[12px] text-content-secondary">Ask the host for the 6-character code.</span>
      )}

      <Button fullWidth className="mt-4" onClick={join} loading={loading} disabled={code.length !== LEN}>
        Join Tournament
      </Button>
    </motion.div>
  );
}
