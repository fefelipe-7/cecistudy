/**
 * Taxonomia de movimento — seis famílias (SPEC-M-027 D2).
 *
 * O que este teste protege: família é **índice**, não fonte de número. Se
 * alguém criar uma duração dentro de uma família, o perfil reduzido deixa de
 * escalá-la e o movimento "reduzido" fica inconsistente sem ninguém notar.
 */
import { describe, expect, it } from 'vitest';
import { BASE_D, TOKENS } from '../../motion/tokens';
import { REDUCED_PROFILE } from '../../motion/profile';

const DURATION_LEAVES = [
  TOKENS.micro.duration,
  TOKENS.enterExit.enter,
  TOKENS.enterExit.exit,
  TOKENS.enterExit.rest,
  TOKENS.enterExit.shade,
  TOKENS.navigation.tab,
  TOKENS.navigation.replace,
  TOKENS.navigation.step,
  TOKENS.navigation.stepExit,
  TOKENS.navigation.overlay,
  TOKENS.navigation.sheet,
  TOKENS.navigation.toast,
  TOKENS.navigation.listItem,
  TOKENS.navigation.listStagger,
  TOKENS.navigation.listStaggerCap,
  TOKENS.sharedElement.duration,
  TOKENS.ambient.duration,
];

describe('TOKENS — seis famílias', () => {
  it('tem as seis famílias, com enter/exit dentro de enterExit', () => {
    expect(Object.keys(TOKENS)).toEqual([
      'micro',
      'enterExit',
      'navigation',
      'sharedElement',
      'spring',
      'ambient',
    ]);
    expect(TOKENS.enterExit).toHaveProperty('enter');
    expect(TOKENS.enterExit).toHaveProperty('exit');
  });

  it('nenhuma família inventa duração — toda duração é um token de BASE_D', () => {
    const known = new Set<number>(Object.values(BASE_D));
    expect(DURATION_LEAVES.filter((duration) => !known.has(duration))).toEqual([]);
  });

  it('o perfil reduzido escala as famílias junto com `d`', () => {
    expect(REDUCED_PROFILE.tokens.enterExit.enter).toBeCloseTo(BASE_D.screenEnter * 0.75, 6);
    expect(REDUCED_PROFILE.tokens.navigation.tab).toBeCloseTo(BASE_D.tab * 0.75, 6);
    expect(REDUCED_PROFILE.tokens.micro.duration).toBeCloseTo(BASE_D.micro * 0.75, 6);
  });

  it('spring do perfil reduzido vira tween curto', () => {
    expect(REDUCED_PROFILE.tokens.spring.sheet.type).toBeUndefined();
    expect(REDUCED_PROFILE.tokens.spring.sheet.duration).toBeGreaterThan(0);
  });
});
