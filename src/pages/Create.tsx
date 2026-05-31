import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { Brand } from '@/components/layout/Brand';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { FormatStep } from '@/components/create/FormatStep';
import { MatchTypeStep } from '@/components/create/MatchTypeStep';
import { PlayerStep } from '@/components/create/PlayerStep';
import { TeamStep } from '@/components/create/TeamStep';
import { addPlayer, createTournament, fetchPlayers } from '@/lib/api';
import { getUserIdentity, isDoubles, setActiveTournament } from '@/lib/utils';
import { toast } from '@/store/useToastStore';
import type { MatchType, Player, TournamentFormat } from '@/lib/types';

export function Create() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);

  const [format, setFormat] = useState<TournamentFormat | null>(null);
  const [matchType, setMatchType] = useState<MatchType | null>(null);

  const [players, setPlayers] = useState<Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fixedTeams, setFixedTeams] = useState<Array<[string, string]>>([]);
  const [creating, setCreating] = useState(false);

  const doubles = matchType ? isDoubles(matchType) : false;
  const needsTeamStep = matchType === 'doubles_fixed';
  const totalSteps = needsTeamStep ? 4 : 3;

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

  const canAdvance = (): boolean => {
    if (step === 1) return format !== null;
    if (step === 2) return matchType !== null;
    if (step === 3) {
      const n = selected.size;
      if (doubles) return n >= 4 && n % 2 === 0;
      return n >= 2;
    }
    if (step === 4) return fixedTeams.length * 2 === selected.size && selected.size >= 4;
    return false;
  };

  const goNext = () => {
    setDir(1);
    setStep((s) => Math.min(s + 1, totalSteps));
  };
  const goBack = () => {
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
    if (!format || !matchType || creating) return;
    setCreating(true);
    try {
      const tournament = await createTournament({
        format,
        matchType,
        hostIdentity: getUserIdentity(),
        teams: buildTeams(),
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
        <div className="mx-auto flex max-w-lg items-center gap-4 px-4 py-3">
          <button
            onClick={() => navigate('/')}
            aria-label="Cancel"
            className="text-content-muted transition-colors hover:text-content-primary"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex flex-1 items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                <motion.div
                  className="h-full rounded-full bg-accent"
                  initial={false}
                  animate={{ width: i < step ? '100%' : '0%' }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            ))}
          </div>
          <span className="text-[11px] font-bold uppercase tracking-label text-content-muted">
            {step}/{totalSteps}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pb-32 pt-6">
        <Brand size="sm" className="mb-6" />

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
              {step === 2 && <MatchTypeStep value={matchType} onChange={setMatchType} />}
              {step === 3 &&
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
              {step === 4 && (
                <TeamStep selectedPlayers={selectedPlayers} onChange={setFixedTeams} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Sticky footer nav */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg-primary/90 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          {step > 1 ? (
            <Button variant="secondary" onClick={goBack} disabled={creating}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          ) : (
            <span />
          )}

          {isLastStep ? (
            <Button onClick={handleCreate} loading={creating} disabled={!canAdvance()}>
              Create tournament <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={goNext} disabled={!canAdvance()}>
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
