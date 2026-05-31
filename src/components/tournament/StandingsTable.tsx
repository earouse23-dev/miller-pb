import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StandingRow } from '@/lib/types';

interface StandingsTableProps {
  rows: StandingRow[];
  teamHeader?: string;
}

export function StandingsTable({ rows, teamHeader = 'Team' }: StandingsTableProps) {
  if (rows.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-content-muted">
        Standings will appear once matches are scored.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card border border-line bg-bg-card">
      {/* Header */}
      <div className="grid grid-cols-[28px_1fr_28px_28px_36px_36px_48px] gap-2 border-b border-line px-3 py-2.5 sm:grid-cols-[32px_1fr_32px_32px_44px_44px_56px] sm:px-4">
        <HeaderCell>#</HeaderCell>
        <HeaderCell className="text-left">{teamHeader}</HeaderCell>
        <HeaderCell>W</HeaderCell>
        <HeaderCell>L</HeaderCell>
        <HeaderCell>PF</HeaderCell>
        <HeaderCell>PA</HeaderCell>
        <HeaderCell>Diff</HeaderCell>
      </div>

      <div>
        {rows.map((r) => (
          <motion.div
            key={r.team_id}
            layout
            transition={{ type: 'spring', stiffness: 400, damping: 36 }}
            className="grid grid-cols-[28px_1fr_28px_28px_36px_36px_48px] items-center gap-2 border-b border-line/50 px-3 py-3 last:border-b-0 sm:grid-cols-[32px_1fr_32px_32px_44px_44px_56px] sm:px-4"
          >
            <div className="flex items-center justify-center">
              {r.rank === 1 ? (
                <Trophy className="h-4 w-4 text-accent" />
              ) : (
                <span className="font-mono text-sm font-bold text-accent">{r.rank}</span>
              )}
            </div>
            <div className="truncate font-semibold text-content-primary">{r.label}</div>
            <Cell>{r.wins}</Cell>
            <Cell className="text-content-secondary">{r.losses}</Cell>
            <Cell className="text-content-secondary">{r.points_for}</Cell>
            <Cell className="text-content-secondary">{r.points_against}</Cell>
            <Cell
              className={cn(
                'font-bold',
                r.diff > 0 ? 'text-success' : r.diff < 0 ? 'text-danger' : 'text-content-muted',
              )}
            >
              {r.diff > 0 ? `+${r.diff}` : r.diff}
            </Cell>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function HeaderCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('text-center text-[10px] font-bold uppercase tracking-label text-content-muted', className)}>
      {children}
    </div>
  );
}

function Cell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('text-center font-mono text-sm text-content-primary', className)}>{children}</div>;
}
