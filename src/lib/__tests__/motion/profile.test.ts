/**
 * Perfil de movimento (SPEC-007 §D4/§5.2).
 *
 * O ponto central: **reduzido é um perfil diferente, não uma duração menor.**
 * `MotionConfig reducedMotion="user"` mantém `opacity` e mata `transform` — sem
 * o perfil, o push viraria "slide instantâneo + fade de 260ms", pior que os dois.
 */

import { describe, expect, it } from 'vitest';
import { BASE_D, BASE_T } from '../../motion/tokens';
import {
  DEFAULT_FALLBACK_REDUCED,
  FULL_PROFILE,
  REDUCED_PROFILE,
  defaultProfile,
  resolveProfile,
} from '../../motion/profile';

describe('resolveProfile', () => {
  it('resolveProfile(false) === FULL_PROFILE, resolveProfile(true) === REDUCED_PROFILE', () => {
    expect(resolveProfile(false)).toBe(FULL_PROFILE);
    expect(resolveProfile(true)).toBe(REDUCED_PROFILE);
  });

  it('defaultProfile() é o perfil completo (movimento normal)', () => {
    expect(defaultProfile()).toBe(FULL_PROFILE);
    expect(defaultProfile().reduced).toBe(false);
  });
});

describe('perfil completo', () => {
  it('usa as durações-base sem escala', () => {
    expect(FULL_PROFILE.d).toBe(BASE_D);
  });

  it('mantém os springs de física (é onde a velocidade do gesto importa)', () => {
    expect(FULL_PROFILE.t.gesture).toEqual(BASE_T.gesture);
    expect(FULL_PROFILE.t.gesture.type).toBe('spring');
  });

  it('gestos de arrasto ligados', () => {
    expect(FULL_PROFILE.gesturesEnabled).toBe(true);
  });

  it('a entrada de tela é mais longa que a saída (limpeza vai rápido)', () => {
    expect(FULL_PROFILE.d.screenEnter).toBeGreaterThan(FULL_PROFILE.d.screenExit);
  });
});

describe('perfil reduzido', () => {
  it('escala TODAS as durações por 0.75', () => {
    for (const key of Object.keys(BASE_D) as (keyof typeof BASE_D)[]) {
      expect(REDUCED_PROFILE.d[key]).toBeCloseTo(BASE_D[key] * 0.75, 3);
    }
  });

  it('nenhuma duração zera (ainda precisa ler como "mudou de lugar")', () => {
    for (const value of Object.values(REDUCED_PROFILE.d)) {
      expect(value).toBeGreaterThan(0);
    }
  });

  it('colapsa os springs em tweens curtos (o dedo não "flipa" a tela)', () => {
    for (const key of ['gesture', 'navBar', 'fab', 'sheet'] as const) {
      expect(REDUCED_PROFILE.t[key].type).toBeUndefined();
      expect(REDUCED_PROFILE.t[key].duration).toBeGreaterThan(0);
    }
  });

  it('DESLIGA os gestos de arrasto (WCAG 2.3.3 — movimento por interação)', () => {
    expect(REDUCED_PROFILE.gesturesEnabled).toBe(false);
  });
});

describe('fallback de perfil', () => {
  it('cai no perfil completo por padrão (nunca em "sem movimento" silencioso)', () => {
    expect(DEFAULT_FALLBACK_REDUCED).toBe(false);
  });
});
