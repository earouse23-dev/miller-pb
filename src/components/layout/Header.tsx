import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';
import { Brand } from './Brand';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/store/useToastStore';
import { cn } from '@/lib/utils';

interface HeaderProps {
  inviteCode?: string;
  role?: 'host' | 'participant';
}

export function Header({ inviteCode, role }: HeaderProps) {
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
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4">
        <Brand size="sm" />

        <div className="flex items-center gap-2.5">
          {role && (
            <Badge tone={role === 'host' ? 'accent' : 'neutral'}>
              {role === 'host' ? 'Host' : 'Participant'}
            </Badge>
          )}

          {inviteCode && (
            <button
              onClick={copy}
              className={cn(
                'group flex items-center gap-2 rounded-pill border px-3 py-1.5 transition-colors',
                copied ? 'border-accent/40 bg-accent/10' : 'border-line bg-bg-card hover:bg-bg-card-hover',
              )}
            >
              <span className="hidden text-[10px] font-bold uppercase tracking-label text-content-muted sm:inline">
                Code
              </span>
              <span className="font-mono text-sm font-bold tracking-[0.2em] text-content-primary">
                {inviteCode}
              </span>
              <motion.span key={copied ? 'check' : 'copy'} initial={{ scale: 0.6 }} animate={{ scale: 1 }}>
                {copied ? (
                  <Check className="h-4 w-4 text-accent" />
                ) : (
                  <Copy className="h-4 w-4 text-content-muted group-hover:text-content-secondary" />
                )}
              </motion.span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
