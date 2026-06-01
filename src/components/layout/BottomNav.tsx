import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type TournamentTab = 'schedule' | 'standings';

interface BottomNavProps {
  active: TournamentTab;
  onChange: (tab: TournamentTab) => void;
}

const tabs: Array<{ id: TournamentTab; label: string }> = [
  { id: 'schedule', label: 'Schedule' },
  { id: 'standings', label: 'Standings' },
];

/** Sticky thumb-reach nav, mobile only. */
export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="sticky bottom-0 z-30 border-t border-line bg-bg-primary/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden">
      <div className="mx-auto flex max-w-3xl">
        {tabs.map((t) => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={cn(
                'relative flex flex-1 items-center justify-center py-4 transition-colors',
                isActive ? 'text-content-primary' : 'text-content-muted',
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="bottomnav-indicator"
                  className="absolute top-0 h-0.5 w-10 rounded-full bg-accent"
                />
              )}
              <span className="font-display text-[18px] uppercase tracking-[0.05em]">{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
