import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getFrozenExitScrollY, planScroll, scrollToTop } from '../scroll';

/**
 * O que este teste protege que outro gate não protege: **a posição de scroll por
 * tela** (SPEC-M-027 D5). O motor de navegação chama `scrollToTop()` em ~30
 * ações; se o plano de scroll se perder, a usuária volta de um detalhe para a
 * lista e cai no topo — e nenhum outro teste olha para isso.
 */

let scrollY = 0;
const scrollTo = vi.fn();

beforeEach(() => {
  scrollY = 0;
  scrollTo.mockReset();
  Object.defineProperty(window, 'scrollY', { configurable: true, get: () => scrollY });
  Object.defineProperty(window, 'scrollTo', { configurable: true, writable: true, value: scrollTo });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('scroll por tela', () => {
  it('push começa no topo; voltar restaura onde a lista estava', () => {
    scrollY = 420;
    planScroll('tab-home', 'course-c1', false);
    scrollToTop();
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'auto' });

    scrollY = 0;
    planScroll('course-c1', 'tab-home', true);
    scrollToTop();
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 420, behavior: 'auto' });
  });

  it('primeira visita restaura 0', () => {
    planScroll('tab-perfil', 'tab-estudo', true);
    scrollToTop();
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'auto' });
  });

  it('overlay não muda a tela de baixo: devolve a mesma posição', () => {
    scrollY = 300;
    planScroll('notes', 'notes', true);
    scrollToTop();
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 300, behavior: 'auto' });
  });

  it('congela a posição da tela que sai antes de restaurar (F6.2)', () => {
    scrollY = 700;
    planScroll('tab-biblioteca', 'tab-home', true);
    scrollToTop();
    expect(getFrozenExitScrollY()).toBe(700);
  });

  it('sem plano, continua indo ao topo (chamada avulsa)', () => {
    scrollY = 90;
    scrollToTop();
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'auto' });
    expect(getFrozenExitScrollY()).toBe(90);
  });
});
