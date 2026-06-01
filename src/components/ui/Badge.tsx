import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'accent' | 'neutral' | 'success' | 'danger' | 'court1' | 'court2' | 'live';

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

// One pill shape, 11px DM Sans medium uppercase, 24px tall.
const tones: Record<Tone, string> = {
  accent: 'text-accent bg-accent-dim',
  neutral: 'text-content-secondary bg-surface-2',
  success: 'text-accent bg-accent-dim',
  danger: 'text-danger bg-danger-dim',
  court1: 'text-accent bg-accent-dim',
  court2: 'text-content-secondary bg-surface-2',
  live: 'text-ink bg-accent',
};

export function Badge({ tone = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 rounded-pill px-2.5',
        'text-[11px] font-medium uppercase leading-none tracking-[0.08em] whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {tone === 'live' && <span className="h-1.5 w-1.5 rounded-full bg-ink" />}
      {children}
    </span>
  );
}
