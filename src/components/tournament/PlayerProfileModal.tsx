import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Trophy, Medal } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { fetchLeaderboard, fetchLifetimeStats } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from '@/store/useToastStore';
import type { LeaderboardRow, LifetimeStats } from '@/lib/types';

interface PlayerProfileModalProps {
  open: boolean;
  onClose: () => void;
  playerId: string | null;
  playerName: string | null;
}

type Tab = 'profile' | 'leaderboard';

function winRate(wins: number, losses: number): number {
  const total = wins + losses;
  return total === 0 ? 0 : Math.round((wins / total) * 100);
}

export function PlayerProfileModal({ open, onClose, playerId, playerName }: PlayerProfileModalProps) {
  const [tab, setTab] = useState<Tab>('profile');
  const [activeId, setActiveId] = useState<string | null>(playerId);
  const [activeName, setActiveName] = useState<string | null>(playerName);

  const [stats, setStats] = useState<LifetimeStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [board, setBoard] = useState<LeaderboardRow[]>([]);
  const [boardLoading, setBoardLoading] = useState(false);

  // Reset to the tapped player whenever the modal (re)opens.
  useEffect(() => {
    if (open) {
      setActiveId(playerId);
      setActiveName(playerName);
      setTab('profile');
    }
  }, [open, playerId, playerName]);

  // Load the active player's lifetime stats.
  useEffect(() => {
    if (!open || !activeId) return;
    setStatsLoading(true);
    fetchLifetimeStats(activeId)
      .then(setStats)
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Could not load stats.'))
      .finally(() => setStatsLoading(false));
  }, [open, activeId]);

  // Load the leaderboard when its tab is first opened.
  useEffect(() => {
    if (!open || tab !== 'leaderboard') return;
    setBoardLoading(true);
    fetchLeaderboard()
      .then(setBoard)
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Could not load leaderboard.'))
      .finally(() => setBoardLoading(false));
  }, [open, tab]);

  return (
    <Modal open={open} onClose={onClose} variant="slide-up" className="max-w-lg">
      {/* Tabs */}
      <div className="mb-5 flex gap-6 border-b border-line">
        {(['profile', 'leaderboard'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'relative pb-2.5 text-sm font-semibold capitalize transition-colors',
              tab === t ? 'text-content-primary' : 'text-content-muted hover:text-content-secondary',
            )}
          >
            {t}
            {tab === t && (
              <motion.span
                layoutId="profile-tab-underline"
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent"
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16 }}
        >
          {tab === 'profile' ? (
            <ProfilePanel name={activeName} stats={stats} loading={statsLoading} />
          ) : (
            <LeaderboardPanel
              rows={board}
              loading={boardLoading}
              activeId={activeId}
              onPick={(row) => {
                setActiveId(row.player_id);
                setActiveName(row.name);
                setTab('profile');
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </Modal>
  );
}

function ProfilePanel({
  name,
  stats,
  loading,
}: {
  name: string | null;
  stats: LifetimeStats | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size={30} />
      </div>
    );
  }

  const s: LifetimeStats = stats ?? {
    player_id: '',
    total_wins: 0,
    total_losses: 0,
    total_points_for: 0,
    total_points_against: 0,
    tournament_wins: 0,
    tournaments_played: 0,
    updated_at: '',
  };
  const diff = s.total_points_for - s.total_points_against;

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Trophy className="h-6 w-6" />
        </div>
        <div>
          <h2 className="font-display text-[32px] uppercase leading-none tracking-[0.02em] text-content-primary">
            {name ?? 'Player'}
          </h2>
          <p className="text-[13px] text-content-secondary">{s.tournaments_played} tournaments played</p>
        </div>
      </div>

      {!stats && (
        <p className="mt-4 rounded-input border border-line bg-bg-secondary px-3 py-2 text-sm text-content-muted">
          No saved stats yet — they appear after a tournament is saved.
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Stat label="Tournament wins" value={s.tournament_wins} accent />
        <Stat label="Win rate" value={`${winRate(s.total_wins, s.total_losses)}%`} accent />
        <Stat label="Match wins" value={s.total_wins} />
        <Stat label="Match losses" value={s.total_losses} />
        <Stat label="Points for" value={s.total_points_for} />
        <Stat label="Points against" value={s.total_points_against} />
        <Stat
          label="Point differential"
          value={`${diff > 0 ? '+' : ''}${diff}`}
          tone={diff > 0 ? 'success' : diff < 0 ? 'danger' : 'muted'}
        />
        <Stat label="Tournaments" value={s.tournaments_played} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  tone,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  tone?: 'success' | 'danger' | 'muted';
}) {
  const color = accent
    ? 'text-accent'
    : tone === 'success'
      ? 'text-success'
      : tone === 'danger'
        ? 'text-danger'
        : 'text-content-primary';
  return (
    <div className="rounded-input border border-line bg-surface p-3 shadow-inset">
      <p className="eyebrow">{label}</p>
      <p className={cn('font-display mt-1 text-[28px] tracking-[0.02em]', color)}>{value}</p>
    </div>
  );
}

function LeaderboardPanel({
  rows,
  loading,
  activeId,
  onPick,
}: {
  rows: LeaderboardRow[];
  loading: boolean;
  activeId: string | null;
  onPick: (row: LeaderboardRow) => void;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size={30} />
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-content-muted">
        No lifetime stats yet. Save a tournament to start the leaderboard.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-card border border-line">
      <div className="grid grid-cols-[28px_1fr_44px_44px_48px] gap-2 border-b border-line bg-bg-secondary px-3 py-2">
        <Head>#</Head>
        <Head className="text-left">Name</Head>
        <Head>T-Win</Head>
        <Head>Wins</Head>
        <Head>Rate</Head>
      </div>
      <div className="max-h-[46vh] overflow-y-auto">
        {rows.map((r, i) => {
          const isActive = r.player_id === activeId;
          return (
            <button
              key={r.player_id}
              onClick={() => onPick(r)}
              className={cn(
                'grid w-full grid-cols-[28px_1fr_44px_44px_48px] items-center gap-2 border-b border-line/50 px-3 py-2.5 text-left last:border-b-0 transition-colors',
                isActive ? 'bg-accent/[0.08]' : 'hover:bg-bg-card-hover',
              )}
            >
              <span className="flex items-center justify-center">
                {i === 0 ? (
                  <Medal className="h-4 w-4 text-accent" />
                ) : (
                  <span className="font-mono text-sm font-bold text-accent">{i + 1}</span>
                )}
              </span>
              <span className="truncate font-semibold text-content-primary">{r.name}</span>
              <Cell className="font-bold text-accent">{r.tournament_wins}</Cell>
              <Cell>{r.total_wins}</Cell>
              <Cell className="text-content-secondary">{winRate(r.total_wins, r.total_losses)}%</Cell>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Head({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('text-center text-[10px] font-bold uppercase tracking-label text-content-muted', className)}>
      {children}
    </div>
  );
}

function Cell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('text-center font-mono text-sm text-content-primary', className)}>{children}</div>;
}
