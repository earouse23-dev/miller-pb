import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'children' | 'onAnimationStart' | 'onAnimationEnd' | 'onDrag' | 'onDragStart' | 'onDragEnd'
  > {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-ink hover:brightness-95 disabled:opacity-35',
  secondary:
    'bg-transparent text-accent border border-accent hover:brightness-95 disabled:opacity-35',
  ghost: 'bg-transparent text-content-secondary hover:bg-surface hover:text-content-primary disabled:opacity-35',
  danger: 'bg-transparent text-danger border border-danger hover:brightness-95 disabled:opacity-35',
};

const sizes: Record<Size, string> = {
  sm: 'h-11 px-4 text-[15px] rounded-input',
  md: 'h-12 px-5 text-[16px] rounded-input',
  lg: 'h-[52px] px-6 text-[18px] rounded-input',
};

/** Spinner that matches the current text color (for in-button loading). */
function Spin() {
  return (
    <span
      className="h-5 w-5 animate-spin rounded-full border-[2.5px] border-current/30 border-t-current"
      style={{ borderColor: 'color-mix(in oklab, currentColor 30%, transparent)', borderTopColor: 'currentColor' }}
    />
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'lg', loading = false, fullWidth = false, className, children, disabled, ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      transition={{ duration: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'font-display inline-flex items-center justify-center gap-2.5 uppercase tracking-[0.06em] whitespace-nowrap select-none',
        'transition-[filter] duration-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
        'disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spin /> : children}
    </motion.button>
  );
});
