import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTournamentStore } from '@/store/useTournamentStore';
import type { Match, Tournament } from '@/lib/types';

/** Subscribe to live changes on matches + tournaments for one tournament and
 *  push them into the store. Re-subscribes if the tournament id changes. */
export function useRealtime(tournamentId: string | null): void {
  const applyMatchChange = useTournamentStore((s) => s.applyMatchChange);
  const applyMatchDelete = useTournamentStore((s) => s.applyMatchDelete);
  const applyTournamentChange = useTournamentStore((s) => s.applyTournamentChange);

  useEffect(() => {
    if (!tournamentId) return;

    const channel = supabase
      .channel(`tournament:${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const old = payload.old as Partial<Match>;
            if (old.id) applyMatchDelete(old.id);
          } else {
            applyMatchChange(payload.new as Match);
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournaments',
          filter: `id=eq.${tournamentId}`,
        },
        (payload) => {
          if (payload.eventType !== 'DELETE') {
            applyTournamentChange(payload.new as Tournament);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId, applyMatchChange, applyMatchDelete, applyTournamentChange]);
}
