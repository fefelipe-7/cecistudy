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

// Sinal de reduz-motion (reativo, para o provider).
export { prefersReducedMotion, usePrefersReducedMotion, getTransition } from '../motion';

export {
  PARALLAX,
  SHADE_MAX_OPACITY,
  STUCK_EPSILON_PX,
  BASE_D,
  EASE,
  BASE_T,
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
  chromeFade,
  toastVariants,
  listItemVariants,
  staggerFor,
  SHADE_OPACITY,
} from './variants';

// ⚠️ `IOS_EASE`, `iOS_SPRING`, `sheetVariants`, `screenVariants`, `fadeSlide` e
// `headerSwapVariants` AINDA vivem em `src/lib/motion.ts` e são re-exportados
// por aquele shim. Migram para cá no Slice C (telas) e Slice D (chrome/modais).
