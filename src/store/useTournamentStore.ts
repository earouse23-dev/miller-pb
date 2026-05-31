import { create } from 'zustand';
import { fetchBundle, type TournamentBundle } from '@/lib/api';
import type { Match, Tournament } from '@/lib/types';

interface TournamentState {
  tournamentId: string | null;
  bundle: TournamentBundle | null;
  loading: boolean;
  error: string | null;

  load: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;

  // Realtime appliers.
  applyMatchChange: (match: Match) => void;
  applyMatchDelete: (id: string) => void;
  applyTournamentChange: (tournament: Tournament) => void;
}

export const useTournamentStore = create<TournamentState>((set, get) => ({
  tournamentId: null,
  bundle: null,
  loading: false,
  error: null,

  load: async (id) => {
    set({ loading: true, error: null, tournamentId: id });
    try {
      const bundle = await fetchBundle(id);
      // Ignore if the user navigated away to a different tournament meanwhile.
      if (get().tournamentId !== id) return;
      set({ bundle, loading: false });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load tournament.';
      set({ error: message, loading: false });
    }
  },

  refresh: async () => {
    const id = get().tournamentId;
    if (!id) return;
    try {
      const bundle = await fetchBundle(id);
      if (get().tournamentId !== id) return;
      set({ bundle });
    } catch {
      // Soft-fail: keep the current view; realtime will catch up.
    }
  },

  reset: () => set({ tournamentId: null, bundle: null, loading: false, error: null }),

  applyMatchChange: (match) => {
    const bundle = get().bundle;
    if (!bundle || match.tournament_id !== bundle.tournament.id) return;
    const idx = bundle.matches.findIndex((m) => m.id === match.id);
    const matches =
      idx >= 0
        ? bundle.matches.map((m) => (m.id === match.id ? match : m))
        : [...bundle.matches, match];
    // Keep deterministic order (round, then created_at).
    matches.sort(
      (a, b) => a.round_number - b.round_number || a.created_at.localeCompare(b.created_at),
    );
    set({ bundle: { ...bundle, matches } });
  },

  applyMatchDelete: (id) => {
    const bundle = get().bundle;
    if (!bundle) return;
    set({ bundle: { ...bundle, matches: bundle.matches.filter((m) => m.id !== id) } });
  },

  applyTournamentChange: (tournament) => {
    const bundle = get().bundle;
    if (!bundle || tournament.id !== bundle.tournament.id) return;
    set({ bundle: { ...bundle, tournament } });
  },
}));
