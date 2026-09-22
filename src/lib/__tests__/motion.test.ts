import { describe, expect, it } from 'vitest';
import { screenVariants, setNavMotionContext } from '../motion';

/** Resolvers são `VariantResolver` (funções chamadas pelo framer-motion). */
const resolveExit = () => (screenVariants.exit as () => Record<string, unknown>)();
const resolveInitial = (d: number) =>
  (screenVariants.initial as (d: number) => Record<string, unknown>)(d);

describe('screenVariants (motion de navegação)', () => {
  it('consome a direção/gesto do contexto a cada exit — sem valor velho no próximo pop', () => {
    // push: a tela coberta apenas esvanece (sem parallax)
    setNavMotionContext(1);
    const pushExit = resolveExit();

    // pop iniciado pelo gesto de borda: exit parte do ponto do dedo (px)
    setNavMotionContext(-1, 120);
    const popExit = resolveExit();

    // pop sem gesto depois: o contexto foi consumido e volta a 0
    setNavMotionContext(-1);
    const plainPopExit = resolveExit();

    // troca de tab: fade puro, sem deslocamento
    setNavMotionContext(0);
    const tabExit = resolveExit();

    expect(pushExit.x).toBeUndefined();
    expect(pushExit.opacity).toBe(0);

    const popX = popExit.x as number[];
    expect(popX[0]).toBe(120);
    expect(popX[1]).toBe(210);

    const plainX = plainPopExit.x as number[];
    expect(plainX[0]).toBe(0);
    expect(plainX[1]).toBe(90);

    expect(tabExit.x).toBeUndefined();
    expect(tabExit.opacity).toBe(0);
  });

  it('entrada direcional: push entra com slide curto da direita, pop revela vindo da esquerda, tab é fade', () => {
    expect(resolveInitial(1).x).toBe(48);
    expect(resolveInitial(-1).x).toBe(-48);
    expect(resolveInitial(0).x).toBeUndefined();
  });
});