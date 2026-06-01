import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}

/** One-decision option row: icon tile + title/desc + accent checkmark. */
export function OptionCard({ icon, title, description, selected, onSelect }: OptionCardProps) {
  return (
    <button
      onClick={onSelect}
      role="radio"
      aria-checked={selected}
      className={cn(
        'flex min-h-[64px] w-full items-center gap-3.5 rounded-card border p-3.5 text-left',
        'transition-colors duration-200 ease-smooth active:scale-[0.99]',
        selected ? 'border-accent bg-surface-2' : 'border-line bg-surface hover:border-content-muted',
      )}
    >
      <span
        className={cn(
          'grid h-10 w-10 shrink-0 place-items-center rounded-sm transition-colors',
          selected ? 'bg-accent-dim text-accent' : 'bg-surface-2 text-content-secondary',
        )}
      >
        {icon}
      </span>

      <span className="flex-1">
        <span className="block font-display text-[20px] tracking-[0.03em] text-content-primary">{title}</span>
        <span className="block text-[13px] text-content-secondary">{description}</span>
      </span>

      <span
        className={cn(
          'grid h-6 w-6 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors',
          selected ? 'border-accent bg-accent text-ink' : 'border-line text-transparent',
        )}
      >
        <Check className={cn('h-3.5 w-3.5 transition-opacity', selected ? 'opacity-100' : 'opacity-0')} strokeWidth={3} />
      </span>
    </button>
  );
}
