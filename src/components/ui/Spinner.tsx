import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: number;
  className?: string;
}

/** Accent ring spinner. */
export function Spinner({ size = 28, className }: SpinnerProps) {
  return (
    <span
      className={cn('inline-block animate-spin rounded-full border-[2.5px]', className)}
      style={{
        width: size,
        height: size,
        borderColor: 'rgba(74,222,128,0.22)',
        borderTopColor: 'var(--accent)',
      }}
    />
  );
}

/** Pulsing skeleton block (design prefers skeletons over spinners for content). */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse-soft rounded-input bg-surface-2', className)} />;
}

export function LoadingState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col gap-3 py-6">
      <Skeleton className="h-[72px] w-full" />
      <Skeleton className="h-[72px] w-full" />
      <Skeleton className="h-[72px] w-full" />
      {message && <p className="mt-1 text-[13px] text-content-secondary">{message}</p>}
    </div>
  );
}
