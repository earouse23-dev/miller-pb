import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
  interactive?: boolean;
  children: ReactNode;
}

export function Card({ selected, interactive, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card bg-bg-card border transition-all duration-200',
        interactive && 'cursor-pointer hover:bg-bg-card-hover',
        selected
          ? 'border-accent bg-accent/[0.06] shadow-glow'
          : 'border-line hover:border-content-muted/40',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
