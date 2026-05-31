import { User, Users, Shuffle } from 'lucide-react';
import { StepShell } from './StepShell';
import { OptionCard } from './OptionCard';
import type { MatchType } from '@/lib/types';

interface MatchTypeStepProps {
  value: MatchType | null;
  onChange: (v: MatchType) => void;
}

const options: Array<{ id: MatchType; title: string; description: string; icon: JSX.Element }> = [
  { id: 'singles', title: 'Singles', description: '1 vs 1.', icon: <User className="h-5 w-5" /> },
  {
    id: 'doubles_fixed',
    title: 'Doubles — Fixed Partners',
    description: 'Partners stay together all night.',
    icon: <Users className="h-5 w-5" />,
  },
  {
    id: 'doubles_random',
    title: 'Doubles — Random Partners',
    description: 'Partners are drawn at random.',
    icon: <Shuffle className="h-5 w-5" />,
  },
];

export function MatchTypeStep({ value, onChange }: MatchTypeStepProps) {
  return (
    <StepShell label="Match Type" heading="Singles or doubles?">
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
