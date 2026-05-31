import type { StandingRow } from './types';

const APP = 'Miller Pickleball';

type ShareOutcome = 'shared' | 'copied' | 'failed';

async function shareOrCopy(text: string, title: string): Promise<ShareOutcome> {
  // Prefer the native share sheet where available (mobile especially).
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text });
      return 'shared';
    } catch (e) {
      // AbortError = user dismissed the sheet; treat as a no-op, not a failure.
      if (e instanceof DOMException && e.name === 'AbortError') return 'shared';
      // Otherwise fall through to clipboard.
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}

/** Option 1 — just the winner + tournament. */
export function shareWinner(winnerLabel: string, code: string): Promise<ShareOutcome> {
  const text = `🏆 ${winnerLabel} won the ${APP} tournament! (code ${code})`;
  return shareOrCopy(text, `${APP} — Champion`);
}

/** Option 2 — the full final standings, as a clean text table. */
export function shareStandings(standings: StandingRow[], code: string): Promise<ShareOutcome> {
  const lines = standings.map(
    (s) => `${s.rank}. ${s.label} — ${s.wins}W ${s.losses}L (${s.diff >= 0 ? '+' : ''}${s.diff})`,
  );
  const text = `🥒 ${APP} — Final Standings (code ${code})\n\n${lines.join('\n')}`;
  return shareOrCopy(text, `${APP} — Final Standings`);
}
