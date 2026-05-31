import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'w-full h-11 px-4 rounded-input bg-bg-secondary border text-content-primary',
        'placeholder:text-content-muted transition-colors duration-150',
        'focus:outline-none focus:border-accent focus:shadow-glow',
        invalid ? 'border-danger' : 'border-line',
        className,
      )}
      {...props}
    />
  );
});
