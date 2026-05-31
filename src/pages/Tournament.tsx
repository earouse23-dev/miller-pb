import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { BottomNav, type TournamentTab } from '@/components/layout/BottomNav';
import { LoadingState } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { RoundSection } from '@/components/tournament/RoundSection';
import { StandingsTable } from '@/components/tournament/StandingsTable';
import { ScoreModal } from '@/components/tournament/ScoreModal';
import { EndTournamentModal } from '@/components/tournament/EndTournamentModal';
import { TournamentEndedModal } from '@/components/tournament/TournamentEndedModal';
import { useTournament } from '@/hooks/useTournament';
import { useTournamentStore } from '@/store/useTournamentStore';
import { endTournament as endTournamentApi, submitScore } from '@/lib/api';
import { isDoubles } from '@/lib/utils';
import { clearActiveTournament, setActiveTournament } from '@/lib/utils';
import { toast } from '@/store/useToastStore';
import { cn } from '@/lib/utils';
import type { Match } from '@/lib/types';

export function Tournament() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    loading,
    error,
    tournament,
    teams,
    matches,
    rounds,
    standings,
    progress,
    isHost,
    winnerLabel,
  } = useTournament(id ?? null);

  const [tab, setTab] = useState<TournamentTab>('schedule');
  const [scoringMatch, setScoringMatch] = useState<Match | null>(null);
  const [endOpen, setEndOpen] = useState(false);
  const [ending, setEnding] = useState(false);

  // Remember this as the active tournament so Home can auto-resume it.
  useEffect(() => {
    if (tournament && tournament.status === 'active') setActiveTournament(tournament.id);
  }, [tournament]);

  const handleSubmitScore = async (match: Match, s1: number, s2: number) => {
    await submitScore(match, s1, s2, matches);
    // Reflect immediately (incl. bracket advancement); realtime syncs others.
    await useTournamentStore.getState().refresh();
  };

  const handleEnd = async () => {
    const bundle = useTournamentStore.getState().bundle;
    if (!bundle) return;
    setEnding(true);
    try {
      await endTournamentApi(bundle);
      await useTournamentStore.getState().refresh();
      setEndOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not end tournament.');
    } finally {
      setEnding(false);
    }
  };

  const returnHome = () => {
    clearActiveTournament();
    useTournamentStore.getState().reset();
    navigate('/');
  };

  // ---- States ----------------------------------------------------------
  if (loading && !tournament) {
    return (
      <div className="min-h-screen">
        <Header />
        <LoadingState message="Loading tournament…" />
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
        <div>
          <h1 className="text-xl font-bold text-content-primary">Tournament unavailable</h1>
          <p className="mt-1 max-w-sm text-sm text-content-secondary">
            {error ?? 'We couldn’t find this tournament.'}
          </p>
        </div>
        <Button onClick={returnHome}>Return to Home</Button>
      </div>
    );
  }

  const doubles = isDoubles(tournament.match_type);
  const teamHeader = doubles ? 'Team' : 'Player';
  const ended = tournament.status === 'completed';
  const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <div className="flex min-h-screen flex-col">
      <Header inviteCode={tournament.invite_code} role={isHost ? 'host' : 'participant'} />

      {/* Desktop tabs */}
      <div className="mx-auto hidden w-full max-w-3xl px-4 pt-4 sm:block">
        <DesktopTabs tab={tab} onChange={setTab} />
      </div>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-4 sm:pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {tab === 'schedule' ? (
              <div className="flex flex-col gap-5">
                {/* Progress + court legend */}
                <div className="flex flex-col gap-3 rounded-card border border-line bg-bg-card p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-content-primary">
                      {progress.completed} of {progress.total} matches complete
                    </span>
                    <span className="font-mono text-sm font-bold text-accent">{pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-bg-secondary">
                    <motion.div
                      className="h-full rounded-full bg-accent shadow-glow"
                      initial={false}
                      animate={{ width: `${pct}%` }}
                      transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                    />
                  </div>
                  <div className="flex items-center gap-4 pt-0.5">
                    <LegendDot color="var(--court1)" label="Court 1" />
                    <LegendDot color="var(--court2)" label="Court 2" />
                  </div>
                </div>

                {rounds.length === 0 ? (
                  <LoadingState message="Matches are loading…" />
                ) : (
                  <div className="flex flex-col gap-7">
                    {rounds.map((g) => (
                      <RoundSection key={g.key} group={g} teams={teams} onScore={setScoringMatch} />
                    ))}
                  </div>
                )}

                {isHost && !ended && (
                  <Button
                    variant="danger"
                    fullWidth
                    size="lg"
                    onClick={() => setEndOpen(true)}
                    className="mt-2"
                  >
                    End tournament
                  </Button>
                )}
              </div>
            ) : (
              <StandingsTable rows={standings} teamHeader={teamHeader} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav active={tab} onChange={setTab} />

      <ScoreModal
        match={scoringMatch}
        team1={scoringMatch?.team1_id ? teams.get(scoringMatch.team1_id) : undefined}
        team2={scoringMatch?.team2_id ? teams.get(scoringMatch.team2_id) : undefined}
        onClose={() => setScoringMatch(null)}
        onSubmit={handleSubmitScore}
      />

      <EndTournamentModal
        open={endOpen}
        onClose={() => setEndOpen(false)}
        onConfirm={handleEnd}
        loading={ending}
      />

      <TournamentEndedModal open={ended} winnerLabel={winnerLabel} onReturnHome={returnHome} />
    </div>
  );
}

function DesktopTabs({ tab, onChange }: { tab: TournamentTab; onChange: (t: TournamentTab) => void }) {
  const items: Array<{ id: TournamentTab; label: string }> = [
    { id: 'schedule', label: 'Schedule' },
    { id: 'standings', label: 'Standings' },
  ];
  return (
    <div className="flex gap-6 border-b border-line">
      {items.map((it) => {
        const active = tab === it.id;
        return (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            className={cn(
              'relative pb-3 text-sm font-semibold transition-colors',
              active ? 'text-content-primary' : 'text-content-muted hover:text-content-secondary',
            )}
          >
            {it.label}
            {active && (
              <motion.span
                layoutId="desktop-tab-underline"
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-label text-content-secondary">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
