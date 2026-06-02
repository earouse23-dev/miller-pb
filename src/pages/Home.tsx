import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Brand } from '@/components/layout/Brand';
import { Button } from '@/components/ui/Button';
import { JoinPanel } from '@/components/JoinPanel';
import { fetchTournamentById } from '@/lib/api';
import { isSupabaseConfigured } from '@/lib/supabase';
import { clearActiveTournament, getActiveTournamentId, getUserIdentity } from '@/lib/utils';
import { useTournamentStore } from '@/store/useTournamentStore';
import { SetupNotice } from '@/components/SetupNotice';

const EASE = [0.22, 1, 0.36, 1] as const;

export function Home() {
  const navigate = useNavigate();
  const [joinOpen, setJoinOpen] = useState(false);
  const [checking, setChecking] = useState(true);

  // Clear any leftover live-tournament state when we land on Home. This keeps
  // the store from holding a stale bundle after a tournament ends (Bug 2).
  useEffect(() => {
    useTournamentStore.getState().reset();
  }, []);

  // Auto-resume an active tournament saved on this device — but ONLY for the
  // host who created it. Joiners always land here so they can enter a code (or
  // create), instead of being pulled back into someone else's live tournament.
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setChecking(false);
      return;
    }
    const activeId = getActiveTournamentId();
    if (!activeId) {
      setChecking(false);
      return;
    }
    fetchTournamentById(activeId)
      .then((t) => {
        if (t && t.status === 'active' && t.host_identity === getUserIdentity()) {
          navigate(`/tournament/${t.id}`, { replace: true });
        } else {
          clearActiveTournament();
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [navigate]);

  if (!isSupabaseConfigured) return <SetupNotice />;

  return (
    <div className="app-texture min-h-screen bg-bg-primary">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+28px)]">
        {/* Logo centered at ~40% height */}
        <div className="flex min-h-[40%] items-end justify-center pt-[15vh]">
          <Brand size="lg" />
        </div>

        <div className="flex-1" />

        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.04 } } }}
          className="flex flex-col gap-4"
        >
          {/* Inline invite-code entry, directly above Create. Stays in normal
              flow so the mobile keyboard scrolls it into view. */}
          <AnimatePresence>
            {joinOpen && <JoinPanel key="join-panel" onCancel={() => setJoinOpen(false)} />}
          </AnimatePresence>

          <motion.div
            variants={{ hidden: { y: 8 }, show: { y: 0 } }}
            transition={{ duration: 0.22, ease: EASE }}
          >
            <Button fullWidth disabled={checking} onClick={() => navigate('/create')}>
              Create Tournament
            </Button>
          </motion.div>
          {!joinOpen && (
            <motion.div
              variants={{ hidden: { y: 8 }, show: { y: 0 } }}
              transition={{ duration: 0.22, ease: EASE }}
            >
              <Button fullWidth variant="secondary" disabled={checking} onClick={() => setJoinOpen(true)}>
                Join Tournament
              </Button>
            </motion.div>
          )}
          <motion.div
            variants={{ hidden: { y: 8 }, show: { y: 0 } }}
            transition={{ duration: 0.22, ease: EASE }}
          >
            <Button fullWidth variant="ghost" onClick={() => navigate('/leaderboard')}>
              Leaderboard
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
