import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
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
  primary:
    'bg-accent text-bg-primary font-bold hover:bg-accent-dark shadow-glow hover:shadow-glow-lg disabled:bg-line disabled:text-content-muted disabled:shadow-none',
  secondary:
    'bg-bg-card text-content-primary border border-line hover:bg-bg-card-hover hover:border-content-muted disabled:opacity-50',
  ghost:
    'bg-transparent text-content-secondary hover:text-content-primary hover:bg-bg-card disabled:opacity-50',
  danger:
    'bg-transparent text-danger border border-danger/50 hover:bg-danger/10 hover:border-danger disabled:opacity-50',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm rounded-input',
  md: 'h-11 px-5 text-sm rounded-input',
  lg: 'h-12 px-6 text-base rounded-input',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, fullWidth = false, className, children, disabled, ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold tracking-tight transition-colors duration-150 select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
        'disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </motion.button>
  );
});
