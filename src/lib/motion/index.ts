/**
 * Sistema de movimento do cecistudy — **superfície pública única** (SPEC-007).
 *
 * Regras de uso:
 * - Nenhum componente importa `framer-motion` para *decidir* movimento: quem
 *   decide é este módulo. Componentes consomem `useMotionProfile()` e as
 *   variantes daqui.
 * - A **única** superfície pública é este arquivo (o `src/lib/motion.ts` legado
 *   é shim de compatibilidade e não deve ganhar símbolos novos).
 * - Só se importa `framer-motion` (nunca `motion/react`) — dois runtimes teriam
 *   contextos de presença separados e o `exit` quebraria silenciosamente.
 */

export type { NavKind, NavIntent, DeriveIntentOptions } from './intent';
export {
  IDLE_INTENT,
  deriveIntent,
  gesturePopIntent,
  screenIdentity,
  setMotionIntent,
  consumeMotionIntent,
  peekMotionIntent,
} from './intent';

export type { MotionProfile } from './profile';
export {
  FULL_PROFILE,
  REDUCED_PROFILE,
  resolveProfile,
  defaultProfile,
  DEFAULT_FALLBACK_REDUCED,
} from './profile';

// Sinal de reduz-motion (reativo, para o provider e para as variantes locais).
export { prefersReducedMotion, usePrefersReducedMotion, getTransition } from './reduced';

export {
  PARALLAX,
  SHADE_MAX_OPACITY,
  STUCK_EPSILON_PX,
  BASE_D,
  EASE,
  BASE_T,
  IOS_EASE,
  IOS_EASE_OUT,
  OVERLAY_FADE,
} from './tokens';
export type { Durations, DurationKey } from './tokens';

export type { ScreenTargets } from './variants';
export {
  createScreenTargets,
  createScreenVariants,
  screenDepthLabel,
  stepVariants,
  tabContent,
  overlayVariants,
  sheetVariants,
  headerSwapVariants,
  chromeFade,
  toastVariants,
  listItemVariants,
  staggerFor,
  SHADE_OPACITY,
} from './variants';

export { TAB_LABELS, tabLabel, screenAnnouncement } from './screenAnnounce';

// `fadeSlide`, `screenVariants`, `iOS_SPRING`, `PUSH_DURATION`,
// `PUSH_EXIT_DURATION`, `TAB_DURATION` e `setNavMotionContext` foram removidos
// (2026-10-16, Slice D): sem consumidor, ou já substituídos por
// `toastVariants`/`createScreenVariants`/`BASE_T`/`BASE_D`/`NavIntent`.
