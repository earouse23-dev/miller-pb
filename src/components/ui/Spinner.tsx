import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: number;
  className?: string;
}

/** Lime ring spinner. */
export function Spinner({ size = 28, className }: SpinnerProps) {
  return (
    <span
      className={cn('inline-block animate-spin rounded-full border-[3px]', className)}
      style={{
        width: size,
        height: size,
        borderColor: 'rgba(200,240,96,0.18)',
        borderTopColor: 'var(--accent)',
      }}
    />
  );
}

export function LoadingState({ message = 'Matches are loading…' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <Spinner size={36} />
      <p className="text-sm font-medium text-content-secondary">{message}</p>
    </div>
  );
}
