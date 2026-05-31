import confetti from 'canvas-confetti';

const ACCENT = '#C8F060';
const ACCENT_DARK = '#9BBF3A';
const WHITE = '#FFFFFF';

/** Celebratory burst used when a tournament ends. */
export function fireConfetti(): void {
  const colors = [ACCENT, ACCENT_DARK, WHITE];
  const defaults = { origin: { y: 0.6 }, colors, disableForReducedMotion: true };

  confetti({ ...defaults, particleCount: 80, spread: 70, startVelocity: 45 });
  window.setTimeout(
    () => confetti({ ...defaults, particleCount: 60, spread: 100, scalar: 0.9, origin: { x: 0.2, y: 0.5 } }),
    150,
  );
  window.setTimeout(
    () => confetti({ ...defaults, particleCount: 60, spread: 100, scalar: 0.9, origin: { x: 0.8, y: 0.5 } }),
    300,
  );
}
