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
        <p className="label-eyebrow">{label}</p>
        <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-content-primary">{heading}</h2>
        {subtext && <p className="mt-1 text-sm text-content-secondary">{subtext}</p>}
      </div>
      {children}
    </div>
  );
}
