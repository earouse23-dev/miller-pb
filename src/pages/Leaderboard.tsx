import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Trophy, Medal } from 'lucide-react';
import { Skeleton } from '@/components/ui/Spinner';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { PlayerProfileModal } from '@/components/tournament/PlayerProfileModal';
import { fetchLeaderboard } from '@/lib/api';
import { isSupabaseConfigured } from '@/lib/supabase';
import { SetupNotice } from '@/components/SetupNotice';
import { toast } from '@/store/useToastStore';
import type { LeaderboardRow } from '@/lib/types';

const EASE = [0.22, 1, 0.36, 1] as const;

// Gold / silver / bronze for the top three.
const MEDALS = ['#F5C84B', '#C4CCD6', '#CD7F4A'];
// Matching spotlight tints for the podium; everyone else gets brand green.
const MEDAL_GLOW = ['rgba(245,200,75,0.22)', 'rgba(196,204,214,0.20)', 'rgba(205,127,74,0.22)'];
const GREEN_GLOW = 'rgba(74,222,128,0.16)';

function winRate(wins: number, losses: number): number {
  const total = wins + losses;
  return total === 0 ? 0 : Math.round((wins / total) * 100);
}

export function Leaderboard() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    fetchLeaderboard()
      .then(setRows)
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Could not load leaderboard.'))
      .finally(() => setLoading(false));
  }, []);

  // Rank best → worst: tournament wins, then win rate, then total match wins.
  const ranked = useMemo(
    () =>
      [...rows].sort(
        (a, b) =>
          b.tournament_wins - a.tournament_wins ||
          winRate(b.total_wins, b.total_losses) - winRate(a.total_wins, a.total_losses) ||
          b.total_wins - a.total_wins ||
          a.name.localeCompare(b.name),
      ),
    [rows],
  );

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  if (!isSupabaseConfigured) return <SetupNotice />;

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Top nav */}
      <div className="sticky top-0 z-20 border-b border-line bg-bg-primary/85 backdrop-blur-md">
        <div className="mx-auto grid max-w-lg grid-cols-[44px_1fr_44px] items-center px-5 py-3">
          <button
            onClick={goBack}
            aria-label="Back to home"
            className="grid h-11 w-11 place-items-center rounded-full text-content-primary transition-colors hover:bg-surface"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="font-display text-center text-2xl uppercase tracking-[0.04em] text-content-primary">
            Leaderboard
          </span>
          <span />
        </div>
      </div>

      <div className="mx-auto max-w-lg px-5 pb-16 pt-5">
        <p className="eyebrow mb-4">All players · ranked by titles & win rate</p>

        {loading ? (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] w-full" />
            ))}
          </div>
        ) : ranked.length === 0 ? (
          <div className="rounded-card border border-line bg-surface p-8 text-center shadow-inset">
            <Trophy className="mx-auto h-8 w-8 text-content-muted" />
            <p className="mt-3 text-[15px] font-medium text-content-primary">No stats yet</p>
            <p className="mt-1 text-[13px] text-content-secondary">
              Player stats appear here after a tournament is saved.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {ranked.map((r, i) => {
              const rate = winRate(r.total_wins, r.total_losses);
              const medal = i < 3 ? MEDALS[i] : null;
              const open = () => setProfile({ id: r.player_id, name: r.name });
              return (
                <motion.div
                  key={r.player_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: EASE, delay: Math.min(i, 5) * 0.04 }}
                >
                  <SpotlightCard
                    spotlightColor={i < 3 ? MEDAL_GLOW[i] : GREEN_GLOW}
                    role="button"
                    tabIndex={0}
                    onClick={open}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        open();
                      }
                    }}
                    className="flex cursor-pointer items-center gap-3.5 p-3.5 text-left"
                  >
                  {/* Rank / medal */}
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full border"
                    style={
                      medal
                        ? { borderColor: medal, color: medal, background: 'transparent' }
                        : { borderColor: 'var(--border)', color: 'var(--muted)' }
                    }
                  >
                    {medal ? <Medal className="h-5 w-5" /> : <span className="font-display text-[18px]">{i + 1}</span>}
                  </span>

                  {/* Name + secondary line */}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[20px] uppercase tracking-[0.02em] text-content-primary">
                      {r.name}
                    </span>
                    <span className="flex items-center gap-2 text-[12px] text-content-secondary">
                      <span className="font-mono">{r.total_wins}–{r.total_losses}</span>
                      <span className="text-content-muted">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Trophy className="h-3 w-3 text-accent" />
                        {r.tournament_wins}
                      </span>
                    </span>
                  </span>

                  {/* Win rate */}
                  <span className="shrink-0 text-right">
                    <span className="font-display text-[24px] leading-none tracking-[0.02em] text-accent">{rate}%</span>
                    <span className="mt-0.5 block text-[10px] uppercase tracking-[0.12em] text-content-muted">
                      Win rate
                    </span>
                  </span>
                  </SpotlightCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <PlayerProfileModal
        open={Boolean(profile)}
        onClose={() => setProfile(null)}
        playerId={profile?.id ?? null}
        playerName={profile?.name ?? null}
        profileOnly
      />
    </div>
  );
}
