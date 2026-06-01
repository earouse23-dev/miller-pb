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
        'rounded-card border bg-surface shadow-inset transition-colors duration-200 ease-smooth',
        interactive && 'cursor-pointer hover:bg-surface-2',
        selected ? 'border-accent bg-surface-2' : 'border-line',
        interactive && !selected && 'hover:border-content-muted',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
