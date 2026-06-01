import { cn } from '@/lib/utils';
import type { StandingRow } from '@/lib/types';

interface StandingsTableProps {
  rows: StandingRow[];
  teamHeader?: string;
  onPlayerClick?: (playerId: string, name: string) => void;
}

export function StandingsTable({ rows, teamHeader = 'Team', onPlayerClick }: StandingsTableProps) {
  if (rows.length === 0) {
    return (
      <div className="py-16 text-center text-[14px] text-content-muted">
        Standings will appear once matches are scored.
      </div>
    );
  }

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="font-mono text-[11px] uppercase tracking-[0.1em] text-content-muted">
          <th className="w-6 pb-3 text-left font-normal">#</th>
          <th className="w-[99%] pb-3 pl-2 text-left font-normal">{teamHeader}</th>
          <th className="pb-3 pl-2.5 text-right font-normal">W</th>
          <th className="pb-3 pl-2.5 text-right font-normal">L</th>
          <th className="pb-3 pl-2.5 text-right font-normal">Diff</th>
          <th className="pb-3 pl-2.5 text-right font-normal">PF</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const top = r.rank <= 2;
          const isDoubles = r.players.length > 1;
          return (
            <tr key={r.team_id} className="border-t border-line text-[14px]">
              <td className="py-3.5 text-left">
                <span className={cn('font-display text-[18px]', top ? 'text-accent' : 'text-content-muted')}>
                  {r.rank}
                </span>
              </td>
              <td className="py-3.5 pl-2 pr-3 text-left">
                {onPlayerClick && r.players.length > 0 ? (
                  isDoubles ? (
                    <>
                      <div className="font-medium text-content-primary">{r.label}</div>
                      <div className="mt-0.5 text-[12px] text-content-secondary">
                        {r.players.map((p, i) => (
                          <span key={p.id}>
                            {i > 0 && <span className="text-content-muted"> · </span>}
                            <button
                              onClick={() => onPlayerClick(p.id, p.name)}
                              className="underline decoration-line decoration-dotted underline-offset-2 transition-colors hover:text-accent hover:decoration-accent"
                            >
                              {p.name}
                            </button>
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => onPlayerClick(r.players[0].id, r.players[0].name)}
                      className="font-medium text-content-primary underline decoration-line decoration-dotted underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
                    >
                      {r.label}
                    </button>
                  )
                ) : (
                  <span className="font-medium text-content-primary">{r.label}</span>
                )}
              </td>
              <td className="py-3.5 pl-2.5 text-right">{r.wins}</td>
              <td className="py-3.5 pl-2.5 text-right text-content-secondary">{r.losses}</td>
              <td
                className={cn(
                  'py-3.5 pl-2.5 text-right font-mono',
                  r.diff > 0 ? 'text-accent' : r.diff < 0 ? 'text-content-muted' : 'text-content-secondary',
                )}
              >
                {r.diff >= 0 ? '+' : ''}
                {r.diff}
              </td>
              <td className="font-display py-3.5 pl-2.5 text-right text-[20px] tracking-[0.02em] text-accent">
                {r.points_for}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
