import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Grid3x3, Trophy, ArrowRight } from 'lucide-react';
import { Brand } from '@/components/layout/Brand';
import { JoinModal } from '@/components/JoinModal';
import { fetchTournamentById } from '@/lib/api';
import { isSupabaseConfigured } from '@/lib/supabase';
import { clearActiveTournament, getActiveTournamentId } from '@/lib/utils';
import { SetupNotice } from '@/components/SetupNotice';

export function Home() {
  const navigate = useNavigate();
  const [joinOpen, setJoinOpen] = useState(false);
  const [checking, setChecking] = useState(true);

  // Auto-resume an active tournament saved on this device.
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
        if (t && t.status === 'active') {
          navigate(`/tournament/${t.id}`, { replace: true });
        } else {
          clearActiveTournament();
          setChecking(false);
        }
      })
      .catch(() => {
        setChecking(false);
      });
  }, [navigate]);

  if (!isSupabaseConfigured) return <SetupNotice />;

  return (
    <div className="relative min-h-screen overflow-hidden bg-ambient">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-6">
        <Brand />

        <div className="flex flex-1 flex-col justify-center py-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="label-eyebrow">Tournament Time</p>
            <h1 className="mt-3 text-5xl font-extrabold leading-[1.05] tracking-tight text-content-primary sm:text-6xl">
              Run a clean
              <br />
              <span className="text-accent">pickleball night.</span>
            </h1>
            <p className="mt-4 max-w-md text-base text-content-secondary">
              Create a tournament, share the code, and let everyone follow the bracket and standings
              live.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-10 grid gap-4 sm:grid-cols-2"
          >
            {/* Join */}
            <button
              onClick={() => setJoinOpen(true)}
              disabled={checking}
              className="group flex flex-col items-start gap-4 rounded-card border border-line bg-bg-card p-6 text-left transition-all duration-200 hover:border-content-muted/50 hover:bg-bg-card-hover disabled:opacity-60"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-input bg-bg-secondary text-content-secondary">
                <Grid3x3 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-bold text-content-primary">Join Tournament</p>
                <p className="mt-1 text-sm text-content-secondary">
                  Enter the 6-character invite code from your host.
                </p>
              </div>
            </button>

            {/* Create */}
            <button
              onClick={() => navigate('/create')}
              disabled={checking}
              className="group flex flex-col items-start gap-4 rounded-card bg-accent p-6 text-left text-bg-primary shadow-glow transition-all duration-200 hover:bg-accent-dark hover:shadow-glow-lg disabled:opacity-60"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-input bg-bg-primary/15">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-lg font-bold">
                  Create Tournament
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </p>
                <p className="mt-1 text-sm font-medium text-bg-primary/70">
                  Pick format, players, and we'll build the schedule.
                </p>
              </div>
            </button>
          </motion.div>
        </div>
      </div>

      <JoinModal open={joinOpen} onClose={() => setJoinOpen(false)} />
    </div>
  );
}
