import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** 'slide-up' for bottom sheets (drag handle), 'scale' for centered dialogs. */
  variant?: 'slide-up' | 'scale';
  showClose?: boolean;
  /** Centered title shown in the sheet header (slide-up only). */
  title?: string;
  className?: string;
  dismissable?: boolean;
  /** 'scale' dialogs only: anchor near the top on mobile (clears the keyboard /
   *  bottom buttons) instead of vertically centering. */
  align?: 'center' | 'top';
}

const EASE = [0.22, 1, 0.36, 1] as const;

// Ref-counted body scroll lock so overlapping/sequential modals never leave
// the page stuck at `overflow: hidden` (which makes the screen feel "trapped").
let scrollLockCount = 0;
function lockScroll() {
  if (scrollLockCount === 0) document.body.style.overflow = 'hidden';
  scrollLockCount += 1;
}
function unlockScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) document.body.style.overflow = '';
}

export function Modal({
  open,
  onClose,
  children,
  variant = 'scale',
  showClose = true,
  title,
  className,
  dismissable = true,
  align = 'center',
}: ModalProps) {
  // Keep latest onClose/dismissable in refs so the lock effect can depend ONLY
  // on `open`. Otherwise an inline onClose from a frequently re-rendering parent
  // (e.g. a live tournament) would re-run this effect every render, thrashing
  // the body scroll-lock.
  const onCloseRef = useRef(onClose);
  const dismissableRef = useRef(dismissable);
  onCloseRef.current = onClose;
  dismissableRef.current = dismissable;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissableRef.current) onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    lockScroll();
    return () => {
      window.removeEventListener('keydown', onKey);
      unlockScroll();
    };
  }, [open]);

  // How much of the viewport the on-screen keyboard occludes. On iOS the
  // soft keyboard doesn't push fixed elements up, so a bottom sheet ends up
  // hidden behind it (you can't see the code field). We lift the sheet by this
  // amount via padding on the (bottom-anchored) overlay.
  const [keyboardInset, setKeyboardInset] = useState(0);
  useEffect(() => {
    if (!open) {
      setKeyboardInset(0);
      return;
    }
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      setKeyboardInset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [open]);

  const isSheet = variant === 'slide-up';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={cn(
            'fixed inset-0 z-50 flex justify-center p-0 transition-[padding] duration-200 ease-out sm:p-4',
            isSheet
              ? 'items-end sm:items-center'
              : align === 'top'
                ? 'items-start sm:items-center'
                : 'items-center',
          )}
          // Lift the sheet above the soft keyboard when one is open.
          style={keyboardInset > 0 ? { paddingBottom: keyboardInset } : undefined}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, pointerEvents: 'auto' }}
          // pointerEvents off the moment we start exiting: if framer's exit ever
          // stalls (a setState landing on the exiting subtree, a WebKit timing
          // deadlock), the lingering full-screen layer passes clicks through
          // instead of freezing the page.
          exit={{ opacity: 0, pointerEvents: 'none' }}
          transition={{ duration: 0.18, ease: EASE }}
        >
          <div className="absolute inset-0 bg-black/60" onClick={() => dismissable && onClose()} />

          <motion.div
            role="dialog"
            aria-modal="true"
            className={cn(
              'relative z-10 flex w-full flex-col border border-line bg-surface shadow-inset',
              isSheet
                ? 'max-h-[85vh] rounded-t-[20px] px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-3 sm:max-w-md sm:rounded-[20px]'
                : 'max-w-md rounded-card p-5',
              !isSheet && align === 'top' && 'mt-[10vh] sm:mt-0',
              className,
            )}
            initial={isSheet ? { y: 24, scale: 0.98, opacity: 0 } : { scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={isSheet ? { y: 24, scale: 0.98, opacity: 0 } : { scale: 0.95, opacity: 0 }}
            transition={{ duration: isSheet ? 0.18 : 0.18, ease: EASE }}
          >
            {isSheet && (
              <>
                <span className="mx-auto mb-3.5 h-1 w-9 shrink-0 rounded-full bg-[#2A2E3A]" />
                {(title || (showClose && dismissable)) && (
                  <div className="mb-3.5 grid grid-cols-[40px_1fr_40px] items-center">
                    <span />
                    {title && (
                      <span className="font-display text-center text-2xl uppercase tracking-[0.04em] text-content-primary">
                        {title}
                      </span>
                    )}
                    {showClose && dismissable ? (
                      <button
                        onClick={onClose}
                        aria-label="Close"
                        className="grid h-10 w-10 place-items-center justify-self-end rounded-full text-content-secondary transition-colors hover:bg-surface-2 hover:text-content-primary"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    ) : (
                      <span />
                    )}
                  </div>
                )}
              </>
            )}

            {!isSheet && showClose && dismissable && (
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full text-content-secondary transition-colors hover:bg-surface-2 hover:text-content-primary"
              >
                <X className="h-5 w-5" />
              </button>
            )}

            <div className={cn(isSheet && 'overflow-y-auto')}>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
