import { cn } from '@/lib/utils';

interface BrandProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ringSizes = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-14 w-14' };
const iconSizes = { sm: 18, md: 22, lg: 30 };

/** Green circle with a pickleball paddle glyph + wordmark. */
export function Brand({ className, showText = true, size = 'md' }: BrandProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full bg-accent shadow-glow',
          ringSizes[size],
        )}
      >
        <PaddleIcon size={iconSizes[size]} />
      </div>
      {showText && (
        <span className="text-[13px] font-extrabold uppercase leading-none tracking-label text-content-primary">
          Miller
          <br />
          Pickleball
        </span>
      )}
    </div>
  );
}

function PaddleIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <ellipse cx="14.5" cy="13" rx="6.8" ry="7.8" fill="#080D14" />
      <rect x="12.9" y="19" width="3.2" height="8" rx="1.6" fill="#080D14" />
      <g fill="#C8F060">
        <circle cx="11.5" cy="10.5" r="1.05" />
        <circle cx="15.5" cy="10" r="1.05" />
        <circle cx="13" cy="13.4" r="1.05" />
        <circle cx="17" cy="13.4" r="1.05" />
        <circle cx="11.6" cy="15.6" r="1.05" />
        <circle cx="15.6" cy="16" r="1.05" />
      </g>
    </svg>
  );
}
