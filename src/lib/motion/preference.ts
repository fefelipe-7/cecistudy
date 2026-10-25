/**
 * Preferência de movimento (SPEC-M-027 D9).
 *
 * É **dado do aparelho**, não da usuária: fica em `cecistudy_motionPref`, fora
 * do backup. `sistema` deixa o `prefers-reduced-motion` decidir; `reduzido` e
 * `completo` são escolha explícita — o sinal do sistema no WebView do Android
 * não é confiável, então o toggle é o caminho garantido.
 *
 * Módulo puro: sem React, sem storage. Quem persiste é o `DataClientProvider`.
 */

export type MotionPref = 'sistema' | 'reduzido' | 'completo';

export const MOTION_PREF_DEFAULT: MotionPref = 'sistema';

export const MOTION_PREF_OPTIONS: { value: MotionPref; label: string }[] = [
  { value: 'sistema', label: 'aparelho' },
  { value: 'reduzido', label: 'menos' },
  { value: 'completo', label: 'completo' },
];

/**
 * Traduz a preferência para o `override` do `MotionProfileProvider`.
 * `undefined` = deixa o sistema decidir.
 */
export const motionPrefOverride = (pref: MotionPref): boolean | undefined =>
  pref === 'sistema' ? undefined : pref === 'reduzido';

export const motionPrefLabel = (pref: MotionPref): string =>
  MOTION_PREF_OPTIONS.find((option) => option.value === pref)?.label ?? 'aparelho';
