/**
 * Perfil de movimento (SPEC-007 §D4/§5.2).
 *
 * **Reduzido é um conjunto de variantes diferente, não um multiplicador de
 * duração.** Isso importa porque `MotionConfig reducedMotion="user"` desabilita
 * transform mas **mantém opacity** — o resultado seria "slide instantâneo + fade
 * de 260ms", pior que os dois. Então aqui o perfil reduzido zera **todo alvo
 * horizontal** e move só `opacity`.
 *
 * O `MotionConfig reducedMotion` continua montado como **piso de segurança**
 * para o componente que esquecer o perfil — mas a verdade é este objeto.
 *
 * A largura NÃO mora aqui: é fato de layout, não preferência de movimento, e
 * muda com o resize. Quem a aplica é `createScreenVariants(width, profile)`.
 *
 * Fontes: https://motion.dev/docs/react-motion-config ·
 * https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
 */

import type { Transition } from 'framer-motion';
import { BASE_D, BASE_T, type Durations } from './tokens';

/** Escala do perfil reduzido: 0.26s → ~0.20s. Curto o bastante para não esperar,
 *  longo o bastante para ainda ler como "mudou de lugar". */
const REDUCED_SCALE = 0.75;

const scaledDurations = (): Durations => {
  const out: Partial<Record<keyof Durations, number>> = {};
  for (const key of Object.keys(BASE_D) as (keyof Durations)[]) {
    // Sem arredondar: `toFixed` perdia precisão nos steps (0.03 × 0.75 = 0.0225
    // virava 0.022) e a partir daí todo token ficava levemente errado.
    out[key] = BASE_D[key] * REDUCED_SCALE;
  }
  return out as Durations;
};

export interface MotionProfile {
  readonly reduced: boolean;
  /** Durações (segundos) — já escalonadas se reduzido. */
  readonly d: Durations;
  /** Transições de gesto/chrome — colapsam em tweens curtos se reduzido. */
  readonly t: Record<string, Transition>;
  /** Gestos baseados em arrasto desligados? Sob `reduced`, sim (WCAG 2.3.3:
   *  movimento disparado por interação). O botão de voltar é o equivalente
   *  single-pointer exigido por WCAG 2.5.7. */
  readonly gesturesEnabled: boolean;
}

/** Movimento normal. */
export const FULL_PROFILE: MotionProfile = {
  reduced: false,
  d: BASE_D,
  t: { ...BASE_T },
  gesturesEnabled: true,
};

/**
 * Reduzido: durações 0.75×, springs viram tweens curtos, e os gestos de
 * arrasto (borda, drag-to-dismiss) ficam **desligados**.
 */
export const REDUCED_PROFILE: MotionProfile = {
  reduced: true,
  d: scaledDurations(),
  t: {
    gesture: { duration: 0.12, ease: 'easeOut' },
    navBar: { duration: 0.12, ease: 'easeOut' },
    fab: { duration: 0.12, ease: 'easeOut' },
    sheet: { duration: 0.16, ease: 'easeOut' },
  },
  gesturesEnabled: false,
};

/**
 * Fallback quando não há provider montado (ex.: um componente 3D isolado em
 * teste). Cai no perfil **completo** — nunca em "sem movimento" silencioso:
 * o app padrão tem que ser o que se vê.
 */
export const DEFAULT_FALLBACK_REDUCED = false;

export const resolveProfile = (isReduced: boolean): MotionProfile =>
  isReduced ? REDUCED_PROFILE : FULL_PROFILE;

export const defaultProfile = (): MotionProfile => FULL_PROFILE;
