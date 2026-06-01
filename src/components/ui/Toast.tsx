import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useToastStore } from '@/store/useToastStore';
import type { ToastVariant } from '@/store/useToastStore';

const icons: Record<ToastVariant, typeof Info> = {
  default: Info,
  success: CheckCircle2,
  error: AlertCircle,
};

const colors: Record<ToastVariant, string> = {
  default: 'text-accent',
  success: 'text-accent',
  error: 'text-danger',
};

export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-7 z-[60] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.variant];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto flex h-10 items-center gap-2 rounded-pill border border-line bg-surface-2 px-[18px] shadow-inset"
            >
              <Icon className={`h-4 w-4 ${colors[t.variant]}`} />
              <span className="text-[13px] font-medium text-content-primary">{t.message}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
