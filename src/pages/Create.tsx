import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { FormatStep } from '@/components/create/FormatStep';
import { ScoringStep } from '@/components/create/ScoringStep';
import { MatchTypeStep } from '@/components/create/MatchTypeStep';
import { PlayerStep } from '@/components/create/PlayerStep';
import { TeamStep } from '@/components/create/TeamStep';
import { addPlayer, createTournament, fetchPlayers } from '@/lib/api';
import { getUserIdentity, isDoubles, setActiveTournament } from '@/lib/utils';
import { toast } from '@/store/useToastStore';
import type { GameFormat, MatchType, Player, ScoreTarget, TournamentFormat } from '@/lib/types';

const STEP_TITLES = ['Format', 'Scoring', 'Match Type', 'Players', 'Teams'];

export function Create() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);

  const [format, setFormat] = useState<TournamentFormat | null>(null);
  const [scoreTarget, setScoreTarget] = useState<ScoreTarget | null>(null);
  const [rrFormat, setRrFormat] = useState<GameFormat | null>(null);
  const [bracketFormat, setBracketFormat] = useState<GameFormat | null>(null);
  const [matchType, setMatchType] = useState<MatchType | null>(null);

  const [players, setPlayers] = useState<Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fixedTeams, setFixedTeams] = useState<Array<[string, string]>>([]);
  const [creating, setCreating] = useState(false);

  const doubles = matchType ? isDoubles(matchType) : false;
  const needsTeamStep = matchType === 'doubles_fixed';
  const totalSteps = needsTeamStep ? 5 : 4;

  useEffect(() => {
    fetchPlayers()
      .then(setPlayers)
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Could not load players.'))
      .finally(() => setPlayersLoading(false));
  }, []);

  const selectedPlayers = useMemo(
    () => players.filter((p) => selected.has(p.id)),
    [players, selected],
  );

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleAddPlayer = async (name: string) => {
    try {
      const player = await addPlayer(name);
      setPlayers((prev) => (prev.some((p) => p.id === player.id) ? prev : [...prev, player].sort((a, b) => a.name.localeCompare(b.name))));
      setSelected((prev) => new Set(prev).add(player.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not add player.');
    }
  };

  const scoringComplete = (): boolean => {
    if (scoreTarget == null) return false;
    if (format === 'round_robin') return rrFormat != null;
    if (format === 'bracket') return bracketFormat != null;
    if (format === 'both') return rrFormat != null && bracketFormat != null;
    return false;
  };

  const canAdvance = (): boolean => {
    if (step === 1) return format !== null;
    if (step === 2) return scoringComplete();
    if (step === 3) return matchType !== null;
    if (step === 4) {
      const n = selected.size;
      if (doubles) return n >= 4 && n % 2 === 0;
      return n >= 2;
    }
    if (step === 5) return fixedTeams.length * 2 === selected.size && selected.size >= 4;
    return false;
  };

  const goNext = () => {
    setDir(1);
    setStep((s) => Math.min(s + 1, totalSteps));
  };
  const goBack = () => {
    if (step === 1) {
      navigate('/');
      return;
    }
    setDir(-1);
    setStep((s) => Math.max(s - 1, 1));
  };

  const buildTeams = (): Array<[string] | [string, string]> => {
    if (matchType === 'singles') {
      return selectedPlayers.map((p) => [p.id] as [string]);
    }
    if (matchType === 'doubles_fixed') {
      return fixedTeams;
    }
    // doubles_random: shuffle then pair sequentially.
    const ids = selectedPlayers.map((p) => p.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    const pairs: Array<[string, string]> = [];
    for (let i = 0; i + 1 < ids.length; i += 2) pairs.push([ids[i], ids[i + 1]]);
    return pairs;
  };

  const handleCreate = async () => {
    if (!format || !matchType || !scoreTarget || creating) return;
    setCreating(true);
    try {
      const tournament = await createTournament({
        format,
        matchType,
        hostIdentity: getUserIdentity(),
        teams: buildTeams(),
        scoreTarget,
        // Only persist a format for phases this structure actually has.
        rrFormat: format === 'bracket' ? null : rrFormat,
        bracketFormat: format === 'round_robin' ? null : bracketFormat,
      });
      setActiveTournament(tournament.id);
      navigate(`/tournament/${tournament.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create tournament.');
      setCreating(false);
    }
  };

  const isLastStep = step === totalSteps;

  return (
    <div className="min-h-screen bg-ambient">
      {/* Top bar: progress + close */}
      <div className="sticky top-0 z-20 border-b border-line bg-bg-primary/85 backdrop-blur-md">
        <div className="mx-auto max-w-lg px-5 pt-3 pb-3">
          <div className="grid grid-cols-[44px_1fr_44px] items-center">
            <button
              onClick={goBack}
              aria-label="Back"
              className="grid h-11 w-11 place-items-center rounded-full text-content-primary transition-colors hover:bg-surface"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="font-display text-center text-2xl uppercase tracking-[0.04em] text-content-primary">
              {STEP_TITLES[step - 1]}
            </span>
            <span />
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2">
            <motion.div
              className="h-full rounded-full bg-accent"
              initial={false}
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-5 pb-32 pt-6">
        <div className="relative">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -32 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {step === 1 && <FormatStep value={format} onChange={setFormat} />}
              {step === 2 && (
                <ScoringStep
                  structure={format ?? 'round_robin'}
                  target={scoreTarget}
                  onTargetChange={setScoreTarget}
                  rrFormat={rrFormat}
                  onRrFormatChange={setRrFormat}
                  bracketFormat={bracketFormat}
                  onBracketFormatChange={setBracketFormat}
                />
              )}
              {step === 3 && <MatchTypeStep value={matchType} onChange={setMatchType} />}
              {step === 4 &&
                (playersLoading ? (
                  <div className="flex justify-center py-16">
                    <Spinner size={32} />
                  </div>
                ) : (
                  <PlayerStep
                    players={players}
                    selected={selected}
                    onToggle={toggle}
                    onAddPlayer={handleAddPlayer}
                    isDoubles={doubles}
                  />
                ))}
              {step === 5 && (
                <TeamStep selectedPlayers={selectedPlayers} onChange={setFixedTeams} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Sticky footer nav */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg-primary/90 px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md">
        <div className="mx-auto max-w-lg">
          {isLastStep ? (
            <Button fullWidth onClick={handleCreate} loading={creating} disabled={!canAdvance()}>
              Create Tournament
            </Button>
          ) : (
            <Button fullWidth onClick={goNext} disabled={!canAdvance()}>
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
