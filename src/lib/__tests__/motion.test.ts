import { describe, expect, it } from 'vitest';
import { screenVariants, setNavMotionContext } from '../motion';

describe('screenVariants (motion de navegação)', () => {
  it('consome a direção/gesto do contexto a cada exit — sem valor velho no próximo pop', () => {
    // push: a tela coberta faz parallax p/ a esquerda
    setNavMotionContext(1);
    const pushExit = (screenVariants.exit as () => Record<string, unknown>)();

    // pop iniciado pelo gesto de borda: exit parte do ponto do dedo (px)
    setNavMotionContext(-1, 120);
    const popExit = (screenVariants.exit as () => Record<string, unknown>)();

    // pop sem gesto depois: o contexto foi consumido e volta a 0
    setNavMotionContext(-1);
    const plainPopExit = (screenVariants.exit as () => Record<string, unknown>)();

    // troca de tab: fade puro, sem deslocamento
    setNavMotionContext(0);
    const tabExit = (screenVariants.exit as () => Record<string, unknown>)();

    expect(pushExit.x).toBe('-5%');
    expect(pushExit.opacity).toBe(0.9);

    const popX = popExit.x as number[];
    expect(popX[0]).toBe(120);
    expect(popX[1]).toBeGreaterThanOrEqual(210);

    const plainX = plainPopExit.x as number[];
    expect(plainX[0]).toBe(0);
    expect(plainX[1]).toBeGreaterThanOrEqual(220);

    expect(tabExit.x).toBeUndefined();
    expect(tabExit.opacity).toBe(0);
  });

  it('entrada direcional: push entra da direita, pop revela vindo da esquerda, tab é fade', () => {
    const direct = (d: number) => (screenVariants.initial as (dir: number) => Record<string, unknown>)(d);
    expect(direct(1).x).toBe('18%');
    expect(direct(-1).x).toBe('-14%');
    expect(direct(0).x).toBeUndefined();
  });
});