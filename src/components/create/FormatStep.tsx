import { Grid3x3, GitFork, Combine } from 'lucide-react';
import { StepShell } from './StepShell';
import { OptionCard } from './OptionCard';
import type { TournamentFormat } from '@/lib/types';

interface FormatStepProps {
  value: TournamentFormat | null;
  onChange: (v: TournamentFormat) => void;
}

const options: Array<{ id: TournamentFormat; title: string; description: string; icon: JSX.Element }> = [
  { id: 'round_robin', title: 'Round Robin', description: 'Everyone plays everyone.', icon: <Grid3x3 className="h-5 w-5" /> },
  { id: 'bracket', title: 'Bracket', description: 'Single elimination.', icon: <GitFork className="h-5 w-5" /> },
  { id: 'both', title: 'Round Robin → Bracket', description: 'Round robin to seed the bracket.', icon: <Combine className="h-5 w-5" /> },
];

export function FormatStep({ value, onChange }: FormatStepProps) {
  return (
    <StepShell label="Format" heading="How will this run?">
      <div className="flex flex-col gap-3">
        {options.map((o) => (
          <OptionCard
            key={o.id}
            icon={o.icon}
            title={o.title}
            description={o.description}
            selected={value === o.id}
            onSelect={() => onChange(o.id)}
          />
        ))}
      </div>
    </StepShell>
  );
}
