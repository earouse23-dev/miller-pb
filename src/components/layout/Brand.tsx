import { cn } from '@/lib/utils';

interface BrandProps {
  className?: string;
  /** Stack alignment. */
  align?: 'center' | 'left';
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: { miller: 'text-[22px]', pickle: 'text-[8px] tracking-[0.34em]', mark: 'h-[9px] w-[9px]', gap: 'gap-[7px]' },
  md: { miller: 'text-[34px]', pickle: 'text-[10px] tracking-[0.40em]', mark: 'h-3 w-3', gap: 'gap-2.5' },
  lg: { miller: 'text-[52px]', pickle: 'text-[12px] tracking-[0.42em]', mark: 'h-[14px] w-[14px]', gap: 'gap-2.5' },
};

/** Wordmark: green dot mark + "MILLER" (Bebas) over tracked "PICKLEBALL". */
export function Brand({ className, align = 'center', size = 'md' }: BrandProps) {
  const s = sizes[size];
  return (
    <div
      className={cn(
        'inline-flex flex-col gap-0.5',
        align === 'center' ? 'items-center' : 'items-start',
        className,
      )}
    >
      <div className={cn('inline-flex items-center', s.gap)}>
        <span className={cn('shrink-0 rounded-full bg-accent', s.mark)} />
        <span className={cn('font-display leading-[0.9] tracking-[0.08em] text-content-primary', s.miller)}>
          Miller
        </span>
      </div>
      <span
        className={cn(
          'font-medium uppercase text-content-secondary',
          s.pickle,
          align === 'center' && 'pl-[0.42em]',
        )}
      >
        Pickleball
      </span>
    </div>
  );
}
