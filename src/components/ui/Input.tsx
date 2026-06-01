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
        'h-12 w-full appearance-none rounded-input border bg-surface-2 px-3.5 text-[14px] text-content-primary',
        'placeholder:text-content-muted transition-colors duration-200 ease-smooth',
        'focus:border-accent focus:outline-none',
        invalid ? 'border-danger' : 'border-line',
        className,
      )}
      {...props}
    />
  );
});

interface FieldProps {
  label?: string;
  help?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

/** Label-above field wrapper (never placeholder-as-label). */
export function Field({ label, help, error, children, className }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && <label className="text-[13px] font-medium text-content-secondary">{label}</label>}
      {children}
      {error ? (
        <span className="text-[12px] text-danger">{error}</span>
      ) : help ? (
        <span className="text-[12px] text-content-secondary">{help}</span>
      ) : null}
    </div>
  );
}
