import type { ReactNode } from 'react';

interface StepShellProps {
  label: string;
  heading: string;
  subtext?: ReactNode;
  children: ReactNode;
}

export function StepShell({ label, heading, subtext, children }: StepShellProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="eyebrow">{label}</p>
        <h2 className="mt-2 font-display text-[40px] uppercase leading-[0.98] tracking-[0.02em] text-content-primary">
          {heading}
        </h2>
        {subtext && <p className="mt-1.5 text-[15px] text-content-secondary">{subtext}</p>}
      </div>
      {children}
    </div>
  );
}
