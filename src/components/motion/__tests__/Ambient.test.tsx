import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { Ambient } from '../Ambient';
import { MotionProfileProvider } from '../MotionProfileProvider';
import { FakeIntersectionObserver } from '@/lib/__tests__/motion/fakeIntersectionObserver';

/**
 * O que este teste protege que outro gate não protege: **o ambiente pausa**
 * (SPEC-M-027 D13 · I11). Um loop decorativo que continua rodando com a aba
 * oculta é dreno de bateria em WebView, e nenhum outro gate olha para isso.
 */

const wrapper = () => screen.getByText('arte').parentElement as HTMLElement;
const paused = () => wrapper().classList.contains('ambient-paused');

beforeEach(() => {
  FakeIntersectionObserver.last = null;
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Ambient', () => {
  it('anima quando visível e pausa quando sai do viewport', async () => {
    render(
      <Ambient>
        <span>arte</span>
      </Ambient>,
    );

    expect(wrapper().classList.contains('ambient')).toBe(true);
    expect(paused()).toBe(false);

    FakeIntersectionObserver.last?.trigger(false);
    await waitFor(() => expect(paused()).toBe(true));

    FakeIntersectionObserver.last?.trigger(true);
    await waitFor(() => expect(paused()).toBe(false));
  });

  it('pausa com a aba oculta', async () => {
    render(
      <Ambient>
        <span>arte</span>
      </Ambient>,
    );

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });
    document.dispatchEvent(new Event('visibilitychange'));

    await waitFor(() => expect(paused()).toBe(true));

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
  });

  it('no perfil reduzido nem monta a animação', () => {
    render(
      <MotionProfileProvider override>
        <Ambient>
          <span>arte</span>
        </Ambient>
      </MotionProfileProvider>,
    );

    expect(wrapper().classList.contains('ambient')).toBe(false);
    expect(wrapper().style.animationDuration).toBe('');
  });
});
