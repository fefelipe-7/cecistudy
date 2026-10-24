/**
 * Lifecycle do EdgeSwipeBack — spec-performance.md §7 Fase 9, item F9.4
 * ("não há listeners duplicados após 20 navegações" — a parte automatizável
 * aqui: o gesto de borda não pode vazar listeners da janela ao remontar).
 *
 * O que este teste garante:
 * - com ponteiro coarse: 20 montagens instalam e DESINSTALAM simetricamente
 *   os 4 listeners da janela (zero acúmulo);
 * - em ponteiro fino (desktop): nenhum listener é instalado;
 * - sob Reduzir Movimento: nenhum listener é instalado (SPEC-007 D8) — o
 *   componente nem se registra.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MotionValue } from 'framer-motion';
import { EdgeSwipeBack } from '../EdgeSwipeBack';

/** `swipeX` real do framer-motion — o componente só anima o valor. */
const makeSwipeX = (): MotionValue<number> => new MotionValue(0);

function renderGesture() {
  return render(<EdgeSwipeBack swipeX={makeSwipeX()} onBack={() => true} canGoBack={true} />);
}

/**
 * Stub **por query**.
 *
 * ⚠️ A versão anterior devolvia o mesmo `matches` para qualquer media query —
 * então `setCoarsePointer(true)` também fazia `'(prefers-reduced-motion: reduce)'`
 * casar. Isso era invisível enquanto o componente não olhava a preferência; com o
 * perfil mandando em `gesturesEnabled` (SPEC-007 D8), o mesmo stub desligava o
 * gesto e o teste acusava leak onde não havia.
 */
function stubMedia({ coarse = true, reduced = false } = {}): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('pointer: coarse') ? coarse : reduced,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

let addSpy: ReturnType<typeof vi.spyOn>;
let removeSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  stubMedia();
  addSpy = vi.spyOn(window, 'addEventListener');
  removeSpy = vi.spyOn(window, 'removeEventListener');
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  addSpy.mockRestore();
  removeSpy.mockRestore();
});

const GESTURE_EVENTS = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'];
const gestureAdds = () =>
  addSpy.mock.calls.filter(([type]) => GESTURE_EVENTS.includes(type as string)).length;

describe('EdgeSwipeBack — lifecycle de listeners (spec §9.4)', () => {
  it('20 remontagens não acumulam listeners da janela (coarse pointer)', () => {
    for (let i = 0; i < 20; i += 1) {
      const { unmount } = renderGesture();
      unmount();
    }

    const added = gestureAdds();
    const removed = removeSpy.mock.calls.filter(([type]) =>
      GESTURE_EVENTS.includes(type as string),
    ).length;
    expect(added).toBe(20 * GESTURE_EVENTS.length);
    expect(removed).toBe(added);
  });

  it('ponteiro fino (desktop): nenhum listener de gesto instalado', () => {
    stubMedia({ coarse: false });
    const { unmount } = renderGesture();
    unmount();

    expect(gestureAdds()).toBe(0);
  });

  // SPEC-007 D8 / WCAG 2.3.3. Este é o teste que falha se o `gesturesEnabled`
  // voltar a ser só documentação: o perfil reduzido tem que **desligar** o
  // gesto, não encurtá-lo.
  it('Reduzir Movimento: nenhum listener de gesto instalado', () => {
    stubMedia({ coarse: true, reduced: true });
    const { unmount } = renderGesture();
    unmount();

    expect(gestureAdds()).toBe(0);
  });
});
