import confetti from 'canvas-confetti';

/** Tipos de celebração do app — cada um com um burst específico. */
export type CelebrationKind =
  | 'tasks-done'
  | 'reading-done'
  | 'session-done'
  | 'flashcards-done'
  | 'sticker-unlocked';

/** Paleta de confetes alinhada ao design system (rose/green/blue/yellow). */
const CONFETTI_COLORS = [
  '#E97891',
  '#D85F79',
  '#B94862',
  '#8BC7A2',
  '#43805B',
  '#609FB8',
  '#396D82',
  '#F9C74F',
];

/** Respeita "reduzir movimento" do sistema (acessibilidade). */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Burst único partindo do centro — base de todas as celebrações. */
function burstFromCenter(count: number, opts: confetti.Options = {}) {
  confetti({
    colors: CONFETTI_COLORS,
    particleCount: count,
    spread: 72,
    startVelocity: 38,
    gravity: 0.9,
    ticks: 190,
    zIndex: 9999,
    origin: { x: 0.5, y: 0.62 },
    ...opts,
  });
}

/** Canhões laterais (celebração grande e estilosa). */
function sideCannons(count: number, delay = 120) {
  const opts: confetti.Options = {
    colors: CONFETTI_COLORS,
    particleCount: count,
    spread: 55,
    startVelocity: 55,
    gravity: 0.85,
    ticks: 230,
    zIndex: 9999,
  };
  confetti({ ...opts, angle: 60, origin: { x: 0, y: 0.7 } });
  setTimeout(() => {
    confetti({ ...opts, angle: 120, origin: { x: 1, y: 0.7 } });
  }, delay);
}

/**
 * Explode confetes conforme o tipo de celebração.
 * No-op quando o sistema pede "reduzir movimento".
 */
export function celebrate(kind: CelebrationKind): void {
  if (prefersReducedMotion()) return;

  switch (kind) {
    case 'tasks-done':
      burstFromCenter(130, { spread: 100, startVelocity: 45 });
      sideCannons(90);
      break;
    case 'session-done':
    case 'flashcards-done':
      burstFromCenter(110, { spread: 82, startVelocity: 42 });
      break;
    case 'sticker-unlocked':
      burstFromCenter(150, { spread: 96, startVelocity: 40 });
      break;
    case 'reading-done':
      burstFromCenter(80, { spread: 70 });
      break;
  }
}
