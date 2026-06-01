import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, MonitorPlay } from 'lucide-react';
import { Brand } from './Brand';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/store/useToastStore';
import { cn } from '@/lib/utils';

interface HeaderProps {
  inviteCode?: string;
  role?: 'host' | 'participant';
  onCast?: () => void;
}

export function Header({ inviteCode, role, onCast }: HeaderProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
    } catch {
      // Clipboard may be unavailable; still show the toast for the gesture.
    }
    setCopied(true);
    toast.success('Code copied!');
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg-primary/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-5">
        <Brand size="sm" align="left" />

        <div className="flex items-center gap-2">
          {role && (
            <Badge tone={role === 'host' ? 'accent' : 'neutral'}>
              {role === 'host' ? 'Host' : 'Live'}
            </Badge>
          )}

          {inviteCode && (
            <button
              onClick={copy}
              className={cn(
                'flex h-9 items-center gap-2 rounded-pill border bg-surface pl-3.5 pr-2 transition-colors',
                copied ? 'border-accent/50' : 'border-line hover:border-content-muted',
              )}
            >
              <span className="font-mono text-[14px] font-medium tracking-[0.1em] text-content-primary">
                {inviteCode}
              </span>
              <motion.span
                key={copied ? 'check' : 'copy'}
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                className="grid h-6 w-6 place-items-center rounded-full text-content-secondary"
              >
                {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-[15px] w-[15px]" />}
              </motion.span>
            </button>
          )}

          {onCast && (
            <button
              onClick={onCast}
              aria-label="Court display"
              className="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-content-secondary transition-colors hover:border-content-muted hover:text-content-primary"
            >
              <MonitorPlay className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
