/**
 * Contrato da atividade de um elemento na tela (`useElementActivity`).
 *
 * A regra: um loop ornamental (o vídeo do hero, os gráficos dithered) só
 * corre quando o elemento está na viewport **E** o documento está visível.
 * `spec-performance.md` RF-05/RNF-03.
 *
 * As duas metades importam, e o teste prova as duas:
 *
 * - **Fora da viewport** → inativo. O app não continua animando algo que
 *   ninguém vê.
 * - **Documento oculto** → inativo. A aba em segundo plano não consome.
 *
 * E o caso que o `useCanvasSetup` já corrigiu (F4): montar com a aba **já**
 * escondida não pode esperar um `visibilitychange` para saber que está
 * inativo.
 */
import React from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useElementActivity } from '../useElementActivity';

/**
 * Harness: expõe o ref de atividade e registra as transições.
 *
 * O ref é lido **de fora**, no momento da asserção — e não durante o render.
 * A atividade é um ref justamente para não re-renderizar: quem muda o valor
 * não redesenha nada, e um teste que lê o valor durante o render mede o
 * valor antigo.
 */
let refAtivo: { current: boolean } | null = null;
let transicoes: boolean[] = [];

function Harness() {
  const alvo = { current: null } as React.RefObject<Element | null>;
  const { isActive, onActivityChange } = useElementActivity(alvo);
  refAtivo = isActive;
  React.useEffect(() => onActivityChange((active) => transicoes.push(active)), [onActivityChange]);
  return <div data-testid="alvo" ref={alvo as never} />;
}

/** Um IntersectionObserver que o teste comanda. */
let ioCallback: ((entries: Array<{ isIntersecting: boolean }>) => void) | null = null;

function setVisibility(value: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { value, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  refAtivo = null;
  transicoes = [];
  ioCallback = null;

  class FakeIO {
    constructor(cb: (entries: Array<{ isIntersecting: boolean }>) => void) {
      ioCallback = cb;
    }
    observe() {}
    disconnect() {}
    unobserve() {}
  }
  vi.stubGlobal('IntersectionObserver', FakeIO as unknown as typeof IntersectionObserver);
  setVisibility('visible');
});

afterEach(() => {
  vi.unstubAllGlobals();
  setVisibility('visible');
});

describe('useElementActivity (spec-performance §5.1)', () => {
  it('começa ativo: elemento na viewport e documento visível', () => {
    render(<Harness />);
    expect(refAtivo?.current).toBe(true);
  });

  it('fica inativo quando sai da viewport', () => {
    render(<Harness />);
    act(() => {
      ioCallback?.([{ isIntersecting: false }]);
    });
    expect(refAtivo?.current).toBe(false);
    expect(transicoes).toContain(false);
  });

  it('fica inativo quando o documento fica oculto', () => {
    render(<Harness />);
    act(() => setVisibility('hidden'));
    expect(refAtivo?.current).toBe(false);
  });

  it('volta a ficar ativo quando a viewport volta E o documento reaparece', () => {
    render(<Harness />);
    act(() => {
      ioCallback?.([{ isIntersecting: false }]);
    });
    expect(refAtivo?.current).toBe(false);
    act(() => {
      ioCallback?.([{ isIntersecting: true }]);
    });
    expect(refAtivo?.current).toBe(true);
  });

  it('documento oculto no mount: nasce inativo, sem esperar evento', () => {
    setVisibility('hidden');
    render(<Harness />);
    expect(refAtivo?.current).toBe(false);
  });
});
