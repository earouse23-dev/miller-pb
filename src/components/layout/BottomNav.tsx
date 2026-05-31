import { motion } from 'framer-motion';
import { CalendarDays, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TournamentTab = 'schedule' | 'standings';

interface BottomNavProps {
  active: TournamentTab;
  onChange: (tab: TournamentTab) => void;
}

const tabs: Array<{ id: TournamentTab; label: string; icon: typeof Trophy }> = [
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  { id: 'standings', label: 'Standings', icon: Trophy },
];

/** Sticky thumb-reach nav, mobile only. */
export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="sticky bottom-0 z-30 border-t border-line bg-bg-primary/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)] sm:hidden">
      <div className="mx-auto flex max-w-3xl">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={cn(
                'relative flex flex-1 flex-col items-center gap-1 py-3 transition-colors',
                isActive ? 'text-accent' : 'text-content-muted',
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="bottomnav-indicator"
                  className="absolute top-0 h-0.5 w-10 rounded-full bg-accent"
                />
              )}
              <Icon className="h-5 w-5" />
              <span className="text-[11px] font-semibold uppercase tracking-label">{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
