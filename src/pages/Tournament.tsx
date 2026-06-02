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
import { BracketView } from '@/components/tournament/BracketView';
import { ChampionOverlay } from '@/components/tournament/ChampionOverlay';
import { PlayerProfileModal } from '@/components/tournament/PlayerProfileModal';
import { CourtDisplay } from '@/components/tournament/CourtDisplay';
import { useTournament } from '@/hooks/useTournament';
import { useTournamentStore } from '@/store/useTournamentStore';
import {
  endTournament as endTournamentApi,
  saveTournamentResults,
  submitScore,
} from '@/lib/api';
import { isDoubles } from '@/lib/utils';
import { clearActiveTournament, setActiveTournament } from '@/lib/utils';
import { isBracketRound, isMatchEditable } from '@/lib/tournament-logic';
import { toast } from '@/store/useToastStore';
import { cn } from '@/lib/utils';
import type { GameFormat, GameScore, Match } from '@/lib/types';

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
    hasBracket,
    champion,
  } = useTournament(id ?? null);

  const [tab, setTab] = useState<TournamentTab>('schedule');
  const [scoringMatch, setScoringMatch] = useState<Match | null>(null);
  const [endOpen, setEndOpen] = useState(false);
  const [ending, setEnding] = useState(false);
  const [profile, setProfile] = useState<{ id: string; name: string } | null>(null);
  const [castOpen, setCastOpen] = useState(false);

  // Remember this as the active tournament so Home can auto-resume it.
  useEffect(() => {
    if (tournament && tournament.status === 'active') setActiveTournament(tournament.id);
  }, [tournament]);

  const handleSubmitScore = async (match: Match, games: GameScore[]) => {
    await submitScore(match, games, matches);
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

  // Champion overlay — Save records results + lifetime stats (idempotent);
  // End flips status to completed and broadcasts to all devices.
  const handleChampionSave = async () => {
    const bundle = useTournamentStore.getState().bundle;
    if (!bundle) return;
    await saveTournamentResults(bundle);
    await useTournamentStore.getState().refresh();
  };

  const handleChampionEnd = async () => {
    const bundle = useTournamentStore.getState().bundle;
    if (!bundle) return;
    await endTournamentApi(bundle); // save (guarded) + complete
    await useTournamentStore.getState().refresh();
  };

  const returnHome = () => {
    // Clear the saved session, then navigate. We deliberately do NOT reset the
    // store synchronously here: doing so re-renders this still-mounted (exiting)
    // page into a null-bundle state mid-transition, which can stall the router's
    // AnimatePresence and leave a blank screen. Home resets the store on mount.
    clearActiveTournament();
    navigate('/', { replace: true });
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
  const bracketRounds = rounds.filter((r) => r.isBracket);
  const rrRounds = rounds.filter((r) => !r.isBracket);
  const championOpen = Boolean(champion) || ended;

  // Scoring config for the match being scored. The format depends on which
  // phase the match is in (round robin vs bracket); legacy rows fall back to a
  // single game to 11.
  const scoreTarget = tournament.score_target ?? 11;
  const scoringFormat: GameFormat = scoringMatch
    ? (isBracketRound(scoringMatch.round_number) ? tournament.bracket_format : tournament.rr_format) ?? 'single'
    : 'single';

  // Completed matches whose score can still be re-entered (nothing already
  // played depends on them). Locked entirely once the tournament has ended.
  const editableMatchIds = new Set<string>();
  if (!ended) {
    for (const m of matches) if (isMatchEditable(m, matches)) editableMatchIds.add(m.id);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        inviteCode={tournament.invite_code}
        role={isHost ? 'host' : 'participant'}
        onCast={() => setCastOpen(true)}
      />

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
              <div className="flex flex-col gap-6">
                {/* Progress */}
                <div className="rounded-card border border-line bg-surface p-4 shadow-inset">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-content-secondary">
                      {progress.completed} of {progress.total} matches done
                    </span>
                    <span className="font-display text-[22px] tracking-[0.02em] text-accent">{pct}%</span>
                  </div>
                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-2">
                    <motion.div
                      className="h-full rounded-full bg-accent"
                      initial={false}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>

                {rounds.length === 0 ? (
                  <LoadingState message="Matches are loading…" />
                ) : (
                  <AnimatePresence mode="wait">
                    {hasBracket ? (
                      <motion.div
                        key="bracket"
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -24 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="flex flex-col gap-5"
                      >
                        <div className="flex items-center gap-2">
                          <span className="label-eyebrow">
                            {rrRounds.length > 0 ? 'Round robin complete · Bracket' : 'Bracket'}
                          </span>
                        </div>
                        <BracketView
                          rounds={bracketRounds}
                          teams={teams}
                          onScore={setScoringMatch}
                          championTeamId={champion?.teamId}
                          editableMatchIds={editableMatchIds}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="rr"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -24 }}
                        transition={{ duration: 0.25 }}
                        className="flex flex-col gap-7"
                      >
                        {rrRounds.map((g) => (
                          <RoundSection
                            key={g.key}
                            group={g}
                            teams={teams}
                            onScore={setScoringMatch}
                            editableMatchIds={editableMatchIds}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
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
              <StandingsTable
                rows={standings}
                teamHeader={teamHeader}
                onPlayerClick={(pid, name) => setProfile({ id: pid, name })}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav active={tab} onChange={setTab} />

      <ScoreModal
        match={scoringMatch}
        team1={scoringMatch?.team1_id ? teams.get(scoringMatch.team1_id) : undefined}
        team2={scoringMatch?.team2_id ? teams.get(scoringMatch.team2_id) : undefined}
        target={scoreTarget}
        format={scoringFormat}
        onClose={() => setScoringMatch(null)}
        onSubmit={handleSubmitScore}
      />

      <EndTournamentModal
        open={endOpen}
        onClose={() => setEndOpen(false)}
        onConfirm={handleEnd}
        loading={ending}
      />

      <ChampionOverlay
        open={championOpen}
        winnerLabel={champion?.label ?? winnerLabel}
        standings={standings}
        code={tournament.invite_code}
        isHost={isHost}
        ended={ended}
        statsSaved={tournament.stats_saved}
        onSave={handleChampionSave}
        onEnd={handleChampionEnd}
        onReturnHome={returnHome}
      />

      <PlayerProfileModal
        open={Boolean(profile)}
        onClose={() => setProfile(null)}
        playerId={profile?.id ?? null}
        playerName={profile?.name ?? null}
      />

      <CourtDisplay
        open={castOpen}
        onClose={() => setCastOpen(false)}
        code={tournament.invite_code}
        matches={matches}
        teams={teams}
      />
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
              'font-display relative pb-3 text-[18px] uppercase tracking-[0.05em] transition-colors',
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
