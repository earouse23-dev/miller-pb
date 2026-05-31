import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';

interface OptionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}

/** Full-width selectable card with a lime radio dot, used across create steps. */
export function OptionCard({ icon, title, description, selected, onSelect }: OptionCardProps) {
  return (
    <Card
      interactive
      selected={selected}
      onClick={onSelect}
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className="flex items-center gap-4 p-4"
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-input transition-colors ${
          selected ? 'bg-accent/15 text-accent' : 'bg-bg-secondary text-content-secondary'
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-bold text-content-primary">{title}</p>
        <p className="text-sm text-content-secondary">{description}</p>
      </div>

      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          selected ? 'border-accent' : 'border-line'
        }`}
      >
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-accent" />}
      </span>
    </Card>
  );
}
