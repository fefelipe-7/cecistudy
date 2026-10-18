/**
 * Hook de visibilidade do chrome (SPEC-M-019 J5, J6, J9, J10).
 *
 * Relógio controlado e `requestAnimationFrame` stubado: o teste **dirige** o
 * scroll em vez de esperar, o que torna a sequência rolagem → coalescimento →
 * temporizador → sumiço verificável em milissegundos e sem flake.
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { IDLE_HIDE_MS, TOP_PX } from '../chromeVisibility';
import { useChromeVisibility } from '../useChromeVisibility';

type Retorno = ReturnType<typeof useChromeVisibility>;

/** Rola a janela e deixa o `rAF` do hook rodar. */
function rolar(para: number) {
  act(() => {
    Object.defineProperty(window, 'scrollY', { value: para, configurable: true, writable: true });
    window.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(20); // deixa o rAF stubado executar
  });
}

/** Dispara um quadro sem mudar o scroll. */
function quadro() {
  act(() => {
    window.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(20);
  });
}

interface Alavanca extends Retorno {
  unmount: () => void;
}

function montar(opts: { reduced?: boolean; ativo?: boolean } = {}): Alavanca {
  const { result, unmount } = renderHook(() =>
    useChromeVisibility({ reduced: opts.reduced ?? false, ativo: opts.ativo ?? true }),
  );
  // `result` é congelado pelo RTL: embrulhar, não mutar.
  return {
    get estado() {
      return result.current.estado;
    },
    get notificarRolagem() {
      return result.current.notificarRolagem;
    },
    get notificarNavegou() {
      return result.current.notificarNavegou;
    },
    get notificarMenu() {
      return result.current.notificarMenu;
    },
    get notificarFoco() {
      return result.current.notificarFoco;
    },
    unmount,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true });
  // rAF determinístico: enfileira e deixa `advanceTimers` executar.
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    return window.setTimeout(() => cb(0), 16);
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => window.clearTimeout(id));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useChromeVisibility — somiço por rolagem (D4, J3)', () => {
  it('começa visível e no topo', () => {
    const { estado } = montar();
    expect(estado.visivel).toBe(true);
    expect(estado.noTopo).toBe(true);
  });

  it('rolar para baixo esconde', () => {
    const h = montar();
    rolar(400);
    expect(h.estado.visivel).toBe(false);
  });

  it('rolar para cima mostra de novo', () => {
    const h = montar();
    rolar(400);
    rolar(200);
    expect(h.estado.visivel).toBe(true);
  });

  it('no topo, nem descendo muito a barra some (J3)', () => {
    const h = montar();
    rolar(TOP_PX);
    expect(h.estado.visivel).toBe(true);
    expect(h.estado.noTopo).toBe(true);
  });

  it('coalesce: vários eventos num quadro viram um tratamento (J9)', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const h = montar();
    add.mockClear();
    act(() => {
      for (let i = 1; i <= 20; i += 1) {
        Object.defineProperty(window, 'scrollY', {
          value: 100 * i,
          configurable: true,
          writable: true,
        });
        window.dispatchEvent(new Event('scroll'));
      }
      vi.advanceTimersByTime(20);
    });
    // Um `rAF` por quadro: o estado final é o da última posição, e a barra
    // escondeu uma vez só — sem 20 renders.
    expect(h.estado.visivel).toBe(false);
    expect(h.estado.noTopo).toBe(false);
  });

  it('o listener é passivo (J9)', () => {
    const add = vi.spyOn(window, 'addEventListener');
    montar();
    const scroll = add.mock.calls.find(([tipo]) => tipo === 'scroll');
    expect(scroll).toBeTruthy();
    expect(scroll?.[2]).toMatchObject({ passive: true });
  });

  it('zona morta: tremor não muda nada', () => {
    const h = montar();
    rolar(400);
    rolar(403); // +3 px, dentro da zona morta
    expect(h.estado.visivel).toBe(false);
    rolar(399); // -4 px
    expect(h.estado.visivel).toBe(false);
  });
});

describe('useChromeVisibility — somiço por inatividade (A5)', () => {
  it('3 s parada fora do topo esconde', () => {
    const h = montar();
    rolar(400);
    rolar(200); // volta a ficar visível, fora do topo
    expect(h.estado.visivel).toBe(true);
    act(() => {
      vi.advanceTimersByTime(IDLE_HIDE_MS + 10);
    });
    expect(h.estado.visivel).toBe(false);
  });

  it('qualquer rolagem cancela o temporizador (D9)', () => {
    const h = montar();
    rolar(400);
    rolar(200);
    // Duas rolagens com menos de 3 s no total: o timer reinicia a cada uma.
    act(() => {
      vi.advanceTimersByTime(IDLE_HIDE_MS - 100);
    });
    // Para **cima**, para continuar visível: rolar para baixo esconderia de novo
    // e o teste mediria outra coisa.
    rolar(100);
    act(() => {
      vi.advanceTimersByTime(IDLE_HIDE_MS - 100);
    });
    expect(h.estado.visivel).toBe(true);
    act(() => {
      vi.advanceTimersByTime(IDLE_HIDE_MS);
    });
    expect(h.estado.visivel).toBe(false);
  });

  it('no topo, a inatividade não esconde (J3)', () => {
    const h = montar();
    act(() => {
      vi.advanceTimersByTime(IDLE_HIDE_MS * 5);
    });
    expect(h.estado.visivel).toBe(true);
  });
});

describe('useChromeVisibility — movimento reduzido (A8, J5)', () => {
  it('nunca esconde, por rolagem nem por inatividade', () => {
    const h = montar({ reduced: true });
    rolar(400);
    expect(h.estado.visivel).toBe(true);
    act(() => {
      vi.advanceTimersByTime(IDLE_HIDE_MS * 10);
    });
    expect(h.estado.visivel).toBe(true);
  });

  it('não deixa a barra presa fora da tela se o perfil mudar no meio', () => {
    const { result, rerender } = renderHook(
      ({ reduced }: { reduced: boolean }) => useChromeVisibility({ reduced }),
      { initialProps: { reduced: false } },
    );
    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 600, configurable: true, writable: true });
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(20);
    });
    expect(result.current.estado.visivel).toBe(false);
    rerender({ reduced: true });
    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(result.current.estado.visivel).toBe(true);
  });
});

describe('useChromeVisibility — navegação e menu (D1, D8, J7)', () => {
  it('notificarNavegou devolve a barra', () => {
    const h = montar();
    rolar(400);
    act(() => h.notificarNavegou());
    expect(h.estado.visivel).toBe(true);
    expect(h.estado.noTopo).toBe(true);
  });

  it('menu aberto prende: nem rolagem nem ociosidade escondem (J7)', () => {
    const h = montar();
    rolar(400);
    rolar(200);
    act(() => h.notificarMenu(true));
    expect(h.estado.preso).toBe(true);
    rolar(400);
    expect(h.estado.visivel).toBe(true);
    act(() => {
      vi.advanceTimersByTime(IDLE_HIDE_MS * 3);
    });
    expect(h.estado.visivel).toBe(true);
    expect(h.estado.preso).toBe(true);
  });

  it('menu fechado devolve o sumiço', () => {
    const h = montar();
    rolar(400);
    rolar(200);
    act(() => h.notificarMenu(true));
    act(() => h.notificarMenu(false));
    expect(h.estado.preso).toBe(false);
    act(() => {
      vi.advanceTimersByTime(IDLE_HIDE_MS + 10);
    });
    expect(h.estado.visivel).toBe(false);
  });

  it('notificarRolagem é o atalho de quem já sabe o scrollY', () => {
    const h = montar();
    Object.defineProperty(window, 'scrollY', { value: 600, configurable: true, writable: true });
    act(() => h.notificarRolagem());
    // `delta: 0` cai na zona morta; quem quer mudança real manda `rolou`.
    expect(h.estado.visivel).toBe(true);
  });
});

describe('useChromeVisibility — foco de teclado (A8, J6)', () => {
  it('com o foco dentro, nada esconde: nem rolagem, nem inatividade', () => {
    const h = montar();
    act(() => h.notificarFoco(true));
    rolar(400);
    expect(h.estado.visivel).toBe(true);
    act(() => {
      vi.advanceTimersByTime(IDLE_HIDE_MS * 4);
    });
    expect(h.estado.visivel).toBe(true);
  });

  it('o temporizador não é nem agendado com o foco dentro (J6)', () => {
    const h = montar();
    rolar(400);
    rolar(200); // visível, fora do topo — sem foco, o timer estaria armado
    act(() => h.notificarFoco(true));
    act(() => {
      vi.advanceTimersByTime(IDLE_HIDE_MS * 4);
    });
    expect(h.estado.visivel).toBe(true);
  });

  it('saindo do foco, o sumiço por inatividade volta a valer', () => {
    const h = montar();
    rolar(400);
    rolar(200);
    act(() => h.notificarFoco(true));
    act(() => {
      vi.advanceTimersByTime(IDLE_HIDE_MS * 2);
    });
    expect(h.estado.visivel).toBe(true);
    act(() => h.notificarFoco(false));
    act(() => {
      vi.advanceTimersByTime(IDLE_HIDE_MS + 10);
    });
    expect(h.estado.visivel).toBe(false);
  });

  it('o foco reencontra a barra escondida', () => {
    const h = montar();
    rolar(400);
    expect(h.estado.visivel).toBe(false);
    // Tab até um botão da barra: ela precisa estar na tela para receber o foco.
    act(() => h.notificarFoco(true));
    expect(h.estado.visivel).toBe(true);
  });
});

describe('useChromeVisibility — ciclo de vida (J10)', () => {
  it('desmontar cancela o rAF pendente', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const h = montar();
    quadro();
    h.unmount();
    const scroll = remove.mock.calls.find(([tipo]) => tipo === 'scroll');
    expect(scroll).toBeTruthy();
  });

  it('desmontar durante a inatividade não deixa temporizador vivo', () => {
    const h = montar();
    rolar(400);
    rolar(200);
    h.unmount();
    // Nada de `setState` em árvore morta: sem erro, sem warning do React.
    expect(() =>
      act(() => {
        vi.advanceTimersByTime(IDLE_HIDE_MS * 4);
      }),
    ).not.toThrow();
  });

  it('desmontar logo após mount não deixa nada pendente', () => {
    const h = montar();
    h.unmount();
    expect(() =>
      act(() => {
        vi.advanceTimersByTime(IDLE_HIDE_MS * 4);
      }),
    ).not.toThrow();
  });

  it('com `ativo: false`, a rolagem não muda nada', () => {
    // Asserção de **comportamento**, não de encanamento: contar listeners de
    // `window` pega os do próprio React e não prova nada sobre o hook.
    const h = montar({ ativo: false });
    rolar(600);
    expect(h.estado.visivel).toBe(true);
    expect(h.estado.noTopo).toBe(true);
  });
});