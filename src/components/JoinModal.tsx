import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { fetchTournamentByCode } from '@/lib/api';
import { setActiveTournament } from '@/lib/utils';

interface JoinModalProps {
  open: boolean;
  onClose: () => void;
}

export function JoinModal({ open, onClose }: JoinModalProps) {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setCode('');
      setError(null);
    }
  }, [open]);

  const join = async () => {
    if (loading) return;
    if (code.length !== 6) {
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
      setActiveTournament(tournament.id);
      navigate(`/tournament/${tournament.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
      setShake((s) => s + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} variant="slide-up" dismissable={!loading}>
      <p className="label-eyebrow">Join Tournament</p>
      <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-content-primary">Enter code</h2>

      <motion.div key={shake} animate={shake ? { x: [0, -8, 8, -8, 8, 0] } : {}} transition={{ duration: 0.4 }} className="mt-5">
        <input
          autoFocus
          value={code}
          onChange={(e) => {
            const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
            setCode(v);
            setError(null);
          }}
          onKeyDown={(e) => e.key === 'Enter' && join()}
          placeholder="ABC123"
          maxLength={6}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          className="w-full rounded-input border bg-bg-secondary py-4 text-center font-mono text-3xl font-bold uppercase tracking-[0.4em] text-content-primary placeholder:text-content-muted focus:border-accent focus:shadow-glow focus:outline-none"
          style={{ borderColor: error ? 'var(--error)' : 'var(--border)' }}
        />
      </motion.div>

      {error && <p className="mt-3 text-center text-sm font-medium text-danger">{error}</p>}

      <div className="mt-6 flex items-center justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={join} loading={loading} disabled={code.length !== 6}>
          Join
        </Button>
      </div>
    </Modal>
  );
}
