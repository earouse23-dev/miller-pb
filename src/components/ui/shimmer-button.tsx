/**
 * Animated button with a shimmer gradient that sweeps across the surface.
 * Adapted for this repo: uses the project `cn` (@/lib/utils), the
 * Tailwind-v3 `bg-[length:...]` syntax, the shared `shimmer2` keyframe in
 * tailwind.config, and the brand green palette so it reads as a primary CTA.
 */
import { cn } from '@/lib/utils';

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
}

export default function ShimmerButton({
  children = 'Shimmer',
  className,
  ...props
}: ShimmerButtonProps) {
  return (
    <button
      className={cn(
        'font-display inline-flex h-[52px] select-none items-center justify-center gap-2.5 rounded-input px-6 text-[18px] uppercase tracking-[0.06em] text-ink',
        'border border-accent/30 bg-[linear-gradient(110deg,#4ADE80,45%,#BBF7D0,55%,#4ADE80)] bg-[length:200%_100%]',
        'animate-shimmer2 transition-[filter] hover:brightness-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
        'disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
