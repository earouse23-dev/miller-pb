import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'accent' | 'neutral' | 'success' | 'danger' | 'court1' | 'court2' | 'live';

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

const tones: Record<Tone, string> = {
  accent: 'bg-accent/15 text-accent border-accent/30',
  neutral: 'bg-bg-secondary text-content-secondary border-line',
  success: 'bg-success/15 text-success border-success/30',
  danger: 'bg-danger/15 text-danger border-danger/30',
  court1: 'bg-court1/15 text-court1 border-court1/30',
  court2: 'bg-court2/15 text-court2 border-court2/30',
  live: 'bg-danger/15 text-danger border-danger/30',
};

export function Badge({ tone = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1',
        'text-[10px] font-bold uppercase tracking-label leading-none',
        tones[tone],
        className,
      )}
    >
      {tone === 'live' && <span className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse-soft" />}
      {children}
    </span>
  );
}
