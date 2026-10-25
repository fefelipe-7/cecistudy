import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Reveal } from '@/lib/motion';
import { RevealProvider } from '@/components/motion/RevealProvider';
import { FakeIntersectionObserver } from './fakeIntersectionObserver';

/**
 * O que este teste protege que outro gate não protege: **o reveal nunca esconde
 * conteúdo** (SPEC-M-027 D6 · F5.5). A falha perigosa aqui não é "não animou", é
 * "o item ficou invisível porque o observer não respondeu" — por isso o estado
 * inicial é visível, e o primeiro callback só *arma* quem está fora da tela.
 */

const opacityOf = (text: string) =>
  Number((screen.getByText(text) as HTMLElement).style.opacity || 1);

beforeEach(() => {
  FakeIntersectionObserver.last = null;
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Reveal', () => {
  it('conteúdo visível antes de qualquer callback, e continua visível se já estava na tela', async () => {
    render(
      <RevealProvider>
        <Reveal index={0}>primeiro</Reveal>
      </RevealProvider>,
    );

    expect(opacityOf('primeiro')).toBe(1);

    FakeIntersectionObserver.last?.trigger(true);
    await waitFor(() => expect(opacityOf('primeiro')).toBe(1));

    // Já visível no primeiro paint: o item se desinscreve e nunca arma.
    expect(FakeIntersectionObserver.last?.targets.size).toBe(0);
  });

  it('arma quem está fora da tela e entra quando cruza o viewport', async () => {
    render(
      <RevealProvider>
        <Reveal index={2}>abaixo da dobra</Reveal>
      </RevealProvider>,
    );

    FakeIntersectionObserver.last?.trigger(false);
    await waitFor(() => expect(opacityOf('abaixo da dobra')).toBe(0));

    FakeIntersectionObserver.last?.trigger(true);
    await waitFor(() => expect(opacityOf('abaixo da dobra')).toBe(1));
    expect(FakeIntersectionObserver.last?.targets.size).toBe(0);
  });

  it('desconecta o observer no unmount', () => {
    const { unmount } = render(
      <RevealProvider>
        <Reveal>some junto</Reveal>
      </RevealProvider>,
    );

    const observer = FakeIntersectionObserver.last;
    expect(observer?.targets.size).toBe(1);

    unmount();
    expect(observer?.disconnected).toBe(true);
  });
});
